from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def channel_helper(ch: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB channel document to serializable dict for Pydantic."""
    if not ch:
        return {}

    return {
        "id": str(ch.get("_id")),
        "code": ch.get("code", "DIRECT_WEB"),
        "name": ch.get("name", "Direct Website"),
        "channel_type": ch.get("channel_type", "DIRECT"),  # OTA, GDS, METASEARCH, DIRECT, WHOLESALER
        "status": ch.get("status", "ACTIVE"),  # ACTIVE, PAUSED, ERROR
        "commission_pct": float(ch.get("commission_pct", 0.0)),
        "rate_parity_markup": float(ch.get("rate_parity_markup", 0.0)),
        "api_endpoint": ch.get("api_endpoint", ""),
        "supports_two_way_ari": bool(ch.get("supports_two_way_ari", True)),
        "last_sync_at": ch.get("last_sync_at"),
        "sync_health": ch.get("sync_health", "HEALTHY"),  # HEALTHY, DEGRADED, OFFLINE
        "latency_ms": int(ch.get("latency_ms", 120)),
        "created_at": ch.get("created_at"),
        "updated_at": ch.get("updated_at"),
    }


def channel_mapping_helper(cm: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB channel_mapping document to serializable dict."""
    if not cm:
        return {}

    return {
        "id": str(cm.get("_id")),
        "property_id": str(cm.get("property_id", "")),
        "room_type_id": str(cm.get("room_type_id", "")),
        "room_type_name": cm.get("room_type_name", "Deluxe Room"),
        "channel_code": cm.get("channel_code", ""),
        "channel_room_code": cm.get("channel_room_code", ""),
        "channel_rate_plan_code": cm.get("channel_rate_plan_code", "BAR"),
        "stop_sell": bool(cm.get("stop_sell", False)),
        "created_at": cm.get("created_at"),
        "updated_at": cm.get("updated_at"),
    }


def channel_allotment_helper(ca: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB channel_allotment document to serializable dict."""
    if not ca:
        return {}

    return {
        "id": str(ca.get("_id")),
        "property_id": str(ca.get("property_id", "")),
        "room_type_id": str(ca.get("room_type_id", "")),
        "channel_code": ca.get("channel_code", ""),
        "date": ca.get("date", ""),
        "allocated_rooms": int(ca.get("allocated_rooms", 5)),
        "sold_rooms": int(ca.get("sold_rooms", 0)),
        "available_rooms": int(ca.get("allocated_rooms", 5)) - int(ca.get("sold_rooms", 0)),
        "stop_sell": bool(ca.get("stop_sell", False)),
        "created_at": ca.get("created_at"),
        "updated_at": ca.get("updated_at"),
    }


def sync_log_helper(log: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB channel_sync_log document."""
    if not log:
        return {}

    return {
        "id": str(log.get("_id")),
        "channel_code": log.get("channel_code", ""),
        "event_type": log.get("event_type", "ARI_PUSH"),  # ARI_PUSH, BOOKING_PULL, RATE_PARITY_AUDIT
        "status": log.get("status", "SUCCESS"),  # SUCCESS, RETRY_QUEUED, FAILED
        "items_synced": int(log.get("items_synced", 1)),
        "latency_ms": int(log.get("latency_ms", 150)),
        "details": log.get("details", "ARI availability push completed successfully."),
        "timestamp": log.get("timestamp"),
    }
