from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId


def user_helper(user: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB user document to serializable dict for Pydantic."""
    if not user:
        return {}
    
    return {
        "id": str(user.get("_id")),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }
