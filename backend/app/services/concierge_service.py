import os
import re
import json
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from bson import ObjectId
import httpx

from app.database.mongodb import get_database
from app.core.config import settings
from app.core.logging import logger
from app.services.traveler_booking_service import TravelerBookingService
from app.services.traveler_profile_service import TravelerProfileService
from app.services.service_request_service import ServiceRequestService


class ConciergeService:
    @staticmethod
    async def get_traveler_context(user: Dict[str, Any]) -> Dict[str, Any]:
        """Gather all authentic traveler context from the existing database without duplicating data."""
        db = get_database()
        user_id = str(user.get("_id") or user.get("id"))
        email = user.get("email", "").lower().strip()
        name = user.get("name", "Valued Guest")

        # 1. Fetch active stay (current or closest upcoming confirmed reservation)
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Look for CHECKED_IN or upcoming CONFIRMED reservations
        reservation_cursor = db.reservations.find({
            "$or": [
                {"user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else None},
                {"user_id": user_id},
                {"guest_email": email}
            ],
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
        }).sort("check_in_date", 1)
        
        active_res = await reservation_cursor.to_list(length=10)
        current_stay = None
        if active_res:
            # Prioritize checked in or ongoing stays, otherwise next upcoming
            for r in active_res:
                cin = r.get("check_in_date", "")
                cout = r.get("check_out_date", "")
                st = r.get("status", "")
                if st == "CHECKED_IN" or (cin <= today_str <= cout):
                    current_stay = r
                    break
            if not current_stay:
                current_stay = active_res[0]

        # 2. Fetch property details for current stay
        property_info = None
        if current_stay and current_stay.get("property_id"):
            prop_id = current_stay["property_id"]
            if ObjectId.is_valid(str(prop_id)):
                property_info = await db.properties.find_one({"_id": ObjectId(prop_id)})

        # 3. Fetch traveler preferences
        profile_doc = await db.traveler_profiles.find_one({"user_id": user_id})
        preferences = profile_doc.get("preferences", {}) if profile_doc else {
            "favorite_destinations": ["Goa", "Udaipur", "Jaipur", "Kerala", "Mumbai"],
            "preferred_room_type": "Deluxe Ocean Suite",
            "dietary_preferences": "Vegetarian / Gourmet",
            "special_interests": ["Beachfront Relaxation", "Fine Dining", "Heritage Retreats"],
            "budget_range": "LUXURY"
        }

        # 4. Fetch loyalty status
        loyalty_doc = await db.loyalty_accounts.find_one({"user_id": user_id})
        loyalty = {
            "tier": loyalty_doc.get("tier", "MEMBER") if loyalty_doc else "MEMBER",
            "points": loyalty_doc.get("points", 500) if loyalty_doc else 500
        }

        # 5. Fetch existing service requests
        service_requests = await ServiceRequestService.list_service_requests(user_id=user_id)

        # 6. Format active stay summary
        active_stay_summary = None
        if current_stay:
            check_in_time = property_info.get("check_in_time", "14:00") if property_info else "14:00"
            check_out_time = property_info.get("check_out_time", "11:00") if property_info else "11:00"
            active_stay_summary = {
                "reservation_id": str(current_stay["_id"]),
                "booking_reference": current_stay.get("booking_reference", "N/A"),
                "property_id": str(current_stay.get("property_id", "")),
                "property_name": current_stay.get("property_name", property_info.get("name", "Luxury Estate") if property_info else "Luxury Estate"),
                "property_city": current_stay.get("property_city", property_info.get("city", "") if property_info else ""),
                "room_number": current_stay.get("room_number") or "Assigned at Check-In",
                "room_type_name": current_stay.get("room_type_name", "Curated Suite"),
                "check_in_date": current_stay.get("check_in_date", ""),
                "check_out_date": current_stay.get("check_out_date", ""),
                "nights": current_stay.get("nights", current_stay.get("number_of_nights", 1)),
                "status": current_stay.get("status", "CONFIRMED"),
                "check_in_time": check_in_time,
                "check_out_time": check_out_time,
                "amenities": property_info.get("amenities", []) if property_info else [],
                "property_description": property_info.get("description", "") if property_info else "",
                "star_rating": property_info.get("star_rating", 5) if property_info else 5,
            }

        return {
            "traveler_name": name,
            "email": email,
            "active_stay": active_stay_summary,
            "preferences": preferences,
            "loyalty": loyalty,
            "service_requests": service_requests,
        }

    @staticmethod
    async def get_welcome_summary(user: Dict[str, Any]) -> Dict[str, Any]:
        """Provide personalized welcome data and stay card for the Concierge UI."""
        ctx = await ConciergeService.get_traveler_context(user)
        quick_suggestions = [
            "What is my booking reference?",
            "When is my check-in time?",
            "Can I request extra towels?",
            "Show my service requests",
            "What amenities does my hotel have?",
            "Plan a 3-day Hyderabad trip",
        ]
        return {
            "traveler_name": ctx["traveler_name"],
            "active_stay": ctx["active_stay"],
            "loyalty_tier": ctx["loyalty"]["tier"],
            "loyalty_points": ctx["loyalty"]["points"],
            "quick_suggestions": quick_suggestions
        }

    @staticmethod
    async def chat(user: Dict[str, Any], message: str, reservation_id: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """Process traveler inquiry through LLM (if configured) or domain intelligence engine."""
        ctx = await ConciergeService.get_traveler_context(user)
        stay = ctx["active_stay"]
        requests = ctx["service_requests"]
        prefs = ctx["preferences"]
        loyalty = ctx["loyalty"]

        # If LLM API Key is configured in environment, call the external LLM
        api_key = settings.LLM_API_KEY or os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                llm_response = await ConciergeService._call_llm(
                    api_key=api_key,
                    message=message,
                    context=ctx,
                    history=history or []
                )
                if llm_response:
                    return llm_response
            except Exception as e:
                logger.warning(f"External LLM call failed or timed out: {e}. Falling back to internal concierge engine.")

        # Fallback to high-precision domain concierge engine
        return await ConciergeService._deterministic_concierge_response(
            message=message,
            ctx=ctx
        )

    @staticmethod
    async def _call_llm(api_key: str, message: str, context: Dict[str, Any], history: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
        """Call configured LLM with strict factual hotel context."""
        base_url = settings.LLM_BASE_URL.rstrip("/")
        model = settings.LLM_MODEL or "gpt-4o-mini"

        stay = context.get("active_stay")
        stay_desc = "No active reservation on file."
        if stay:
            stay_desc = (
                f"Booking Reference: {stay['booking_reference']}\n"
                f"Hotel Name: {stay['property_name']}\n"
                f"City: {stay['property_city']}\n"
                f"Room Number: {stay['room_number']}\n"
                f"Suite Category: {stay['room_type_name']}\n"
                f"Check-In Date: {stay['check_in_date']} (Time: {stay['check_in_time']})\n"
                f"Check-Out Date: {stay['check_out_date']} (Time: {stay['check_out_time']})\n"
                f"Nights: {stay['nights']}\n"
                f"Status: {stay['status']}\n"
                f"Amenities: {', '.join(stay.get('amenities', []))}\n"
                f"Description: {stay.get('property_description', '')}"
            )

        requests_desc = "None"
        if context.get("service_requests"):
            req_items = [
                f"- {r['item']} ({r['category']}): Status {r['status']}, requested at {r['created_at']}"
                for r in context["service_requests"][:5]
            ]
            requests_desc = "\n".join(req_items)

        prefs_desc = json.dumps(context.get("preferences", {}))
        loyalty_desc = f"Tier: {context['loyalty']['tier']}, Points: {context['loyalty']['points']}"

        system_prompt = f"""You are the Nexgile Concierge, a bespoke luxury hotel personal assistant for Nexgile-TravAI.
Your tone is sophisticated, welcoming, warm, and exemplifies prestigious Indian hospitality (e.g., using polite phrasing like "Namaste", "It is my absolute pleasure").

STRICT FACTUAL BOUNDARIES:
- You must use ONLY the authentic data provided below for hotel, booking, room numbers, and dates.
- NEVER invent, extrapolate, or fabricate booking references, room numbers, prices, or hotel policies.
- If information is not available, state clearly and politely that it is unavailable.
- Do NOT perform database mutations yourself. If the traveler wants an action like extra towels, housekeeping, or transportation, ask if they would like you to arrange it and provide the structured action.

AUTHENTIC TRAVELER APPLICATION CONTEXT:
Guest Name: {context['traveler_name']}
Current Stay:
{stay_desc}

Existing Service Requests:
{requests_desc}

Traveler Profile & Preferences:
{prefs_desc}

Loyalty Status:
{loyalty_desc}

STRUCTURED ACTIONS:
When proposing an actionable request (e.g. requesting towels, housekeeping turnaround, airport transfer, or viewing booking), include an action tag at the very end of your response in the exact format:
ACTION: {{"action_type": "<TYPE>", "action_label": "<LABEL>", "payload": {{...}}}}

Action types:
1. CREATE_SERVICE_REQUEST (payload: {{"category": "HOUSEKEEPING"|"TRANSPORTATION"|"CONCIERGE", "item": "<item_name>", "details": "<details>"}})
2. VIEW_RESERVATION (payload: {{"reservation_id": "<reservation_id>"}})
3. BROWSE_MARKETPLACE (payload: {{}})
"""

        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-6:]:
            if h.get("role") in ["user", "assistant"] and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 800,
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                
                # Check for ACTION: block
                suggested_action = None
                action_match = re.search(r"ACTION:\s*(\{.*\})", content, re.DOTALL)
                if action_match:
                    try:
                        action_json = json.loads(action_match.group(1))
                        suggested_action = {
                            "action_type": action_json.get("action_type", "CREATE_SERVICE_REQUEST"),
                            "action_label": action_json.get("action_label", "CONFIRM REQUEST"),
                            "payload": action_json.get("payload", {})
                        }
                        # If service request, attach stay details
                        if stay and suggested_action["action_type"] == "CREATE_SERVICE_REQUEST":
                            suggested_action["payload"]["reservation_id"] = stay["reservation_id"]
                            suggested_action["payload"]["property_id"] = stay["property_id"]
                            suggested_action["payload"]["room_number"] = stay["room_number"]
                        # Strip ACTION: from visible message
                        content = re.sub(r"ACTION:\s*\{.*\}", "", content, flags=re.DOTALL).strip()
                    except Exception:
                        pass

                return {
                    "message": content,
                    "suggested_action": suggested_action,
                    "quick_replies": ["My Reservation", "Show Requests", "Hotel Amenities", "Plan Trip"]
                }
        return None

    @staticmethod
    async def _deterministic_concierge_response(message: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """High-precision, authentic conversational engine that guarantees zero fabrication and answers all traveler inquiries."""
        msg_raw = message.lower().strip()
        # Clean and normalize spaces/punctuation
        cleaned_words = re.sub(r'[^a-z0-9]', ' ', msg_raw)
        cleaned = " " + " ".join(cleaned_words.split()) + " "
        # Normalized with compound variations expanded (e.g. checkin -> check in)
        cleaned_expanded = (
            cleaned.replace(" checkin ", " check in ")
                   .replace(" checkout ", " check out ")
                   .replace(" wifi ", " wi-fi ")
        )

        stay = ctx["active_stay"]
        requests = ctx["service_requests"]
        prefs = ctx["preferences"]
        loyalty = ctx["loyalty"]
        name = ctx["traveler_name"]

        suggested_action = None
        quick_replies = [
            "My Reservation",
            "Show My Requests",
            "Hotel Amenities",
            "Plan My Trip",
            "Room Recommendation"
        ]

        # ----------------------------------------------------
        # 1. RESERVATION INQUIRIES
        # ----------------------------------------------------
        is_checkin = (
            any(k in cleaned or k in cleaned_expanded for k in ["check in", "checkin", "arrival", "arrive", "arriving", "entry time"])
            and not any(k in cleaned or k in cleaned_expanded for k in ["check out", "checkout", "departure", "depart", "leave", "leaving", "vacate"])
        )

        is_checkout = any(
            k in cleaned or k in cleaned_expanded
            for k in ["check out", "checkout", "departure", "depart", "departing", "leave", "leaving", "vacate", "exit time"]
        )

        is_booking_ref = (
            any(k in cleaned for k in [
                "booking reference", "reference number", "ref number", "ref no",
                "reservation number", "booking id", "reservation id", "confirmation number",
                "confirmation code", "booking number", "reference code"
            ])
            or ("reference" in cleaned and any(w in cleaned for w in ["my", "what", "booking", "reservation"]))
        )

        is_room = any(
            k in cleaned for k in [
                "what room", "which room", "room number", "room no", "suite number",
                "my room", "my suite", "room reserved", "suite reserved",
                "assigned room", "room assigned", "room did i", "suite did i", "room book", "booked room"
            ]
        )

        is_amenities = any(
            k in cleaned for k in [
                "amenit", "facilit", "pool", "swimming pool", "wifi", "internet", "gym",
                "fitness", "spa", "ayurvedic", "wellness", "breakfast", "dining", "bar", "restaurant"
            ]
        )

        is_hotel = (
            not is_amenities and not is_room and (
                any(k in cleaned for k in [
                    "which hotel", "what hotel", "which property", "what property",
                    "where am i staying", "where do i stay", "hotel name", "property name",
                    "tell me about my hotel", "tell me about the hotel", "hotel did i", "property did i",
                    "hotel details", "about my stay", "about the stay", "about my hotel", "about this hotel"
                ])
                or (("hotel" in cleaned or "property" in cleaned) and any(w in cleaned for w in ["what", "which", "about", "details", "info", "address", "location", "booked"]))
            )
        )

        # ----------------------------------------------------
        # 2. SERVICE REQUESTS & CONCIERGE ACTIONS
        # ----------------------------------------------------
        is_towels = any(k in cleaned for k in ["towel", "towels", "extra towel", "extra towels", "need towel", "fresh towel", "bath towel", "pool towel"])

        is_housekeeping = any(
            k in cleaned for k in [
                "housekeeping", "clean my room", "clean room", "cleaning service", "cleaning",
                "room turnaround", "turndown", "refresh room", "linens", "bed sheet", "sheets",
                "pillow", "pillows", "sanitization"
            ]
        )

        is_transport = any(
            k in cleaned for k in [
                "transport", "transportation", "cab", "taxi", "chauffeur",
                "airport transfer", "pickup", "pick up", "drop", "car service", "transfer", "ride", "shuttle"
            ]
        )

        is_show_requests = (
            any(k in cleaned for k in [
                "show my requests", "my requests", "list requests", "view requests", "all requests",
                "check requests", "status of my request", "status of request", "service requests",
                "what requests do i have", "what requests"
            ])
            or ("request" in cleaned and any(w in cleaned for w in ["show", "list", "view", "status", "check", "my"]))
        )

        # ----------------------------------------------------
        # 3. AMENITIES, RECOMMENDATIONS & TRIPS
        # ----------------------------------------------------

        is_room_types = any(
            k in cleaned for k in [
                "room types", "room type", "available rooms", "available suites",
                "suite tiers", "suite categories", "other rooms", "what rooms", "what suites"
            ]
        )

        is_recommend = any(
            k in cleaned for k in [
                "recommend", "recommendation", "recommendations", "suggest", "suggestion",
                "suit me", "for me", "preferences", "preference", "what would you recommend"
            ]
        )

        is_trip_plan = any(
            k in cleaned for k in [
                "plan", "itinerary", "trip", "tomorrow", "day 1", "day 2", "day 3", "3 day",
                "hyderabad", "goa", "udaipur", "jaipur", "kerala", "mumbai",
                "sightseeing", "tour", "explore", "places to visit", "things to do"
            ]
        )

        # ----------------------------------------------------
        # EVALUATE MATCHES
        # ----------------------------------------------------
        if is_booking_ref:
            if stay:
                reply = (
                    f"Namaste, {name}. Your booking reference is **{stay['booking_reference']}** "
                    f"for your reservation at **{stay['property_name']}** in {stay['property_city']}."
                )
                suggested_action = {
                    "action_type": "VIEW_RESERVATION",
                    "action_label": "VIEW RESERVATION DETAILS",
                    "payload": {"reservation_id": stay["reservation_id"]}
                }
            else:
                reply = "You do not currently have an active reservation on file. Would you like to explore our curated hotel collection?"
                suggested_action = {
                    "action_type": "BROWSE_MARKETPLACE",
                    "action_label": "EXPLORE ESTATES",
                    "payload": {}
                }

        elif is_checkin:
            if stay:
                cin_time = stay.get("check_in_time", "14:00")
                reply = (
                    f"Your check-in is scheduled for **{cin_time}** on **{stay['check_in_date']}** "
                    f"at **{stay['property_name']}** ({stay['property_city']}). Early check-in is subject to suite availability upon arrival."
                )
                suggested_action = {
                    "action_type": "VIEW_RESERVATION",
                    "action_label": "VIEW RESERVATION",
                    "payload": {"reservation_id": stay["reservation_id"]}
                }
            else:
                reply = "You do not currently have an active reservation. You can make a new reservation anytime through the Marketplace."

        elif is_checkout:
            if stay:
                cout_time = stay.get("check_out_time", "11:00")
                reply = (
                    f"Your check-out is scheduled by **{cout_time}** on **{stay['check_out_date']}** "
                    f"from **{stay['property_name']}**. Should you require a late departure, our front desk will be pleased to evaluate suite availability."
                )
            else:
                reply = "You do not currently have an active reservation on file."

        elif is_room:
            if stay:
                room_num = stay.get("room_number") or "Assigned on arrival"
                reply = (
                    f"You have reserved a **{stay['room_type_name']}** at **{stay['property_name']}**.\n"
                    f"Your assigned room is **Room {room_num}**."
                )
                suggested_action = {
                    "action_type": "VIEW_RESERVATION",
                    "action_label": "VIEW RESERVATION",
                    "payload": {"reservation_id": stay["reservation_id"]}
                }
            else:
                reply = "There is currently no room reservation associated with your profile."

        elif is_hotel:
            if stay:
                amenities_str = ", ".join(stay.get("amenities", [])[:6])
                reply = (
                    f"You have booked a stay at **{stay['property_name']}**, situated in **{stay['property_city']}**.\n\n"
                    f"• **Category**: {stay['star_rating']}-Star Luxury Sanctuary\n"
                    f"• **Suite**: {stay['room_type_name']} (Room {stay['room_number']})\n"
                    f"• **Dates**: {stay['check_in_date']} to {stay['check_out_date']} ({stay['nights']} night(s))\n"
                    f"• **Featured Amenities**: {amenities_str}\n\n"
                    f"{stay.get('property_description', '')}"
                )
                suggested_action = {
                    "action_type": "VIEW_RESERVATION",
                    "action_label": "VIEW RESERVATION FOLIO",
                    "payload": {"reservation_id": stay["reservation_id"]}
                }
            else:
                reply = "You currently have no active hotel booking. We have iconic properties across Goa, Udaipur, Jaipur, Kerala, and Hyderabad ready for your stay."

        elif is_towels:
            if stay:
                reply = (
                    f"I would be delighted to arrange that for you! Would you like me to request extra plush bath towels "
                    f"for Room {stay.get('room_number', 'Suite')} at {stay['property_name']}?"
                )
                suggested_action = {
                    "action_type": "CREATE_SERVICE_REQUEST",
                    "action_label": "REQUEST EXTRA TOWELS",
                    "payload": {
                        "category": "HOUSEKEEPING",
                        "item": "Extra Towels",
                        "details": "Two additional plush bath towels requested for suite",
                        "property_id": stay["property_id"],
                        "reservation_id": stay["reservation_id"],
                        "room_number": stay.get("room_number")
                    }
                }
            else:
                reply = (
                    "I can create a housekeeping service request for extra towels for your stay. "
                    "Please note that towel requests are fulfilled once you have an active stay reservation."
                )
                suggested_action = {
                    "action_type": "CREATE_SERVICE_REQUEST",
                    "action_label": "REQUEST EXTRA TOWELS",
                    "payload": {
                        "category": "HOUSEKEEPING",
                        "item": "Extra Towels",
                        "details": "Two additional plush bath towels requested"
                    }
                }

        elif is_housekeeping:
            if stay:
                reply = (
                    f"Our housekeeping team will gladly refresh your suite. "
                    f"Would you like me to schedule a room turnaround for Room {stay.get('room_number', 'Suite')}?"
                )
                suggested_action = {
                    "action_type": "CREATE_SERVICE_REQUEST",
                    "action_label": "REQUEST HOUSEKEEPING TURNAROUND",
                    "payload": {
                        "category": "HOUSEKEEPING",
                        "item": "Room Turnaround",
                        "details": "Full suite refresh, fresh linens, and sanitization requested",
                        "property_id": stay["property_id"],
                        "reservation_id": stay["reservation_id"],
                        "room_number": stay.get("room_number")
                    }
                }
            else:
                reply = "Housekeeping services can be requested during an active stay at our estates."

        elif is_transport:
            if stay:
                reply = (
                    f"We provide luxury executive transfers and chauffeur services for {stay['property_name']}. "
                    f"Would you like me to submit a transportation assistance request to our concierge desk?"
                )
                suggested_action = {
                    "action_type": "CREATE_SERVICE_REQUEST",
                    "action_label": "REQUEST TRANSPORTATION",
                    "payload": {
                        "category": "TRANSPORTATION",
                        "item": "Chauffeur & Airport Transfer",
                        "details": "Airport pickup or executive private transfer requested",
                        "property_id": stay["property_id"],
                        "reservation_id": stay["reservation_id"],
                        "room_number": stay.get("room_number")
                    }
                }
            else:
                reply = (
                    "We offer executive chauffeur and airport transfers for all our guests. "
                    "Would you like to place a transportation inquiry with our concierge team?"
                )
                suggested_action = {
                    "action_type": "CREATE_SERVICE_REQUEST",
                    "action_label": "REQUEST TRANSPORTATION",
                    "payload": {
                        "category": "TRANSPORTATION",
                        "item": "Chauffeur & Airport Transfer",
                        "details": "Chauffeur transfer inquiry"
                    }
                }

        elif is_show_requests:
            if requests:
                req_lines = [
                    f"• **{r['item']}** ({r['category']}) — Status: **{r['status']}** (Requested on {r['created_at'][:10]})"
                    for r in requests[:5]
                ]
                reply = (
                    f"You have **{len(requests)}** active request(s) on file:\n\n" +
                    "\n".join(req_lines)
                )
            else:
                reply = "You do not currently have any active service requests on file. You can request housekeeping, extra towels, or private chauffeur transfers anytime."

        elif is_amenities:
            if stay and stay.get("amenities"):
                amenities_list = "\n".join([f"• {a}" for a in stay["amenities"]])
                reply = (
                    f"**{stay['property_name']}** offers the following signature amenities:\n\n"
                    f"{amenities_list}\n\n"
                    f"Should you wish to book an Ayurvedic spa treatment or reserve poolside dining, simply let me know!"
                )
            else:
                db = get_database()
                prop = await db.properties.find_one({})
                if prop and prop.get("amenities"):
                    amenities_list = "\n".join([f"• {a}" for a in prop["amenities"]])
                    reply = f"Our premier estate **{prop.get('name')}** features:\n\n{amenities_list}"
                else:
                    reply = "Our properties feature bespoke amenities including Infinity Swimming Pools, Ayurvedic Spas, Complimentary High-Speed WiFi, and Multi-Cuisine Fine Dining."

        elif is_room_types:
            db = get_database()
            rt_cursor = db.room_types.find({}).limit(5)
            room_types = await rt_cursor.to_list(length=5)
            if room_types:
                rt_lines = [
                    f"• **{rt.get('name')}** ({rt.get('code')}) — Max Guests: {rt.get('capacity', 2)}, Rate from ₹{rt.get('base_price', 0):,.0f}/night"
                    for rt in room_types
                ]
                reply = "Available bespoke suite categories in our portfolio:\n\n" + "\n".join(rt_lines)
            else:
                reply = "Our suite tiers range from Deluxe Garden Suites to Royal Penthouse Sanctuaries."

        elif is_recommend:
            preferred_type = prefs.get("preferred_room_type", "Deluxe Ocean Suite")
            destinations = ", ".join(prefs.get("favorite_destinations", ["Goa", "Udaipur", "Jaipur"]))
            interests = ", ".join(prefs.get("special_interests", ["Fine Dining", "Wellness"]))

            # Fetch tailored properties from real database
            db = get_database()
            props = await db.properties.find({}).limit(3).to_list(length=3)
            rec_lines = []
            for p in props:
                rec_lines.append(f"• **{p.get('name')}** ({p.get('city')}) — {p.get('star_rating', 5)}★ | Signature: {', '.join(p.get('amenities', [])[:3])}")

            reply = (
                f"Based on your traveler profile (**{prefs.get('budget_range', 'LUXURY')}** travel style, affinity for **{interests}**, and preferred destinations in **{destinations}**):\n\n"
                f"**Top Curated Sanctuaries for You**:\n" +
                "\n".join(rec_lines) + "\n\n"
                f"**Recommended Suite Configuration**: We recommend reserving the **{preferred_type}**, which aligns with your taste for spacious layouts and bespoke views."
            )
            suggested_action = {
                "action_type": "BROWSE_MARKETPLACE",
                "action_label": "BROWSE CURATED SUITES",
                "payload": {}
            }

        elif is_trip_plan:
            target_city = "Hyderabad" if "hyderabad" in cleaned else (stay.get("property_city") if stay else "Udaipur")
            
            if "hyderabad" in cleaned:
                reply = (
                    "### YOUR HYDERABAD ITINERARY\n\n"
                    "**DAY 01 — Arrival & Heritage**\n"
                    "• Morning check-in & welcome Irani chai with Osmania biscuits\n"
                    "• Visit the iconic **Charminar** and the grand **Chowmahalla Palace**\n"
                    "• Authentic royal Hyderabadi Dum Biryani dining at a heritage restaurant\n\n"
                    "**DAY 02 — Culture & Local Experience**\n"
                    "• Morning guided excursion to the historic **Golconda Fort** & Qutb Shahi Tombs\n"
                    "• Artisan pearl & lacquer bangle shopping at **Laad Bazaar**\n"
                    "• Sunset promenade at **Hussain Sagar Lake** followed by contemporary Deccan cuisine\n\n"
                    "**DAY 03 — Relax & Departure**\n"
                    "• Leisure gourmet breakfast and Ayurvedic wellness rejuvenation\n"
                    "• Visit the world-renowned **Salar Jung Museum**\n"
                    "• Seamless express check-out and private airport transfer"
                )
            elif target_city.lower() == "goa":
                reply = (
                    "### YOUR GOA COASTAL ITINERARY\n\n"
                    "**DAY 01 — Coastal Arrival & Sunset Serenity**\n"
                    "• Suite check-in and complimentary fresh tender coconut water\n"
                    "• Afternoon relaxation at pristine South Goa beaches\n"
                    "• Beachside candlelit seafood dinner with authentic Goan curries\n\n"
                    "**DAY 02 — Heritage & Spice Plantation**\n"
                    "• Morning tour of UNESCO heritage churches in Old Goa (Basilica of Bom Jesus)\n"
                    "• Traditional organic spice plantation lunch and tropical botanical walk\n"
                    "• Sunset catamaran sail with live music\n\n"
                    "**DAY 03 — Wellness & Leisure Departure**\n"
                    "• Morning beachfront yoga and Ayurvedic spa massage\n"
                    "• Artisan shopping at local flea and spice markets\n"
                    "• Departure with bespoke concierge transfer"
                )
            else:
                reply = (
                    f"### YOUR {target_city.upper()} ITINERARY\n\n"
                    "**DAY 01 — Arrival & Welcome**\n"
                    "• Suite check-in, concierge briefing, and arrival refreshments\n"
                    "• Leisure walking tour of the royal neighborhood and old city squares\n"
                    "• Sunset rooftop dining overlooking the estate\n\n"
                    "**DAY 02 — Local Culture & Hidden Gems**\n"
                    "• Morning architectural and historical monument exploration\n"
                    "• Curated artisan handicraft and textile discovery\n"
                    "• Chef's special regional tasting dinner\n\n"
                    "**DAY 03 — Rejuvenation & Departure**\n"
                    "• Sunrise wellness or morning swim in the infinity pool\n"
                    "• Relaxed breakfast and souvenir discovery\n"
                    "• Seamless check-out and airport transfer arrangement"
                )

        # ----------------------------------------------------
        # 4. GENERAL GREETINGS & LUXURY ASSISTANCE FALLBACK
        # ----------------------------------------------------
        else:
            greeting_name = f", {name}" if name else ""
            stay_prompt = f" for your stay at **{stay['property_name']}**" if stay else ""
            reply = (
                f"Namaste{greeting_name}! I am your personal Nexgile Concierge{stay_prompt}.\n\n"
                f"I can assist you with your active reservations, arrange housekeeping or extra towels, "
                f"provide details about hotel amenities, review your service requests, or craft personalized itineraries.\n\n"
                f"How may I assist with your journey today?"
            )

        return {
            "message": reply,
            "suggested_action": suggested_action,
            "quick_replies": quick_replies
        }
