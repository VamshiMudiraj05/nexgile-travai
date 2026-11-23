from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def omnichannel_message_helper(m: Dict[str, Any]) -> Dict[str, Any]:
    if not m:
        return {}
    return {
        "id": str(m.get("_id")),
        "channel": m.get("channel", "WHATSAPP"),  # WHATSAPP, SMS, EMAIL, IN_APP_CHAT
        "guest_name": m.get("guest_name", "Valued Guest"),
        "guest_phone": m.get("guest_phone", ""),
        "guest_email": m.get("guest_email", ""),
        "reservation_id": m.get("reservation_id"),
        "room_number": m.get("room_number", "Unassigned"),
        "incoming_message": m.get("incoming_message", ""),
        "detected_intent": m.get("detected_intent", "CONCIERGE_INQUIRY"),
        "sentiment_score": float(m.get("sentiment_score", 0.8)),
        "ai_automated_reply": m.get("ai_automated_reply", ""),
        "assigned_department": m.get("assigned_department", "FRONT_DESK"),
        "assigned_staff": m.get("assigned_staff"),
        "priority": m.get("priority", "MEDIUM"),  # LOW, MEDIUM, HIGH, URGENT
        "status": m.get("status", "AUTO_RESOLVED"),  # AUTO_RESOLVED, DISPATCHED_TO_STAFF, STAFF_RESOLVED
        "staff_notes": m.get("staff_notes", ""),
        "created_at": m.get("created_at"),
        "updated_at": m.get("updated_at"),
    }


def post_stay_survey_helper(s: Dict[str, Any]) -> Dict[str, Any]:
    if not s:
        return {}
    return {
        "id": str(s.get("_id")),
        "reservation_id": s.get("reservation_id", ""),
        "guest_name": s.get("guest_name", "Guest"),
        "guest_email": s.get("guest_email", ""),
        "property_id": s.get("property_id", ""),
        "nps_score": int(s.get("nps_score", 9)),  # 0 to 10
        "csat_score": int(s.get("csat_score", 5)),  # 1 to 5
        "cleanliness_rating": int(s.get("cleanliness_rating", 5)),
        "staff_rating": int(s.get("staff_rating", 5)),
        "comments": s.get("comments", ""),
        "sentiment_category": s.get("sentiment_category", "PROMOTER"),  # PROMOTER, PASSIVE, DETRACTOR
        "service_recovery_ticket_id": s.get("service_recovery_ticket_id"),
        "created_at": s.get("created_at"),
    }


def housekeeping_task_helper(t: Dict[str, Any]) -> Dict[str, Any]:
    if not t:
        return {}
    return {
        "id": str(t.get("_id")),
        "property_id": t.get("property_id", ""),
        "room_number": t.get("room_number", ""),
        "room_type": t.get("room_type", "Standard Room"),
        "cleaning_status": t.get("cleaning_status", "DIRTY"),  # DIRTY, IN_PROGRESS, INSPECTED, CLEAN
        "priority_rank": int(t.get("priority_rank", 1)),
        "priority_reason": t.get("priority_reason", "Standard Turnaround"),
        "assigned_housekeeper": t.get("assigned_housekeeper", "Unassigned"),
        "estimated_duration_minutes": int(t.get("estimated_duration_minutes", 30)),
        "scheduled_start_time": t.get("scheduled_start_time", "11:00 AM"),
        "guest_arrival_time": t.get("guest_arrival_time", "03:00 PM"),
        "guest_loyalty_tier": t.get("guest_loyalty_tier", "STANDARD"),
        "special_instructions": t.get("special_instructions", ""),
        "created_at": t.get("created_at"),
        "updated_at": t.get("updated_at"),
    }
