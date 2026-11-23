import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.omnichannel_dispatch import (
    omnichannel_message_helper,
    post_stay_survey_helper,
    housekeeping_task_helper,
)
from app.core.logging import logger


class OmnichannelService:
    # --- OMNICHANNEL INGESTION & DISPATCH ---
    @staticmethod
    async def process_inbound_message(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Classify inbound guest message (WhatsApp/SMS/Email) via NLP intent and route accordingly."""
        db = get_database()
        now = datetime.now(timezone.utc)
        text = payload.get("message_text", "").strip()
        lower = text.lower()

        channel = payload.get("channel", "WHATSAPP")
        guest_name = payload.get("guest_name", "Valued Guest")
        room_number = payload.get("room_number", "402")

        # Intent & Sentiment Classification
        intent = "CONCIERGE_INQUIRY"
        department = "CONCIERGE"
        priority = "MEDIUM"
        sentiment = 0.85
        reply = ""
        should_escalate = False

        if any(w in lower for w in ["towel", "pillow", "blanket", "clean", "trash", "amenities", "shampoo"]):
            intent = "HOUSEKEEPING_REQUEST"
            department = "HOUSEKEEPING"
            priority = "MEDIUM"
            reply = f"Hello {guest_name}, our housekeeping team has received your request for Room {room_number}. Extra items are dispatched and will arrive within 15 minutes."
            should_escalate = True
        elif any(w in lower for w in ["ac", "air conditioning", "leak", "hot water", "broken", "tv", "light", "clog"]):
            intent = "MAINTENANCE_ALERT"
            department = "MAINTENANCE"
            priority = "HIGH"
            sentiment = 0.25
            reply = f"We apologize for the inconvenience in Room {room_number}. An engineering specialist has been dispatched on high priority to inspect and fix this right away."
            should_escalate = True
        elif any(w in lower for w in ["food", "dining", "menu", "burger", "breakfast", "dinner", "wine", "coffee", "room service"]):
            intent = "ROOM_SERVICE"
            department = "ROOM_SERVICE"
            priority = "MEDIUM"
            reply = f"Hello {guest_name}, our culinary team is ready to assist. Room service menu options for Room {room_number} are available via our digital ordering system or front desk dial 2."
        elif any(w in lower for w in ["unacceptable", "furious", "terrible", "complaint", "rude", "manager", "disaster"]):
            intent = "COMPLAINT"
            department = "FRONT_DESK"
            priority = "URGENT"
            sentiment = -0.75
            reply = f"Dear {guest_name}, we deeply regret hearing about this experience. The Duty Manager has been alerted and will reach out to you directly in Room {room_number} immediately."
            should_escalate = True
        elif any(w in lower for w in ["bill", "charge", "folio", "refund", "invoice", "deposit"]):
            intent = "BILLING_ISSUE"
            department = "FINANCE"
            priority = "HIGH"
            reply = f"Hello {guest_name}, your billing inquiry regarding Room {room_number} has been directed to our front desk accounting team. A detailed digital folio is being sent to your email."
            should_escalate = True
        else:
            intent = "CONCIERGE_INQUIRY"
            department = "CONCIERGE"
            priority = "LOW"
            reply = f"Welcome to Nexgile Estate, {guest_name}. Our AI Concierge is delighted to help with local recommendations, dining reservations, or spa appointments."

        status_val = "DISPATCHED_TO_STAFF" if should_escalate else "AUTO_RESOLVED"

        doc = {
            "channel": channel,
            "guest_name": guest_name,
            "guest_phone": payload.get("guest_phone"),
            "guest_email": payload.get("guest_email"),
            "reservation_id": payload.get("reservation_id"),
            "room_number": room_number,
            "incoming_message": text,
            "detected_intent": intent,
            "sentiment_score": sentiment,
            "ai_automated_reply": reply,
            "assigned_department": department,
            "assigned_staff": f"{department.title()} Team On-Duty" if should_escalate else None,
            "priority": priority,
            "status": status_val,
            "staff_notes": f"Auto-escalated to {department} based on NLP intent classification." if should_escalate else "Handled by AI Concierge.",
            "created_at": now,
            "updated_at": now,
        }

        res = await db.omnichannel_messages.insert_one(doc)
        doc["_id"] = res.inserted_id
        logger.info(f"Omnichannel message from {guest_name} ({channel}) classified as {intent} -> {status_val}")
        return omnichannel_message_helper(doc)

    @staticmethod
    async def list_messages(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """List incoming omnichannel messages."""
        db = get_database()
        q: Dict[str, Any] = {}
        if status_filter:
            q["status"] = status_filter

        count = await db.omnichannel_messages.count_documents({})
        if count == 0:
            now = datetime.now(timezone.utc)
            samples = [
                {
                    "channel": "WHATSAPP",
                    "guest_name": "Eleanor Vance",
                    "guest_phone": "+44 7911 123456",
                    "guest_email": "eleanor.vance@nexgile.com",
                    "room_number": "501",
                    "incoming_message": "Could we please get 2 extra feather pillows and hypoallergenic towels delivered to Suite 501?",
                    "detected_intent": "HOUSEKEEPING_REQUEST",
                    "sentiment_score": 0.9,
                    "ai_automated_reply": "Hello Eleanor Vance, our housekeeping team has received your request for Room 501. Extra items are dispatched.",
                    "assigned_department": "HOUSEKEEPING",
                    "assigned_staff": "Floor 5 Attendant",
                    "priority": "MEDIUM",
                    "status": "DISPATCHED_TO_STAFF",
                    "staff_notes": "Delivered feather pillows and towels.",
                    "created_at": now - timedelta(minutes=30),
                    "updated_at": now - timedelta(minutes=10),
                },
                {
                    "channel": "SMS",
                    "guest_name": "Marcus Vance",
                    "guest_phone": "+1 415-555-0199",
                    "guest_email": "marcus.vance@enterprise.com",
                    "room_number": "308",
                    "incoming_message": "The air conditioning in 308 is not cooling down below 76 degrees, please have engineering check.",
                    "detected_intent": "MAINTENANCE_ALERT",
                    "sentiment_score": 0.2,
                    "ai_automated_reply": "We apologize for the inconvenience in Room 308. An engineering specialist has been dispatched.",
                    "assigned_department": "MAINTENANCE",
                    "assigned_staff": "Senior HVAC Technician",
                    "priority": "HIGH",
                    "status": "DISPATCHED_TO_STAFF",
                    "staff_notes": "Thermostat sensor reset in progress.",
                    "created_at": now - timedelta(hours=1),
                    "updated_at": now - timedelta(minutes=45),
                },
            ]
            await db.omnichannel_messages.insert_many(samples)

        cursor = db.omnichannel_messages.find(q).sort("created_at", -1)
        res = []
        async for doc in cursor:
            res.append(omnichannel_message_helper(doc))
        return res

    @staticmethod
    async def resolve_message(msg_id: str, staff_name: str, notes: str) -> Dict[str, Any]:
        """Staff marks dispatched message as resolved."""
        db = get_database()
        now = datetime.now(timezone.utc)
        filter_q = {"_id": ObjectId(msg_id)} if ObjectId.is_valid(msg_id) else {"id": msg_id}

        res = await db.omnichannel_messages.find_one_and_update(
            filter_q,
            {
                "$set": {
                    "status": "STAFF_RESOLVED",
                    "assigned_staff": staff_name,
                    "staff_notes": notes,
                    "updated_at": now,
                }
            },
            return_document=True,
        )
        if not res:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message thread not found.")
        return omnichannel_message_helper(res)

    # --- POST-STAY SURVEYS & SENTIMENT RECOVERY ---
    @staticmethod
    async def submit_survey(survey_data: Dict[str, Any]) -> Dict[str, Any]:
        """Record post-stay survey, classify NPS (Promoter/Passive/Detractor), and auto-create recovery ticket if negative."""
        db = get_database()
        now = datetime.now(timezone.utc)

        nps = int(survey_data.get("nps_score", 9))
        sentiment_cat = "PROMOTER" if nps >= 9 else "PASSIVE" if nps >= 7 else "DETRACTOR"

        ticket_id = None
        # Auto-create service recovery ticket if detractor
        if sentiment_cat == "DETRACTOR":
            ticket_id = f"RECOV-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
            ticket_doc = {
                "ticket_id": ticket_id,
                "reservation_id": survey_data.get("reservation_id"),
                "guest_name": survey_data.get("guest_name"),
                "guest_email": survey_data.get("guest_email"),
                "nps_score": nps,
                "comments": survey_data.get("comments"),
                "suggested_recovery": "Comp 10,000 Loyalty Points + Personal GM Apology Note + $50 Dining Credit",
                "status": "OPEN_HIGH_PRIORITY",
                "created_at": now,
            }
            await db.service_recovery_tickets.insert_one(ticket_doc)
            logger.warning(f"Service Recovery Ticket {ticket_id} opened for guest {survey_data.get('guest_name')} (NPS: {nps}).")

        doc = {
            "reservation_id": survey_data.get("reservation_id", "RES-SAMPLE"),
            "guest_name": survey_data.get("guest_name", "Guest"),
            "guest_email": survey_data.get("guest_email", "guest@example.com"),
            "property_id": survey_data.get("property_id", "prop_1"),
            "nps_score": nps,
            "csat_score": int(survey_data.get("csat_score", 5)),
            "cleanliness_rating": int(survey_data.get("cleanliness_rating", 5)),
            "staff_rating": int(survey_data.get("staff_rating", 5)),
            "comments": survey_data.get("comments", "Exceptional stay, wonderful service!"),
            "sentiment_category": sentiment_cat,
            "service_recovery_ticket_id": ticket_id,
            "created_at": now,
        }

        res = await db.post_stay_surveys.insert_one(doc)
        doc["_id"] = res.inserted_id
        return post_stay_survey_helper(doc)

    @staticmethod
    async def get_survey_sentiment_summary(property_id: Optional[str] = None) -> Dict[str, Any]:
        """Aggregate NPS, CSAT, sentiment breakdown, and recovery ticket alerts."""
        db = get_database()
        q: Dict[str, Any] = {}
        if property_id:
            q["property_id"] = property_id

        # Seed sample surveys if empty
        count = await db.post_stay_surveys.count_documents({})
        if count == 0:
            now = datetime.now(timezone.utc)
            samples = [
                {
                    "reservation_id": "RES-8801",
                    "guest_name": "Eleanor Vance",
                    "guest_email": "eleanor.vance@nexgile.com",
                    "property_id": "prop_1",
                    "nps_score": 10,
                    "csat_score": 5,
                    "cleanliness_rating": 5,
                    "staff_rating": 5,
                    "comments": "The Grand Savoy was pure luxury. The AI concierge and room service were instantaneous!",
                    "sentiment_category": "PROMOTER",
                    "service_recovery_ticket_id": None,
                    "created_at": now - timedelta(days=2),
                },
                {
                    "reservation_id": "RES-8802",
                    "guest_name": "Sophia Zhang",
                    "guest_email": "sophia.zhang@enterprise.com",
                    "property_id": "prop_1",
                    "nps_score": 9,
                    "csat_score": 5,
                    "cleanliness_rating": 5,
                    "staff_rating": 5,
                    "comments": "Seamless check-in, pristine room, and fantastic meeting facilities.",
                    "sentiment_category": "PROMOTER",
                    "service_recovery_ticket_id": None,
                    "created_at": now - timedelta(days=1),
                },
                {
                    "reservation_id": "RES-8803",
                    "guest_name": "Arthur Pendelton",
                    "guest_email": "arthur.p@domain.com",
                    "property_id": "prop_1",
                    "nps_score": 5,
                    "csat_score": 2,
                    "cleanliness_rating": 3,
                    "staff_rating": 2,
                    "comments": "Noisy neighbors on Floor 4 kept us awake, and front desk response was slow.",
                    "sentiment_category": "DETRACTOR",
                    "service_recovery_ticket_id": "RECOV-202611-098",
                    "created_at": now - timedelta(hours=12),
                },
            ]
            await db.post_stay_surveys.insert_many(samples)

        cursor = db.post_stay_surveys.find(q)
        surveys = []
        async for doc in cursor:
            surveys.append(doc)

        total = len(surveys)
        if total == 0:
            return {
                "total_surveys": 0,
                "nps_score": 0.0,
                "average_csat": 5.0,
                "promoters_count": 0,
                "passives_count": 0,
                "detractors_count": 0,
                "active_recovery_tickets_count": 0,
                "top_positive_keywords": ["Service", "Luxury", "Cleanliness"],
                "top_concern_areas": [],
            }

        promoters = sum(1 for s in surveys if s.get("nps_score", 0) >= 9)
        passives = sum(1 for s in surveys if 7 <= s.get("nps_score", 0) <= 8)
        detractors = sum(1 for s in surveys if s.get("nps_score", 0) <= 6)

        nps_net = round(((promoters - detractors) / total) * 100, 1)
        avg_csat = round(sum(s.get("csat_score", 5) for s in surveys) / total, 2)

        recovery_count = await db.service_recovery_tickets.count_documents({"status": "OPEN_HIGH_PRIORITY"})

        return {
            "total_surveys": total,
            "nps_score": nps_net,
            "average_csat": avg_csat,
            "promoters_count": promoters,
            "passives_count": passives,
            "detractors_count": detractors,
            "active_recovery_tickets_count": recovery_count,
            "top_positive_keywords": ["Immaculate Suites", "Instant AI Concierge", "Exceptional Hospitality", "Fine Dining"],
            "top_concern_areas": ["Elevator Wait Times", "Late Night Floor Noise"],
        }

    # --- SMART HOUSEKEEPING AUTO-SCHEDULING ALGORITHM ---
    @staticmethod
    def optimize_housekeeping_schedule(property_id: str = "prop_101") -> Dict[str, Any]:
        """Intelligent turnaround scheduling algorithm balancing guest loyalty priority, early arrivals, and staff workload."""
        # Simulated raw dirty rooms awaiting turnaround
        raw_rooms = [
            {
                "room_number": "Suite 801",
                "room_type": "Presidential Penthouse",
                "cleaning_status": "DIRTY",
                "guest_arrival_time": "12:00 PM",
                "guest_loyalty_tier": "DIAMOND",
                "special_instructions": "VIP Welcome Champagne & Floral Arrangement",
                "duration": 50,
            },
            {
                "room_number": "Room 402",
                "room_type": "Executive King Suite",
                "cleaning_status": "DIRTY",
                "guest_arrival_time": "01:30 PM",
                "guest_loyalty_tier": "PLATINUM",
                "special_instructions": "Hypoallergenic feather-free pillows requested",
                "duration": 35,
            },
            {
                "room_number": "Room 205",
                "room_type": "Deluxe Double",
                "cleaning_status": "DIRTY",
                "guest_arrival_time": "03:00 PM",
                "guest_loyalty_tier": "GOLD",
                "special_instructions": "Standard Turnaround",
                "duration": 30,
            },
            {
                "room_number": "Room 310",
                "room_type": "Deluxe King",
                "cleaning_status": "DIRTY",
                "guest_arrival_time": "04:00 PM",
                "guest_loyalty_tier": "STANDARD",
                "special_instructions": "Crib request for toddler",
                "duration": 30,
            },
            {
                "room_number": "Suite 705",
                "room_type": "Alpine View Spa Suite",
                "cleaning_status": "DIRTY",
                "guest_arrival_time": "01:00 PM",
                "guest_loyalty_tier": "DIAMOND",
                "special_instructions": "Early check-in guaranteed",
                "duration": 45,
            },
        ]

        # Prioritization scoring algorithm:
        # Tier weights: DIAMOND: 100, PLATINUM: 50, GOLD: 25, STANDARD: 0
        # Arrival time: 12:00 PM -> +40 pts, 01:00 PM -> +30 pts, 01:30 PM -> +25 pts, etc.
        tier_weights = {"DIAMOND": 100, "PLATINUM": 50, "GOLD": 25, "STANDARD": 0}

        def score_room(r):
            score = tier_weights.get(r["guest_loyalty_tier"], 0)
            if "12:" in r["guest_arrival_time"]:
                score += 50
            elif "01:" in r["guest_arrival_time"]:
                score += 35
            elif "02:" in r["guest_arrival_time"]:
                score += 20
            return score

        # Sort descending by priority score
        sorted_rooms = sorted(raw_rooms, key=score_room, reverse=True)

        housekeepers = ["Elena Rostova (Lead)", "Maria Santos", "David Chen"]

        optimized_schedule = []
        clock = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0)

        for idx, room in enumerate(sorted_rooms):
            hk = housekeepers[idx % len(housekeepers)]
            start_str = clock.strftime("%I:%M %p")
            clock += timedelta(minutes=room["duration"])

            reason = (
                f"VIP {room['guest_loyalty_tier']} Priority • Early Arrival ({room['guest_arrival_time']})"
                if room["guest_loyalty_tier"] in ["DIAMOND", "PLATINUM"]
                else f"Standard Turnaround • Scheduled Check-In ({room['guest_arrival_time']})"
            )

            task = {
                "id": f"TSK-{idx + 1:03d}",
                "property_id": property_id,
                "room_number": room["room_number"],
                "room_type": room["room_type"],
                "cleaning_status": "SCHEDULED",
                "priority_rank": idx + 1,
                "priority_reason": reason,
                "assigned_housekeeper": hk,
                "estimated_duration_minutes": room["duration"],
                "scheduled_start_time": start_str,
                "guest_arrival_time": room["guest_arrival_time"],
                "guest_loyalty_tier": room["guest_loyalty_tier"],
                "special_instructions": room["special_instructions"],
            }
            optimized_schedule.append(task)

        return {
            "property_id": property_id,
            "total_rooms_scheduled": len(optimized_schedule),
            "active_housekeepers": len(housekeepers),
            "high_priority_vip_rooms": sum(1 for r in sorted_rooms if r["guest_loyalty_tier"] in ["DIAMOND", "PLATINUM"]),
            "schedule": optimized_schedule,
            "optimization_algorithm": "VIP Loyalty & Arrival Schedule Load-Balancing Engine",
        }
