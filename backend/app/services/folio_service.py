import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.folio import folio_helper
from app.core.logging import logger


class FolioService:
    @staticmethod
    async def get_or_create_folio_for_reservation(reservation_id: str) -> Dict[str, Any]:
        """Retrieve existing folio or instantiate a new guest folio for a reservation."""
        db = get_database()
        
        # Check if a folio already exists for this reservation
        existing_folio = await db.folios.find_one({
            "$or": [
                {"reservation_id": ObjectId(reservation_id) if ObjectId.is_valid(reservation_id) else None},
                {"reservation_id": reservation_id}
            ]
        })
        if existing_folio:
            return folio_helper(existing_folio)

        # Fetch reservation details to populate initial folio
        res_filter = {"_id": ObjectId(reservation_id)} if ObjectId.is_valid(reservation_id) else {"_id": reservation_id}
        reservation = await db.reservations.find_one(res_filter)
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reservation with ID '{reservation_id}' not found."
            )

        # Room details
        room_number = "TBD"
        if reservation.get("room_id"):
            room_obj_id = ObjectId(reservation["room_id"]) if ObjectId.is_valid(reservation["room_id"]) else reservation["room_id"]
            room = await db.rooms.find_one({"_id": room_obj_id})
            if room:
                room_number = room.get("room_number", "TBD")

        # Initial room charge line item based on reservation total
        base_amount = float(reservation.get("total_amount", 0.0))
        # Estimate tax breakdown if included
        tax_amount = round(base_amount * 0.12, 2)
        room_charge_net = round(base_amount - tax_amount, 2) if base_amount > tax_amount else base_amount

        initial_charges = [
            {
                "_id": str(uuid.uuid4())[:8],
                "category": "ROOM_CHARGE",
                "description": f"Lodging Charges (Ref: {reservation.get('reference_number', 'Stay')})",
                "amount": room_charge_net,
                "currency": "USD",
                "tax_amount": tax_amount,
                "date": datetime.now(timezone.utc),
                "posted_by": "PMS_AUTO",
            }
        ]

        # Initial payments (if paid online or deposit placed)
        initial_payments = []
        if reservation.get("payment_status") == "PAID":
            initial_payments.append({
                "_id": str(uuid.uuid4())[:8],
                "payment_method": "CARD",
                "amount": base_amount,
                "currency": "USD",
                "transaction_reference": reservation.get("payment_reference", f"TXN-{uuid.uuid4().hex[:6].upper()}"),
                "status": "COMPLETED",
                "date": datetime.now(timezone.utc),
            })

        total_charges = sum(c["amount"] for c in initial_charges)
        total_tax = sum(c["tax_amount"] for c in initial_charges)
        total_paid = sum(p["amount"] for p in initial_payments)
        balance = round((total_charges + total_tax) - total_paid, 2)

        invoice_seq = str(uuid.uuid4().hex[:8].upper())
        invoice_number = f"INV-{datetime.now(timezone.utc).strftime('%Y%m')}-{invoice_seq}"

        now = datetime.now(timezone.utc)
        folio_doc = {
            "reservation_id": str(reservation["_id"]),
            "property_id": str(reservation.get("property_id", "")),
            "guest_id": str(reservation.get("guest_id", "")),
            "guest_name": reservation.get("guest_name", "Valued Guest"),
            "guest_email": reservation.get("guest_email", ""),
            "room_number": room_number,
            "currency": "USD",
            "status": "SETTLED" if balance <= 0.0 else "OPEN",
            "charges": initial_charges,
            "payments": initial_payments,
            "total_charges": total_charges,
            "total_tax": total_tax,
            "total_paid": total_paid,
            "balance": balance,
            "invoice_number": invoice_number,
            "created_at": now,
            "updated_at": now,
        }

        result = await db.folios.insert_one(folio_doc)
        folio_doc["_id"] = result.inserted_id
        return folio_helper(folio_doc)

    @staticmethod
    async def get_folio(folio_id: str) -> Dict[str, Any]:
        """Retrieve folio by ID."""
        db = get_database()
        query = {"_id": ObjectId(folio_id)} if ObjectId.is_valid(folio_id) else {"_id": folio_id}
        folio = await db.folios.find_one(query)
        if not folio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Folio with ID '{folio_id}' not found."
            )
        return folio_helper(folio)

    @staticmethod
    async def get_folio_by_reservation(reservation_id: str) -> Dict[str, Any]:
        """Retrieve or create folio for reservation."""
        return await FolioService.get_or_create_folio_for_reservation(reservation_id)

    @staticmethod
    async def list_folios(
        property_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List active folios with optional filters."""
        db = get_database()
        query: Dict[str, Any] = {}
        if property_id:
            query["property_id"] = property_id
        if status_filter:
            query["status"] = status_filter.upper()

        cursor = db.folios.find(query).sort("created_at", -1).limit(limit)
        folios = await cursor.to_list(length=limit)
        return [folio_helper(f) for f in folios]

    @staticmethod
    async def add_charge(folio_id: str, payload: Dict[str, Any], user_name: str = "FRONT_DESK") -> Dict[str, Any]:
        """Post a room charge, dining fee, or incidental onto a folio."""
        db = get_database()
        query = {"_id": ObjectId(folio_id)} if ObjectId.is_valid(folio_id) else {"_id": folio_id}
        folio = await db.folios.find_one(query)
        if not folio:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folio not found")

        amount = float(payload.get("amount", 0.0))
        tax_rate = float(payload.get("tax_rate", 0.12))
        tax_amount = round(amount * tax_rate, 2)

        charge_entry = {
            "_id": str(uuid.uuid4())[:8],
            "category": payload.get("category", "MISCELLANEOUS"),
            "description": payload.get("description", "Incidental Charge"),
            "amount": round(amount, 2),
            "currency": payload.get("currency", "USD"),
            "tax_amount": tax_amount,
            "date": datetime.now(timezone.utc),
            "posted_by": user_name,
        }

        updated_charges = folio.get("charges", []) + [charge_entry]
        total_charges = sum(float(c.get("amount", 0.0)) for c in updated_charges)
        total_tax = sum(float(c.get("tax_amount", 0.0)) for c in updated_charges)
        total_paid = float(folio.get("total_paid", 0.0))
        new_balance = round((total_charges + total_tax) - total_paid, 2)

        new_status = "SETTLED" if new_balance <= 0.0 else "OPEN"

        await db.folios.update_one(
            query,
            {
                "$set": {
                    "charges": updated_charges,
                    "total_charges": total_charges,
                    "total_tax": total_tax,
                    "balance": new_balance,
                    "status": new_status,
                    "updated_at": datetime.now(timezone.utc),
                }
            }
        )

        return await FolioService.get_folio(folio_id)

    @staticmethod
    async def add_payment(folio_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Record a guest payment (Card, Cash, PayPal, Loyalty Points, Direct Bill)."""
        db = get_database()
        query = {"_id": ObjectId(folio_id)} if ObjectId.is_valid(folio_id) else {"_id": folio_id}
        folio = await db.folios.find_one(query)
        if not folio:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folio not found")

        amount = float(payload.get("amount", 0.0))
        txn_ref = payload.get("transaction_reference") or f"TXN-{uuid.uuid4().hex[:8].upper()}"

        payment_entry = {
            "_id": str(uuid.uuid4())[:8],
            "payment_method": payload.get("payment_method", "CARD"),
            "amount": round(amount, 2),
            "currency": payload.get("currency", "USD"),
            "transaction_reference": txn_ref,
            "status": "COMPLETED",
            "date": datetime.now(timezone.utc),
        }

        updated_payments = folio.get("payments", []) + [payment_entry]
        total_charges = float(folio.get("total_charges", 0.0))
        total_tax = float(folio.get("total_tax", 0.0))
        total_paid = sum(float(p.get("amount", 0.0)) for p in updated_payments)
        new_balance = round((total_charges + total_tax) - total_paid, 2)

        new_status = "SETTLED" if new_balance <= 0.0 else "OPEN"

        await db.folios.update_one(
            query,
            {
                "$set": {
                    "payments": updated_payments,
                    "total_paid": total_paid,
                    "balance": new_balance,
                    "status": new_status,
                    "updated_at": datetime.now(timezone.utc),
                }
            }
        )

        return await FolioService.get_folio(folio_id)

    @staticmethod
    async def generate_invoice(folio_id: str) -> Dict[str, Any]:
        """Generate a complete audit-ready tax invoice for accounting & guest."""
        folio = await FolioService.get_folio(folio_id)
        db = get_database()

        # Fetch Property information
        property_id = folio.get("property_id")
        prop_query = {"_id": ObjectId(property_id)} if ObjectId.is_valid(property_id) else {"_id": property_id}
        prop = await db.properties.find_one(prop_query) or {}

        prop_name = prop.get("name", "Nexgile Resort & Estate")
        prop_addr_obj = prop.get("address", {})
        if isinstance(prop_addr_obj, dict):
            prop_address = f"{prop_addr_obj.get('street', '100 Resort Way')}, {prop_addr_obj.get('city', '')}, {prop_addr_obj.get('country', '')}"
        else:
            prop_address = str(prop_addr_obj or "100 Resort Way")

        # Fetch Reservation dates
        res_id = folio.get("reservation_id")
        res_query = {"_id": ObjectId(res_id)} if ObjectId.is_valid(res_id) else {"_id": res_id}
        res = await db.reservations.find_one(res_query) or {}

        check_in = res.get("check_in_date", "N/A")
        check_out = res.get("check_out_date", "N/A")

        subtotal = folio["total_charges"]
        tax_total = folio["total_tax"]
        total = round(subtotal + tax_total, 2)
        amount_paid = folio["total_paid"]
        amount_due = folio["balance"]

        return {
            "invoice_number": folio.get("invoice_number", f"INV-{uuid.uuid4().hex[:8].upper()}"),
            "folio_id": folio["id"],
            "reservation_id": folio["reservation_id"],
            "property_name": prop_name,
            "property_address": prop_address,
            "property_tax_id": "TAX-US-99482103-X",
            "guest_name": folio["guest_name"],
            "guest_email": folio["guest_email"],
            "check_in_date": check_in,
            "check_out_date": check_out,
            "room_number": folio["room_number"],
            "issue_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "currency": folio["currency"],
            "subtotal": subtotal,
            "tax_total": tax_total,
            "total": total,
            "amount_paid": amount_paid,
            "amount_due": amount_due,
            "status": "PAID_IN_FULL" if amount_due <= 0.0 else "OUTSTANDING",
            "line_items": folio["charges"],
            "payments": folio["payments"],
        }
