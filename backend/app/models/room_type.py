from typing import Any, Dict


def room_type_helper(rt: Dict[str, Any], total_rooms: int = 0) -> Dict[str, Any]:
    """Helper to convert MongoDB room_type document to serializable dict for Pydantic."""
    if not rt:
        return {}
    
    return {
        "id": str(rt.get("_id")),
        "property_id": str(rt.get("property_id")),
        "name": rt.get("name"),
        "code": rt.get("code"),
        "description": rt.get("description"),
        "max_occupancy": rt.get("max_occupancy", 2),
        "adults_capacity": rt.get("adults_capacity", 2),
        "children_capacity": rt.get("children_capacity", 1),
        "bed_type": rt.get("bed_type", "KING"),
        "bed_count": rt.get("bed_count", 1),
        "base_price": float(rt.get("base_price", 0.0)),
        "amenities": rt.get("amenities", []),
        "size": rt.get("size", "350 sq ft"),
        "images": rt.get("images", []),
        "status": rt.get("status", "ACTIVE"),
        "total_rooms": total_rooms,
        "created_at": rt.get("created_at"),
        "updated_at": rt.get("updated_at"),
    }
