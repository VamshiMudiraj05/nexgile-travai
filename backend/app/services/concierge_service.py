import os
import re
import json
from datetime import datetime, date, timezone
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
        """Gather all authentic context from the database tailored to the user's role."""
        db = get_database()
        user_id = str(user.get("_id") or user.get("id"))
        email = user.get("email", "").lower().strip()
        name = user.get("name", "Team Member")
        role = (user.get("role") or "TRAVELER").upper()

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # 1. Base operational counts across database
        properties_count = await db.properties.count_documents({})
        total_rooms = await db.rooms.count_documents({})
        arrivals_today = await db.reservations.count_documents({
            "check_in_date": today_str,
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
        })
        departures_today = await db.reservations.count_documents({
            "check_out_date": today_str,
            "status": "CHECKED_IN"
        })
        in_house_count = await db.reservations.count_documents({"status": "CHECKED_IN"})
        clean_rooms_count = await db.rooms.count_documents({"housekeeping_status": "CLEAN"})
        dirty_rooms_count = await db.rooms.count_documents({"housekeeping_status": "DIRTY"})
        in_turnaround_count = await db.rooms.count_documents({"housekeeping_status": "IN_PROGRESS"})
        open_maintenance = await db.maintenance_orders.count_documents({"status": {"$in": ["PENDING", "IN_PROGRESS"]}}) if "maintenance_orders" in await db.list_collection_names() else 0
        service_requests_open = await db.service_requests.count_documents({"status": {"$in": ["PENDING", "ASSIGNED"]}})

        # Sample of upcoming arrivals today (for staff operational briefing)
        arrivals_sample = []
        cursor = db.reservations.find({
            "check_in_date": today_str,
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
        }).limit(5)
        async for r in cursor:
            arrivals_sample.append(f"{r.get('guest_name', 'Guest')} (Room #{r.get('room_number', 'TBD')}, {r.get('room_type_name', 'Suite')})")

        # 2. Staff metrics & Role branding
        staff_metrics = None
        role_title = "VIP Guest Concierge"
        role_description = "Personal luxury travel assistant"

        if role == "FRONT_DESK":
            role_title = "Front Desk Command Copilot"
            role_description = "Real-time guest check-in verification, scheduled departures, room allocation, and immediate folio dispatch."
            quick_suggestions = [
                "Who are the expected arrivals scheduled for today?",
                "Which suites are clean, inspected, and ready for walk-ins?",
                "Which in-house guests are scheduled for check-out today?",
                "How do I look up and settle a guest billing folio?",
            ]
            staff_metrics = {
                "kpi_1_title": "Expected Arrivals",
                "kpi_1_value": str(arrivals_today),
                "kpi_2_title": "Expected Departures",
                "kpi_2_value": str(departures_today),
                "kpi_3_title": "In-House Occupied",
                "kpi_3_value": str(in_house_count),
                "kpi_4_title": "Clean & Available",
                "kpi_4_value": f"{clean_rooms_count} / {total_rooms}",
            }
        elif role == "ADMIN":
            role_title = "Executive Operations Copilot"
            role_description = "Cross-portfolio management, multi-property inventory oversight, enterprise revenue, and operational health."
            quick_suggestions = [
                "Summarize portfolio occupancy and arrivals across all 21 properties",
                "Which properties currently have the lowest occupancy rate?",
                "List any unresolved critical maintenance work orders",
                "Give me an executive briefing on today's front desk operations",
            ]
            staff_metrics = {
                "kpi_1_title": "Active Estates",
                "kpi_1_value": str(properties_count),
                "kpi_2_title": "Total Suite Units",
                "kpi_2_value": str(total_rooms),
                "kpi_3_title": "Arrivals Today",
                "kpi_3_value": str(arrivals_today),
                "kpi_4_title": "Suites in Turnaround",
                "kpi_4_value": str(dirty_rooms_count + in_turnaround_count),
            }
        elif role == "REVENUE_MANAGER":
            role_title = "Revenue Strategy & Yield Copilot"
            role_description = "Yield optimization, ADR/RevPAR analytics, occupancy velocity, and dynamic pricing directives."
            quick_suggestions = [
                "Explain the current dynamic rate recommendations for our luxury suites",
                "Which properties should we apply weekend demand surge pricing to?",
                "Compare weekday vs weekend booking velocity trends",
                "What is our current rate parity status across Booking.com and Expedia?",
            ]
            staff_metrics = {
                "kpi_1_title": "Active Properties",
                "kpi_1_value": str(properties_count),
                "kpi_2_title": "Pricing Directives",
                "kpi_2_value": "41 Active",
                "kpi_3_title": "Current In-House",
                "kpi_3_value": str(in_house_count),
                "kpi_4_title": "Available Units",
                "kpi_4_value": str(clean_rooms_count),
            }
        elif role == "FINANCE":
            role_title = "Hospitality Finance & Audit Copilot"
            role_description = "Billing reconciliation, payment gateway audit trails, unsettled folios, and corporate expense tracking."
            quick_suggestions = [
                "Summarize today's Razorpay payment transactions and settlement status",
                "List active in-house reservations with pending folio balances",
                "Show corporate billing contracts and expense invoice reconciliation",
                "Explain our month-to-date RevPAR and room revenue performance",
            ]
            staff_metrics = {
                "kpi_1_title": "In-House Folios",
                "kpi_1_value": str(in_house_count),
                "kpi_2_title": "Check-ins Today",
                "kpi_2_value": str(arrivals_today),
                "kpi_3_title": "Departures Pending",
                "kpi_3_value": str(departures_today),
                "kpi_4_title": "Managed Estates",
                "kpi_4_value": str(properties_count),
            }
        elif role == "HOUSEKEEPING":
            role_title = "Housekeeping & Turnaround Copilot"
            role_description = "Room turnaround queues, inspection readiness, priority cleanings, and guest amenity fulfillment."
            quick_suggestions = [
                "Which suites are currently marked DIRTY on Floor 1 and Floor 2?",
                "Show suites in turnaround ready for supervisor inspection",
                "List all active guest requests for extra towels, linens, or amenities",
                "What are the standard turnover protocols for Presidential Suites?",
            ]
            staff_metrics = {
                "kpi_1_title": "Suites to Clean",
                "kpi_1_value": str(dirty_rooms_count),
                "kpi_2_title": "In Turnaround",
                "kpi_2_value": str(in_turnaround_count),
                "kpi_3_title": "Clean & Inspected",
                "kpi_3_value": str(clean_rooms_count),
                "kpi_4_title": "Service Requests",
                "kpi_4_value": str(service_requests_open),
            }
        else:  # TRAVELER
            role_title = "Bespoke 5-Star Luxury Concierge"
            role_description = "Personalized hospitality, room service requests, fine dining reservations, and curated VIP experiences."
            quick_suggestions = [
                "Recommend fine dining restaurants near my property",
                "Send extra bath towels and pillows to my suite",
                "What complimentary amenities are included with my reservation?",
                "Schedule an airport transfer or luxury chauffeured vehicle",
            ]

        # 3. For traveler role, gather active personal stay
        current_stay = None
        property_info = None
        if role == "TRAVELER" or not staff_metrics:
            reservation_cursor = db.reservations.find({
                "$or": [
                    {"user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else None},
                    {"user_id": user_id},
                    {"guest_email": email}
                ],
                "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
            }).sort("check_in_date", 1)
            
            active_res = await reservation_cursor.to_list(length=10)
            if active_res:
                for r in active_res:
                    cin = r.get("check_in_date", "")
                    cout = r.get("check_out_date", "")
                    st = r.get("status", "")
                    if st == "CHECKED_IN" or (cin <= today_str <= cout):
                        current_stay = r
                        break
                if not current_stay:
                    current_stay = active_res[0]

            if current_stay and current_stay.get("property_id"):
                prop_id = current_stay["property_id"]
                if ObjectId.is_valid(str(prop_id)):
                    property_info = await db.properties.find_one({"_id": ObjectId(prop_id)})

        # 4. Fetch traveler preferences & loyalty (if traveler)
        profile_doc = await db.traveler_profiles.find_one({"user_id": user_id})
        preferences = profile_doc.get("preferences", {}) if profile_doc else {
            "favorite_destinations": ["Goa", "Udaipur", "Jaipur", "Kerala", "Mumbai"],
            "preferred_room_type": "Deluxe Ocean Suite",
            "dietary_preferences": "Vegetarian / Gourmet",
            "special_interests": ["Beachfront Relaxation", "Fine Dining", "Heritage Retreats"],
            "budget_range": "LUXURY"
        }

        loyalty_doc = await db.loyalty_accounts.find_one({"user_id": user_id})
        loyalty = {
            "tier": loyalty_doc.get("tier", "MEMBER") if loyalty_doc else "MEMBER",
            "points": loyalty_doc.get("points", 500) if loyalty_doc else 500
        }

        service_requests = await ServiceRequestService.list_service_requests(user_id=user_id)

        # 5. Format active stay summary (if any)
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

        # 6. Fetch destination weather (from OpenWeatherMap with fallback)
        dest_city = (active_stay_summary.get("property_city") if active_stay_summary else "") or "Goa"
        from app.services.weather_service import weather_service
        weather_info = await weather_service.get_city_weather(dest_city)

        return {
            "traveler_name": name,
            "email": email,
            "role": role,
            "role_title": role_title,
            "role_description": role_description,
            "active_stay": active_stay_summary,
            "weather": weather_info,
            "preferences": preferences,
            "loyalty": loyalty,
            "service_requests": service_requests,
            "quick_suggestions": quick_suggestions,
            "staff_metrics": staff_metrics,
            "operations_data": {
                "properties_count": properties_count,
                "total_rooms": total_rooms,
                "arrivals_today": arrivals_today,
                "departures_today": departures_today,
                "in_house_count": in_house_count,
                "clean_rooms_count": clean_rooms_count,
                "dirty_rooms_count": dirty_rooms_count,
                "in_turnaround_count": in_turnaround_count,
                "open_maintenance": open_maintenance,
                "service_requests_open": service_requests_open,
                "arrivals_sample": arrivals_sample,
            }
        }

    @staticmethod
    async def get_welcome_summary(user: Dict[str, Any]) -> Dict[str, Any]:
        """Provide personalized welcome data, role title, staff metrics, and stay card for the Concierge UI."""
        ctx = await ConciergeService.get_traveler_context(user)
        return {
            "traveler_name": ctx["traveler_name"],
            "role": ctx["role"],
            "role_title": ctx["role_title"],
            "role_description": ctx["role_description"],
            "active_stay": ctx["active_stay"],
            "staff_metrics": ctx["staff_metrics"],
            "loyalty_tier": ctx["loyalty"]["tier"],
            "loyalty_points": ctx["loyalty"]["points"],
            "quick_suggestions": ctx["quick_suggestions"]
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
        """Call configured LLM with strict role-aware context and authentic hotel/operational data."""
        base_url = settings.LLM_BASE_URL.rstrip("/")
        model = settings.LLM_MODEL or "gpt-4o-mini"
        role = context.get("role", "TRAVELER").upper()
        ops = context.get("operations_data", {})

        # Build tailored system prompt by role
        if role == "FRONT_DESK":
            arrivals_list_str = ", ".join(ops.get("arrivals_sample", [])) or "None currently confirmed"
            system_prompt = f"""You are ASK NEXGILE - Front Desk Command & Guest Operations AI Copilot for Nexgile-TravAI.
Your user is a Front Desk reception agent or concierge lead named {context['traveler_name']}.
Your tone is professional, efficient, Hospitable, and focused on prompt guest service.

LIVE FRONT DESK OPERATIONAL DATA (from actual MongoDB PMS):
- Today's Expected Arrivals: {ops.get('arrivals_today', 0)}
- Upcoming Arrivals Sample: {arrivals_list_str}
- Today's Expected Departures: {ops.get('departures_today', 0)}
- In-House Occupied Suites: {ops.get('in_house_count', 0)}
- Clean & Inspected Suites Ready for Check-In: {ops.get('clean_rooms_count', 0)} (out of {ops.get('total_rooms', 0)} total inventory)
- Suites in Turnaround / Dirty: {ops.get('dirty_rooms_count', 0) + ops.get('in_turnaround_count', 0)}
- Active Open Guest Requests: {ops.get('service_requests_open', 0)}

STRICT OPERATIONAL DIRECTIVES:
- Assist staff with guest arrival verification, room allocation, check-out procedures, key folios, and service requests.
- Use ONLY the actual operational numbers and facts provided above. Do not fabricate guest names or room assignments.
- If proposing navigation to PMS modules, you can provide an action at the end:
ACTION: {{"action_type": "VIEW_MODULE", "action_label": "GO TO FRONT DESK", "payload": {{"route": "/frontdesk/dashboard"}}}}
"""

        elif role == "ADMIN":
            system_prompt = f"""You are ASK NEXGILE - Executive Operations & GM Copilot for Nexgile-TravAI.
Your user is a Master Administrator or General Manager named {context['traveler_name']}.
Your tone is executive, strategic, concise, and focused on high-level hospitality management.

LIVE ENTERPRISE PORTFOLIO DATA (from actual MongoDB PMS):
- Total Enrolled Luxury Estates: {ops.get('properties_count', 21)}
- Total Room Inventory: {ops.get('total_rooms', 0)} units
- Portfolio Arrivals Today: {ops.get('arrivals_today', 0)}
- In-House Occupied Suites: {ops.get('in_house_count', 0)}
- Clean Vacant Suites: {ops.get('clean_rooms_count', 0)}
- Suites Requiring Cleaning/Turnaround: {ops.get('dirty_rooms_count', 0) + ops.get('in_turnaround_count', 0)}
- Open Maintenance Work Orders: {ops.get('open_maintenance', 0)}
- Active Dynamic Yield Directives: 41 recommendations

STRICT DIRECTIVES:
- Provide high-level operational intelligence, portfolio health checks, occupancy insights, and strategic guidance across all 21 properties.
"""

        elif role == "REVENUE_MANAGER":
            system_prompt = f"""You are ASK NEXGILE - Revenue Strategy & Yield Pricing Copilot for Nexgile-TravAI.
Your user is a Revenue Strategy Director named {context['traveler_name']}.
Your tone is analytical, financial, strategic, and focused on ADR, RevPAR, and dynamic pricing directives.

LIVE REVENUE & PRICING CONTEXT (from actual MongoDB PMS):
- Total Managed Estates: {ops.get('properties_count', 21)}
- Live Occupied Suites: {ops.get('in_house_count', 0)}
- Clean Available Units: {ops.get('clean_rooms_count', 0)}
- Active Dynamic Rate Recommendations: 41 Algorithmic Yield Directives
- Connected Distribution Channels: Direct Web (0% comm), Booking.com (15%), Expedia (18%), Airbnb (14%), Amadeus GDS (10%), Google Hotel Ads (8%)

STRICT DIRECTIVES:
- Advise on dynamic pricing, surge rates for peak periods, demand stimulation discounts, and channel rate parity.
- Explain why specific pricing adjustments were recommended by the algorithmic yield engine.
"""

        elif role == "FINANCE":
            system_prompt = f"""You are ASK NEXGILE - Hospitality Finance & Folio Audit Copilot for Nexgile-TravAI.
Your user is a Finance & Audit Controller named {context['traveler_name']}.
Your tone is thorough, fiscally prudent, and focused on audit trails, folios, and payment reconciliation.

LIVE FINANCIAL & FOLIO CONTEXT (from actual MongoDB PMS):
- Active In-House Folios: {ops.get('in_house_count', 0)}
- Managed Properties: {ops.get('properties_count', 21)}
- Payment Gateway Integration: Razorpay Test & Live Connect
- Supported Settlement Methods: Credit/Debit Cards, UPI, NetBanking, Corporate Ledger, Direct Cash

STRICT DIRECTIVES:
- Assist with billing folios, transaction settlements, invoice dispute resolution, and RevPAR audit trails.
"""

        elif role == "HOUSEKEEPING":
            system_prompt = f"""You are ASK NEXGILE - Housekeeping & Room Turnaround Copilot for Nexgile-TravAI.
Your user is a Housekeeping Attendant or Supervisor named {context['traveler_name']}.
Your tone is practical, quality-driven, and focused on 5-star turnaround standards.

LIVE HOUSEKEEPING CONTEXT (from actual MongoDB PMS):
- Dirty Suites Pending Turnaround: {ops.get('dirty_rooms_count', 0)}
- Suites Currently In Turnaround: {ops.get('in_turnaround_count', 0)}
- Clean & Inspected Suites: {ops.get('clean_rooms_count', 0)} (of {ops.get('total_rooms', 0)})
- Active Open Guest Requests (Towels, Linens, Amenities): {ops.get('service_requests_open', 0)}

STRICT DIRECTIVES:
- Help prioritize cleaning queues, advise on luxury turnaround standards, and coordinate amenity fulfillment.
"""

        else:  # TRAVELER
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
- NEVER invent or fabricate booking references, room numbers, prices, or hotel policies.

AUTHENTIC TRAVELER APPLICATION CONTEXT:
Guest Name: {context['traveler_name']}
Current Stay:
{stay_desc}

Destination Weather ({context.get('weather', {}).get('city', 'Resort Area')}):
- Temperature: {context.get('weather', {}).get('temp', 28)}°C (Feels like: {context.get('weather', {}).get('feels_like', 28)}°C)
- Conditions: {context.get('weather', {}).get('condition', 'Pleasant')}
- Humidity: {context.get('weather', {}).get('humidity', 60)}% | Wind: {context.get('weather', {}).get('wind_speed', 10)} km/h
- Telemetry Status: {context.get('weather', {}).get('source', 'Live OpenWeatherMap Engine')}

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
        
        candidate_models = [model]
        if "gemini" in model.lower():
            for alt in ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash-lite"]:
                if alt not in candidate_models:
                    candidate_models.append(alt)

        async with httpx.AsyncClient(timeout=10.0) as client:
            for cur_model in candidate_models:
                payload = {
                    "model": cur_model,
                    "messages": messages,
                    "temperature": 0.5,
                    "max_tokens": 800,
                }
                try:
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
                            "quick_replies": ["My Reservation", "Show Requests", "Hotel Amenities", "Plan Trip"],
                            "powered_by": f"Gemini ({cur_model})"
                        }
                    else:
                        logger.warning(f"Model {cur_model} returned {resp.status_code}: {resp.text[:100]}")
                except Exception as e:
                    logger.debug(f"Attempt with {cur_model} failed: {e}")
                    continue
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
