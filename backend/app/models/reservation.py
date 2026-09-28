from typing import Any, Dict, Optional


def reservation_helper(
    res: Dict[str, Any],
    guest_name: Optional[str] = None,
    guest_email: Optional[str] = None,
    guest_phone: Optional[str] = None,
    property_name: Optional[str] = None,
    room_type_name: Optional[str] = None,
    room_number: Optional[str] = None,
) -> Dict[str, Any]:
    """Helper to convert MongoDB reservation document to serializable dict for Pydantic."""
    if not res:
        return {}
    
    return {
        "id": str(res.get("_id")),
        "booking_reference": res.get("booking_reference"),
        "property_id": str(res.get("property_id")),
        "guest_id": str(res.get("guest_id")),
        "room_type_id": str(res.get("room_type_id")),
        "room_id": str(res.get("room_id")),
        "check_in_date": res.get("check_in_date"),
        "check_out_date": res.get("check_out_date"),
        "number_of_adults": res.get("number_of_adults", 1),
        "number_of_children": res.get("number_of_children", 0),
        "number_of_rooms": res.get("number_of_rooms", 1),
        "rate_per_night": float(res.get("rate_per_night", 0.0)),
        "number_of_nights": res.get("number_of_nights", 1),
        "subtotal": float(res.get("subtotal", 0.0)),
        "taxes": float(res.get("taxes", 0.0)),
        "discounts": float(res.get("discounts", 0.0)),
        "total_amount": float(res.get("total_amount", 0.0)),
        "special_requests": res.get("special_requests"),
        "source": res.get("source", "DIRECT"),
        "status": res.get("status", "CONFIRMED"),
        "guest_name": guest_name,
        "guest_email": guest_email,
        "guest_phone": guest_phone,
        "property_name": property_name,
        "room_type_name": room_type_name,
        "room_number": room_number,
        "checked_in_at": res.get("checked_in_at"),
        "checked_in_by": res.get("checked_in_by"),
        "checked_out_at": res.get("checked_out_at"),
        "checked_out_by": res.get("checked_out_by"),
        "created_at": res.get("created_at"),
        "updated_at": res.get("updated_at"),
        "created_by": res.get("created_by"),
    }
