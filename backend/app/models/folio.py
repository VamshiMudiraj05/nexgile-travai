from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def folio_helper(folio: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB folio document to serializable dict for Pydantic."""
    if not folio:
        return {}

    charges = []
    for c in folio.get("charges", []):
        charges.append({
            "id": str(c.get("_id", c.get("id", ""))),
            "category": c.get("category", "ROOM_CHARGE"),
            "description": c.get("description", ""),
            "amount": float(c.get("amount", 0.0)),
            "currency": c.get("currency", "USD"),
            "tax_amount": float(c.get("tax_amount", 0.0)),
            "date": c.get("date"),
            "posted_by": c.get("posted_by", "SYSTEM"),
        })

    payments = []
    for p in folio.get("payments", []):
        payments.append({
            "id": str(p.get("_id", p.get("id", ""))),
            "payment_method": p.get("payment_method", "CARD"),
            "amount": float(p.get("amount", 0.0)),
            "currency": p.get("currency", "USD"),
            "transaction_reference": p.get("transaction_reference", ""),
            "status": p.get("status", "COMPLETED"),
            "date": p.get("date"),
        })

    return {
        "id": str(folio.get("_id")),
        "reservation_id": str(folio.get("reservation_id", "")),
        "property_id": str(folio.get("property_id", "")),
        "guest_id": str(folio.get("guest_id", "")),
        "guest_name": folio.get("guest_name", "Valued Guest"),
        "guest_email": folio.get("guest_email", ""),
        "room_number": folio.get("room_number", ""),
        "currency": folio.get("currency", "USD"),
        "status": folio.get("status", "OPEN"),  # OPEN, SETTLED, CLOSED
        "charges": charges,
        "payments": payments,
        "total_charges": float(folio.get("total_charges", 0.0)),
        "total_tax": float(folio.get("total_tax", 0.0)),
        "total_paid": float(folio.get("total_paid", 0.0)),
        "balance": float(folio.get("balance", 0.0)),
        "invoice_number": folio.get("invoice_number"),
        "created_at": folio.get("created_at"),
        "updated_at": folio.get("updated_at"),
    }
