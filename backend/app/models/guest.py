from typing import Any, Dict


def guest_helper(guest: Dict[str, Any], total_bookings: int = 0) -> Dict[str, Any]:
    """Helper to convert MongoDB guest document to serializable dict for Pydantic."""
    if not guest:
        return {}
    
    return {
        "id": str(guest.get("_id")),
        "first_name": guest.get("first_name"),
        "last_name": guest.get("last_name"),
        "email": guest.get("email"),
        "phone": guest.get("phone"),
        "date_of_birth": guest.get("date_of_birth"),
        "nationality": guest.get("nationality", "Indian"),
        "gender": guest.get("gender"),
        "address": guest.get("address"),
        "city": guest.get("city"),
        "state": guest.get("state"),
        "country": guest.get("country", "India"),
        "postal_code": guest.get("postal_code"),
        "identity_type": guest.get("identity_type"),
        "identity_number": guest.get("identity_number"),
        "identity_document_url": guest.get("identity_document_url"),
        "preferences": guest.get("preferences"),
        "notes": guest.get("notes"),
        "loyalty_id": guest.get("loyalty_id"),
        "total_bookings": total_bookings,
        "created_at": guest.get("created_at"),
        "updated_at": guest.get("updated_at"),
    }
