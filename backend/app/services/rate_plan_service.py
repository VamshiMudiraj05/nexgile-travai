from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.rate_plan import rate_plan_helper
from app.core.logging import logger


class RatePlanService:
    @staticmethod
    async def list_rate_plans(
        property_id: Optional[str] = None,
        room_type_id: Optional[str] = None,
        active_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """Retrieve rate plans with optional property and room type filtering."""
        db = get_database()
        query: Dict[str, Any] = {}
        if property_id:
            query["property_id"] = str(property_id)
        if room_type_id:
            query["$or"] = [
                {"room_type_id": str(room_type_id)},
                {"room_type_id": ""},
                {"room_type_id": None},
            ]
        if active_only:
            query["is_active"] = True

        cursor = db.rate_plans.find(query).sort([("is_default", -1), ("rate_multiplier", 1)])
        rate_plans = await cursor.to_list(length=100)

        # If property has no rate plans yet, auto-seed the standard industry plans
        if not rate_plans and property_id:
            await RatePlanService.seed_default_rate_plans(property_id)
            cursor = db.rate_plans.find(query).sort([("is_default", -1), ("rate_multiplier", 1)])
            rate_plans = await cursor.to_list(length=100)

        return [rate_plan_helper(rp) for rp in rate_plans]

    @staticmethod
    async def get_rate_plan(rate_plan_id: str) -> Dict[str, Any]:
        """Fetch a single rate plan by ID."""
        db = get_database()
        query = {"_id": ObjectId(rate_plan_id)} if ObjectId.is_valid(rate_plan_id) else {"_id": rate_plan_id}
        rp = await db.rate_plans.find_one(query)
        if not rp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rate plan with ID '{rate_plan_id}' not found."
            )
        return rate_plan_helper(rp)

    @staticmethod
    async def create_rate_plan(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new rate plan or package with stay restrictions."""
        db = get_database()
        now = datetime.now(timezone.utc)
        doc = dict(payload)
        doc["created_at"] = now
        doc["updated_at"] = now

        # If marked as default, unset other defaults for this property
        if doc.get("is_default"):
            await db.rate_plans.update_many(
                {"property_id": str(doc.get("property_id"))},
                {"$set": {"is_default": False}}
            )

        res = await db.rate_plans.insert_one(doc)
        doc["_id"] = res.inserted_id
        logger.info(f"Rate plan created: {doc.get('code')} ({doc.get('name')}) for property {doc.get('property_id')}")
        return rate_plan_helper(doc)

    @staticmethod
    async def update_rate_plan(rate_plan_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing rate plan's pricing rules or stay restrictions."""
        db = get_database()
        query = {"_id": ObjectId(rate_plan_id)} if ObjectId.is_valid(rate_plan_id) else {"_id": rate_plan_id}

        existing = await db.rate_plans.find_one(query)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rate plan not found")

        update_dict = {k: v for k, v in payload.items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)

        if update_dict.get("is_default"):
            await db.rate_plans.update_many(
                {"property_id": str(existing.get("property_id"))},
                {"$set": {"is_default": False}}
            )

        await db.rate_plans.update_one(query, {"$set": update_dict})
        return await RatePlanService.get_rate_plan(rate_plan_id)

    @staticmethod
    async def delete_rate_plan(rate_plan_id: str) -> bool:
        """Soft-delete or remove a rate plan."""
        db = get_database()
        query = {"_id": ObjectId(rate_plan_id)} if ObjectId.is_valid(rate_plan_id) else {"_id": rate_plan_id}
        res = await db.rate_plans.delete_one(query)
        return res.deleted_count > 0

    @staticmethod
    async def validate_stay_and_calculate(
        rate_plan_id: str,
        check_in_str: str,
        check_out_str: str,
        base_nightly_rate: float,
    ) -> Dict[str, Any]:
        """Validate stay dates against rate plan restrictions (MinLOS, MaxLOS, CTA, CTD, Advance Booking)."""
        rp = await RatePlanService.get_rate_plan(rate_plan_id)
        violations = []

        try:
            d_in = datetime.strptime(check_in_str, "%Y-%m-%d").date()
            d_out = datetime.strptime(check_out_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Expected YYYY-MM-DD")

        nights = (d_out - d_in).days
        if nights <= 0:
            violations.append("Check-out date must be after check-in date.")

        restr = rp.get("restrictions", {})
        min_los = restr.get("min_los", 1)
        max_los = restr.get("max_los", 30)
        cta = restr.get("closed_to_arrival", False)
        ctd = restr.get("closed_to_departure", False)
        min_adv = restr.get("min_advance_days", 0)
        max_adv = restr.get("max_advance_days", 365)

        # 1. Minimum Length of Stay (MinLOS)
        if nights < min_los:
            violations.append(f"Minimum length of stay for '{rp['name']}' is {min_los} night(s). (Requested: {nights} night(s)).")

        # 2. Maximum Length of Stay (MaxLOS)
        if nights > max_los:
            violations.append(f"Maximum allowable stay for '{rp['name']}' is {max_los} night(s).")

        # 3. Closed to Arrival (CTA)
        if cta:
            violations.append(f"Check-in on {check_in_str} is restricted (Closed to Arrival - CTA).")

        # 4. Closed to Departure (CTD)
        if ctd:
            violations.append(f"Check-out on {check_out_str} is restricted (Closed to Departure - CTD).")

        # 5. Advance booking days
        today = date.today()
        days_in_advance = (d_in - today).days
        if days_in_advance < min_adv:
            violations.append(f"This promotional rate requires booking at least {min_adv} day(s) in advance.")
        if days_in_advance > max_adv:
            violations.append(f"This rate cannot be booked more than {max_adv} day(s) in advance.")

        # Rate calculations
        multiplier = float(rp.get("rate_multiplier", 1.0))
        fixed_adj = float(rp.get("fixed_adjustment", 0.0))
        calc_nightly = round((base_nightly_rate * multiplier) + fixed_adj, 2)
        total_estimated = round(calc_nightly * max(nights, 1), 2)

        inclusions_value = sum(float(inc.get("value", 0.0)) for inc in rp.get("inclusions", [])) * max(nights, 1)

        return {
            "is_valid": len(violations) == 0,
            "violations": violations,
            "nights": nights,
            "calculated_nightly_rate": calc_nightly,
            "total_estimated_amount": total_estimated,
            "inclusions_value": inclusions_value,
            "cancellation_policy": rp.get("cancellation_policy", "FLEXIBLE_24H"),
        }

    @staticmethod
    async def seed_default_rate_plans(property_id: str):
        """Automatically seed standard rate plans for a property."""
        db = get_database()
        now = datetime.now(timezone.utc)

        defaults = [
            {
                "property_id": str(property_id),
                "room_type_id": "",
                "code": "BAR",
                "name": "Best Available Rate (BAR)",
                "description": "Flexible daily rate with complimentary high-speed Wi-Fi and cancel up to 24h before arrival.",
                "rate_multiplier": 1.0,
                "fixed_adjustment": 0.0,
                "meal_plan": "ROOM_ONLY",
                "cancellation_policy": "FLEXIBLE_24H",
                "is_active": True,
                "is_default": True,
                "inclusions": [
                    {"name": "Complimentary Premium Wi-Fi", "description": "High-speed estate Wi-Fi access", "value": 15.0},
                    {"name": "Resort Wellness Access", "description": "Full access to pool, sauna, and fitness pavilion", "value": 25.0}
                ],
                "restrictions": {
                    "min_los": 1,
                    "max_los": 30,
                    "closed_to_arrival": False,
                    "closed_to_departure": False,
                    "min_advance_days": 0,
                    "max_advance_days": 365,
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "property_id": str(property_id),
                "room_type_id": "",
                "code": "BB_PKG",
                "name": "Bed & Breakfast Experience",
                "description": "Indulgent breakfast buffet for two served daily in our estate dining room.",
                "rate_multiplier": 1.12,
                "fixed_adjustment": 0.0,
                "meal_plan": "BED_AND_BREAKFAST",
                "cancellation_policy": "FLEXIBLE_48H",
                "is_active": True,
                "is_default": False,
                "inclusions": [
                    {"name": "Daily Artisan Breakfast for 2", "description": "Buffet & hot table delicacies", "value": 50.0},
                    {"name": "Espresso & Mimosa Pairing", "description": "Morning beverage selections", "value": 20.0}
                ],
                "restrictions": {
                    "min_los": 1,
                    "max_los": 30,
                    "closed_to_arrival": False,
                    "closed_to_departure": False,
                    "min_advance_days": 0,
                    "max_advance_days": 365,
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "property_id": str(property_id),
                "room_type_id": "",
                "code": "NON_REF",
                "name": "Advance Saver (15% Off)",
                "description": "Non-refundable advance purchase rate providing exceptional savings for committed travelers.",
                "rate_multiplier": 0.85,
                "fixed_adjustment": 0.0,
                "meal_plan": "ROOM_ONLY",
                "cancellation_policy": "NON_REFUNDABLE",
                "is_active": True,
                "is_default": False,
                "inclusions": [],
                "restrictions": {
                    "min_los": 2,
                    "max_los": 14,
                    "closed_to_arrival": False,
                    "closed_to_departure": False,
                    "min_advance_days": 3,
                    "max_advance_days": 180,
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "property_id": str(property_id),
                "room_type_id": "",
                "code": "EXT_STAY",
                "name": "Extended Stay Sanctuary (5+ Nights)",
                "description": "Exclusive rate for stays of 5 nights or more with complimentary airport transfer.",
                "rate_multiplier": 0.80,
                "fixed_adjustment": 0.0,
                "meal_plan": "ROOM_ONLY",
                "cancellation_policy": "MODERATE_7D",
                "is_active": True,
                "is_default": False,
                "inclusions": [
                    {"name": "Chauffeur Airport Transfer", "description": "Roundtrip private luxury car transfer", "value": 120.0},
                    {"name": "Weekly Laundry Credit", "description": "Complimentary valet laundry pressing", "value": 40.0}
                ],
                "restrictions": {
                    "min_los": 5,
                    "max_los": 60,
                    "closed_to_arrival": False,
                    "closed_to_departure": False,
                    "min_advance_days": 1,
                    "max_advance_days": 365,
                },
                "created_at": now,
                "updated_at": now,
            }
        ]

        await db.rate_plans.insert_many(defaults)
        logger.info(f"Seeded 4 standard rate plans for property {property_id}")
