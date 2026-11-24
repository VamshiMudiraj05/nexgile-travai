from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.corporate_account import corporate_account_helper, group_block_helper
from app.core.logging import logger


class CorporateService:
    # --- CORPORATE ACCOUNTS ---
    @staticmethod
    async def list_corporate_accounts(active_only: bool = False) -> List[Dict[str, Any]]:
        """List all contracted corporate client accounts."""
        db = get_database()
        query: Dict[str, Any] = {}
        if active_only:
            query["status"] = "ACTIVE"

        cursor = db.corporate_accounts.find(query).sort("company_name", 1)
        accounts = await cursor.to_list(length=100)

        if not accounts:
            await CorporateService.seed_default_accounts()
            cursor = db.corporate_accounts.find(query).sort("company_name", 1)
            accounts = await cursor.to_list(length=100)

        return [corporate_account_helper(a) for a in accounts]

    @staticmethod
    async def get_corporate_account(account_id: str) -> Dict[str, Any]:
        """Fetch corporate account by ID."""
        db = get_database()
        query = {"_id": ObjectId(account_id)} if ObjectId.is_valid(account_id) else {"_id": account_id}
        acc = await db.corporate_accounts.find_one(query)
        if not acc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Corporate account not found")
        return corporate_account_helper(acc)

    @staticmethod
    async def create_corporate_account(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new contracted corporate account."""
        db = get_database()
        now = datetime.now(timezone.utc)
        doc = dict(payload)
        code = doc.get("corporate_code", "").upper().strip()
        doc["corporate_code"] = code

        # Check unique code
        existing = await db.corporate_accounts.find_one({"corporate_code": code})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Corporate code '{code}' is already registered."
            )

        doc["current_balance"] = 0.0
        doc["created_at"] = now
        doc["updated_at"] = now

        res = await db.corporate_accounts.insert_one(doc)
        doc["_id"] = res.inserted_id
        logger.info(f"Corporate account created: {doc['company_name']} ({code})")
        return corporate_account_helper(doc)

    @staticmethod
    async def update_corporate_account(account_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Update contracted rates, credit limits, or contacts."""
        db = get_database()
        query = {"_id": ObjectId(account_id)} if ObjectId.is_valid(account_id) else {"_id": account_id}
        existing = await db.corporate_accounts.find_one(query)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Corporate account not found")

        update_dict = {k: v for k, v in payload.items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)

        await db.corporate_accounts.update_one(query, {"$set": update_dict})
        return await CorporateService.get_corporate_account(account_id)

    @staticmethod
    async def verify_corporate_code(code: str) -> Dict[str, Any]:
        """Verify if a corporate promo code is valid and active."""
        db = get_database()
        clean_code = code.upper().strip()
        acc = await db.corporate_accounts.find_one({"corporate_code": clean_code})

        if not acc:
            return {
                "is_valid": False,
                "account_id": None,
                "company_name": None,
                "corporate_code": clean_code,
                "contracted_discount_pct": 0.0,
                "payment_terms": "CREDIT_CARD",
                "message": f"Corporate code '{clean_code}' was not found in enterprise registry.",
            }

        if acc.get("status") != "ACTIVE":
            return {
                "is_valid": False,
                "account_id": str(acc["_id"]),
                "company_name": acc.get("company_name"),
                "corporate_code": clean_code,
                "contracted_discount_pct": 0.0,
                "payment_terms": acc.get("payment_terms", "CREDIT_CARD"),
                "message": f"Corporate account for '{acc.get('company_name')}' is currently suspended.",
            }

        return {
            "is_valid": True,
            "account_id": str(acc["_id"]),
            "company_name": acc.get("company_name"),
            "corporate_code": clean_code,
            "contracted_discount_pct": float(acc.get("contracted_discount_pct", 15.0)),
            "payment_terms": acc.get("payment_terms", "DIRECT_BILL"),
            "message": f"Corporate contract verified: {acc.get('company_name')} ({acc.get('contracted_discount_pct')}% Negotiated Discount).",
        }

    # --- GROUP BLOCKS ---
    @staticmethod
    async def list_group_blocks(property_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all conference, wedding, and event room blocks."""
        db = get_database()
        query: Dict[str, Any] = {}
        if property_id:
            query["property_id"] = str(property_id)

        cursor = db.group_blocks.find(query).sort("check_in_date", 1)
        blocks = await cursor.to_list(length=100)

        if not blocks and property_id:
            await CorporateService.seed_default_group_blocks(property_id)
            cursor = db.group_blocks.find(query).sort("check_in_date", 1)
            blocks = await cursor.to_list(length=100)

        return [group_block_helper(b) for b in blocks]

    @staticmethod
    async def get_group_block(block_id: str) -> Dict[str, Any]:
        """Fetch group block details."""
        db = get_database()
        query = {"_id": ObjectId(block_id)} if ObjectId.is_valid(block_id) else {"_id": block_id}
        gb = await db.group_blocks.find_one(query)
        if not gb:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group block not found")
        return group_block_helper(gb)

    @staticmethod
    async def create_group_block(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new room block with cutoff date and agreed group rate."""
        db = get_database()
        now = datetime.now(timezone.utc)
        doc = dict(payload)
        code = doc.get("group_code", "").upper().strip()
        doc["group_code"] = code

        # Fetch room type name
        rt_id = doc.get("room_type_id")
        rt_query = {"_id": ObjectId(rt_id)} if ObjectId.is_valid(rt_id) else {"_id": rt_id}
        rt = await db.room_types.find_one(rt_query)
        doc["room_type_name"] = rt.get("name", "Deluxe Room") if rt else "Standard Room"

        doc["status"] = doc.get("status", "DEFINITE") or "DEFINITE"
        doc["rooms_picked_up"] = 0
        doc["created_at"] = now
        doc["updated_at"] = now

        res = await db.group_blocks.insert_one(doc)
        doc["_id"] = res.inserted_id
        logger.info(f"Group block created: {doc['group_name']} ({code}) - {doc['total_rooms_blocked']} rooms")
        return group_block_helper(doc)

    @staticmethod
    async def release_unpicked_rooms(block_id: str) -> Dict[str, Any]:
        """Release remaining unbooked rooms in block back to general hotel inventory upon cutoff date."""
        db = get_database()
        query = {"_id": ObjectId(block_id)} if ObjectId.is_valid(block_id) else {"_id": block_id}
        gb = await db.group_blocks.find_one(query)
        if not gb:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group block not found")

        unpicked = gb["total_rooms_blocked"] - gb.get("rooms_picked_up", 0)
        now = datetime.now(timezone.utc)

        await db.group_blocks.update_one(
            query,
            {
                "$set": {
                    "status": "RELEASED",
                    "total_rooms_blocked": gb.get("rooms_picked_up", 0),  # collapse block to picked up rooms
                    "notes": (gb.get("notes") or "") + f" | Released {unpicked} unpicked room(s) on {now.strftime('%Y-%m-%d')}.",
                    "updated_at": now,
                }
            }
        )

        logger.info(f"Group block {gb.get('group_code')} released {unpicked} unbooked room(s) back to inventory.")
        return await CorporateService.get_group_block(block_id)

    @staticmethod
    async def record_pickup(group_code: str) -> bool:
        """Increment picked up room count when a guest books with the group code."""
        db = get_database()
        res = await db.group_blocks.update_one(
            {
                "group_code": group_code.upper().strip(),
                "$or": [
                    {"status": {"$in": ["DEFINITE", "TENTATIVE"]}},
                    {"status": {"$exists": False}},
                    {"status": None},
                ]
            },
            {"$inc": {"rooms_picked_up": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}}
        )
        return res.modified_count > 0

    # --- SAMPLE SEED DATA ---
    @staticmethod
    async def seed_default_accounts():
        """Seed initial corporate accounts for demo and testing."""
        db = get_database()
        now = datetime.now(timezone.utc)
        accounts = [
            {
                "company_name": "Google LLC",
                "corporate_code": "CORP-GOOG",
                "industry": "TECHNOLOGY",
                "contact_name": "Sarah Jenkins",
                "contact_email": "travel@google.com",
                "contact_phone": "+1 (650) 253-0000",
                "billing_address": "1600 Amphitheatre Pkwy, Mountain View, CA",
                "tax_identifier": "US-943034921",
                "contracted_discount_pct": 20.0,
                "payment_terms": "DIRECT_BILL",
                "credit_limit": 150000.0,
                "current_balance": 14250.0,
                "status": "ACTIVE",
                "created_at": now,
                "updated_at": now,
            },
            {
                "company_name": "Deloitte Consulting",
                "corporate_code": "CORP-DELOITTE",
                "industry": "PROFESSIONAL_SERVICES",
                "contact_name": "Marcus Vance",
                "contact_email": "globaltravel@deloitte.com",
                "contact_phone": "+91 40 6789 4000",
                "billing_address": "HITEC City Knowledge City, Hyderabad, Telangana",
                "tax_identifier": "36AAACD1234F1Z5",
                "contracted_discount_pct": 18.0,
                "payment_terms": "DIRECT_BILL",
                "credit_limit": 100000.0,
                "current_balance": 8600.0,
                "status": "ACTIVE",
                "created_at": now,
                "updated_at": now,
            },
            {
                "company_name": "Nexgile Technologies",
                "corporate_code": "CORP-NEXGILE",
                "industry": "HOSPITALITY_TECH",
                "contact_name": "Admin Desk",
                "contact_email": "hq@nexgile.com",
                "contact_phone": "+1 (415) 880-9200",
                "billing_address": "500 Howard St, San Francisco, CA",
                "tax_identifier": "US-472019482",
                "contracted_discount_pct": 25.0,
                "payment_terms": "DIRECT_BILL",
                "credit_limit": 200000.0,
                "current_balance": 0.0,
                "status": "ACTIVE",
                "created_at": now,
                "updated_at": now,
            }
        ]
        await db.corporate_accounts.insert_many(accounts)

    @staticmethod
    async def seed_default_group_blocks(property_id: str):
        """Seed sample conference and executive retreat group room blocks."""
        db = get_database()
        now = datetime.now(timezone.utc)

        # Get room type
        rt = await db.room_types.find_one({"property_id": ObjectId(property_id) if ObjectId.is_valid(property_id) else property_id})
        rt_id = str(rt["_id"]) if rt else ""
        rt_name = rt.get("name", "Executive Deluxe Suite") if rt else "Deluxe Suite"

        blocks = [
            {
                "property_id": str(property_id),
                "corporate_account_id": None,
                "group_name": "Global Hospitality & AI Leadership Summit 2026",
                "group_code": "GRP-AI-SUMMIT",
                "check_in_date": "2026-11-28",
                "check_out_date": "2026-12-02",
                "cutoff_date": "2026-11-25",
                "room_type_id": rt_id,
                "room_type_name": rt_name,
                "total_rooms_blocked": 20,
                "rooms_picked_up": 14,
                "agreed_rate": 185.0,
                "coordinator_name": "Eleanor Sterling",
                "coordinator_email": "events@leadershipsummit.org",
                "status": "DEFINITE",
                "notes": "Includes complimentary breakfast vouchers and ballroom keynotes.",
                "created_at": now,
                "updated_at": now,
            },
            {
                "property_id": str(property_id),
                "corporate_account_id": None,
                "group_name": "Deloitte Partners Annual Retreat",
                "group_code": "GRP-DELOITTE-26",
                "check_in_date": "2026-12-10",
                "check_out_date": "2026-12-14",
                "cutoff_date": "2026-12-01",
                "room_type_id": rt_id,
                "room_type_name": rt_name,
                "total_rooms_blocked": 15,
                "rooms_picked_up": 5,
                "agreed_rate": 210.0,
                "coordinator_name": "Marcus Vance",
                "coordinator_email": "globaltravel@deloitte.com",
                "status": "DEFINITE",
                "notes": "Direct bill master folio configured.",
                "created_at": now,
                "updated_at": now,
            }
        ]
        await db.group_blocks.insert_many(blocks)
