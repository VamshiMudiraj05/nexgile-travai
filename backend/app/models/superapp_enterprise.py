from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def wallet_helper(w: Dict[str, Any]) -> Dict[str, Any]:
    if not w:
        return {}
    return {
        "id": str(w.get("_id")),
        "user_id": str(w.get("user_id", "")),
        "cash_balance": float(w.get("cash_balance", 250.0)),
        "currency": w.get("currency", "USD"),
        "loyalty_points": int(w.get("loyalty_points", 15400)),
        "points_cash_value": round(float(w.get("loyalty_points", 15400)) * 0.01, 2),
        "referral_code": w.get("referral_code", "TRAV-VIP99"),
        "referral_earnings": float(w.get("referral_earnings", 75.0)),
        "transactions": w.get("transactions", []),
        "created_at": w.get("created_at"),
        "updated_at": w.get("updated_at"),
    }


def vault_document_helper(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    return {
        "id": str(doc.get("_id")),
        "user_id": str(doc.get("user_id", "")),
        "doc_type": doc.get("doc_type", "PASSPORT"),  # PASSPORT, VISA, BOARDING_PASS, DIGITAL_ROOM_KEY, HEALTH_PASS
        "title": doc.get("title", ""),
        "holder_name": doc.get("holder_name", ""),
        "document_number_masked": doc.get("document_number_masked", ""),
        "issuing_country": doc.get("issuing_country", ""),
        "expiry_date": doc.get("expiry_date", ""),
        "is_expired": doc.get("is_expired", False),
        "expires_soon": doc.get("expires_soon", False),  # < 6 months
        "nfc_ble_token": doc.get("nfc_ble_token"),
        "barcode_payload": doc.get("barcode_payload"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


def tenant_helper(t: Dict[str, Any]) -> Dict[str, Any]:
    if not t:
        return {}
    return {
        "id": str(t.get("_id")),
        "tenant_id": t.get("tenant_id", ""),
        "organization_name": t.get("organization_name", ""),
        "subdomain": t.get("subdomain", ""),
        "primary_brand_color": t.get("primary_brand_color", "#3B82F6"),
        "secondary_brand_color": t.get("secondary_brand_color", "#1E293B"),
        "logo_url": t.get("logo_url", ""),
        "data_isolation_level": t.get("data_isolation_level", "STRICT_COLLECTION_PARTITION"),
        "active_properties_count": int(t.get("active_properties_count", 1)),
        "status": t.get("status", "ACTIVE"),
        "created_at": t.get("created_at"),
        "updated_at": t.get("updated_at"),
    }
