from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def rate_plan_helper(rp: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB rate_plan document to serializable dict for Pydantic."""
    if not rp:
        return {}

    inclusions = []
    for inc in rp.get("inclusions", []):
        inclusions.append({
            "name": inc.get("name", ""),
            "description": inc.get("description", ""),
            "value": float(inc.get("value", 0.0)),
        })

    restrictions = rp.get("restrictions", {}) or {}

    return {
        "id": str(rp.get("_id")),
        "property_id": str(rp.get("property_id", "")),
        "room_type_id": str(rp.get("room_type_id", "")),
        "code": rp.get("code", "BAR"),
        "name": rp.get("name", "Best Available Rate"),
        "description": rp.get("description", "Standard flexible rate plan with daily housekeeping."),
        "rate_multiplier": float(rp.get("rate_multiplier", 1.0)),
        "fixed_adjustment": float(rp.get("fixed_adjustment", 0.0)),
        "meal_plan": rp.get("meal_plan", "ROOM_ONLY"),
        "cancellation_policy": rp.get("cancellation_policy", "FLEXIBLE_24H"),
        "is_active": rp.get("is_active", True),
        "is_default": rp.get("is_default", False),
        "inclusions": inclusions,
        "restrictions": {
            "min_los": int(restrictions.get("min_los", 1)),
            "max_los": int(restrictions.get("max_los", 30)),
            "closed_to_arrival": bool(restrictions.get("closed_to_arrival", False)),
            "closed_to_departure": bool(restrictions.get("closed_to_departure", False)),
            "min_advance_days": int(restrictions.get("min_advance_days", 0)),
            "max_advance_days": int(restrictions.get("max_advance_days", 365)),
        },
        "created_at": rp.get("created_at"),
        "updated_at": rp.get("updated_at"),
    }
