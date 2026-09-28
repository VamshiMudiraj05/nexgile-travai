from typing import Any, Dict, Optional


def room_helper(
    room: Dict[str, Any],
    property_name: Optional[str] = None,
    room_type_name: Optional[str] = None,
    current_guest_name: Optional[str] = None,
    current_reservation_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Helper to convert MongoDB room document to serializable dict for Pydantic."""
    if not room:
        return {}
    
    return {
        "id": str(room.get("_id")),
        "property_id": str(room.get("property_id")),
        "room_type_id": str(room.get("room_type_id")),
        "room_number": str(room.get("room_number")),
        "floor": room.get("floor", 1),
        "status": room.get("status", "AVAILABLE"),
        "housekeeping_status": room.get("housekeeping_status", "CLEAN"),
        "maintenance_status": room.get("maintenance_status", "NONE"),
        "notes": room.get("notes"),
        "property_name": property_name,
        "room_type_name": room_type_name,
        "current_guest_name": current_guest_name,
        "current_reservation_id": current_reservation_id,
        "created_at": room.get("created_at"),
        "updated_at": room.get("updated_at"),
    }
