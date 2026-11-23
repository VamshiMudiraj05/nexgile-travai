from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def cart_helper(cart: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB unified_cart document."""
    if not cart:
        return {}

    items = []
    for it in cart.get("items", []):
        items.append({
            "item_id": str(it.get("item_id", it.get("id", ""))),
            "product_type": it.get("product_type", "HOTEL"),  # HOTEL, FLIGHT, CAR, ACTIVITY, PACKAGE
            "title": it.get("title", ""),
            "subtitle": it.get("subtitle", ""),
            "dates": it.get("dates", ""),
            "quantity": int(it.get("quantity", 1)),
            "unit_price": float(it.get("unit_price", 0.0)),
            "total_price": float(it.get("total_price", 0.0)),
            "details": it.get("details", {}),
        })

    return {
        "id": str(cart.get("_id")),
        "user_id": str(cart.get("user_id", "")),
        "status": cart.get("status", "ACTIVE"),  # ACTIVE, HELD, CHECKED_OUT, EXPIRED
        "items": items,
        "subtotal": float(cart.get("subtotal", 0.0)),
        "discount_amount": float(cart.get("discount_amount", 0.0)),
        "promo_code": cart.get("promo_code"),
        "tax_amount": float(cart.get("tax_amount", 0.0)),
        "total_amount": float(cart.get("total_amount", 0.0)),
        "currency": cart.get("currency", "USD"),
        "hold_expires_at": cart.get("hold_expires_at"),
        "created_at": cart.get("created_at"),
        "updated_at": cart.get("updated_at"),
    }


def voucher_helper(vch: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB booking_voucher document."""
    if not vch:
        return {}

    return {
        "id": str(vch.get("_id")),
        "voucher_code": vch.get("voucher_code", ""),
        "booking_reference": vch.get("booking_reference", ""),
        "product_type": vch.get("product_type", "HOTEL"),
        "supplier_name": vch.get("supplier_name", "Nexgile Travel Partner"),
        "supplier_confirmation_code": vch.get("supplier_confirmation_code", ""),
        "traveler_name": vch.get("traveler_name", "Valued Traveler"),
        "traveler_email": vch.get("traveler_email", ""),
        "title": vch.get("title", ""),
        "valid_dates": vch.get("valid_dates", ""),
        "inclusions": vch.get("inclusions", []),
        "status": vch.get("status", "ISSUED"),  # ISSUED, REDEEMED, VOID
        "qr_payload": vch.get("qr_payload", ""),
        "issued_at": vch.get("issued_at"),
    }
