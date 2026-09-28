from typing import Any, Dict


def property_helper(prop: Dict[str, Any], total_rooms: int = 0, total_room_types: int = 0) -> Dict[str, Any]:
    """Helper to convert MongoDB property document to serializable dict for Pydantic."""
    if not prop:
        return {}
    
    return {
        "id": str(prop.get("_id")),
        "name": prop.get("name"),
        "property_code": prop.get("property_code"),
        "property_type": prop.get("property_type", "HOTEL"),
        "description": prop.get("description"),
        "address": prop.get("address"),
        "city": prop.get("city"),
        "state": prop.get("state"),
        "country": prop.get("country", "India"),
        "postal_code": prop.get("postal_code"),
        "latitude": prop.get("latitude"),
        "longitude": prop.get("longitude"),
        "phone": prop.get("phone"),
        "email": prop.get("email"),
        "website": prop.get("website"),
        "star_rating": prop.get("star_rating", 4),
        "amenities": prop.get("amenities", []),
        "images": prop.get("images", []),
        "check_in_time": prop.get("check_in_time", "14:00"),
        "check_out_time": prop.get("check_out_time", "11:00"),
        "currency": prop.get("currency", "INR"),
        "timezone": prop.get("timezone", "Asia/Kolkata"),
        "status": prop.get("status", "ACTIVE"),
        "total_rooms": total_rooms,
        "total_room_types": total_room_types,
        "created_at": prop.get("created_at"),
        "updated_at": prop.get("updated_at"),
        "created_by": prop.get("created_by"),
    }
