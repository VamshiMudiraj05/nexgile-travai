from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def corporate_account_helper(acc: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB corporate_account document to serializable dict for Pydantic."""
    if not acc:
        return {}

    return {
        "id": str(acc.get("_id")),
        "company_name": acc.get("company_name", ""),
        "corporate_code": acc.get("corporate_code", ""),
        "industry": acc.get("industry", "ENTERPRISE"),
        "contact_name": acc.get("contact_name", ""),
        "contact_email": acc.get("contact_email", ""),
        "contact_phone": acc.get("contact_phone", ""),
        "billing_address": acc.get("billing_address", ""),
        "tax_identifier": acc.get("tax_identifier", ""),
        "contracted_discount_pct": float(acc.get("contracted_discount_pct", 15.0)),
        "payment_terms": acc.get("payment_terms", "DIRECT_BILL"),  # DIRECT_BILL, CREDIT_CARD
        "credit_limit": float(acc.get("credit_limit", 50000.0)),
        "current_balance": float(acc.get("current_balance", 0.0)),
        "status": acc.get("status", "ACTIVE"),  # ACTIVE, SUSPENDED
        "created_at": acc.get("created_at"),
        "updated_at": acc.get("updated_at"),
    }


def group_block_helper(gb: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB group_block document to serializable dict for Pydantic."""
    if not gb:
        return {}

    return {
        "id": str(gb.get("_id")),
        "property_id": str(gb.get("property_id", "")),
        "corporate_account_id": str(gb.get("corporate_account_id", "")) if gb.get("corporate_account_id") else None,
        "group_name": gb.get("group_name", ""),
        "group_code": gb.get("group_code", ""),
        "check_in_date": gb.get("check_in_date", ""),
        "check_out_date": gb.get("check_out_date", ""),
        "cutoff_date": gb.get("cutoff_date", ""),
        "room_type_id": str(gb.get("room_type_id", "")),
        "room_type_name": gb.get("room_type_name", "Deluxe Suite"),
        "total_rooms_blocked": int(gb.get("total_rooms_blocked", 10)),
        "rooms_picked_up": int(gb.get("rooms_picked_up", 0)),
        "rooms_remaining": int(gb.get("total_rooms_blocked", 10)) - int(gb.get("rooms_picked_up", 0)),
        "agreed_rate": float(gb.get("agreed_rate", 200.0)),
        "coordinator_name": gb.get("coordinator_name", ""),
        "coordinator_email": gb.get("coordinator_email", ""),
        "status": gb.get("status", "DEFINITE"),  # TENTATIVE, DEFINITE, RELEASED, CANCELLED
        "notes": gb.get("notes", ""),
        "created_at": gb.get("created_at"),
        "updated_at": gb.get("updated_at"),
    }
