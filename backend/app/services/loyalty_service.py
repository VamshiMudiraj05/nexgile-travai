from datetime import datetime
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.mongodb import get_database
from app.core.logging import logger
from fastapi import HTTPException, status


class LoyaltyService:
    @staticmethod
    def _compute_tier(lifetime_points: int) -> Dict[str, Any]:
        """Determine tier and points required for next level."""
        if lifetime_points >= 7500:
            return {"tier": "PLATINUM", "points_to_next": 0, "next_tier": None}
        elif lifetime_points >= 3000:
            return {"tier": "GOLD", "points_to_next": 7500 - lifetime_points, "next_tier": "PLATINUM"}
        elif lifetime_points >= 1000:
            return {"tier": "SILVER", "points_to_next": 3000 - lifetime_points, "next_tier": "GOLD"}
        else:
            return {"tier": "STANDARD", "points_to_next": 1000 - lifetime_points, "next_tier": "SILVER"}

    @staticmethod
    async def get_or_create_loyalty_account(user_id: str) -> Dict[str, Any]:
        """Fetch existing loyalty account or create default account."""
        db = get_database()
        
        account = await db.loyalty_accounts.find_one({"user_id": str(user_id)})
        if not account:
            # Seed default welcome bonus
            initial_points = 250
            initial_lifetime = 250
            tier_info = LoyaltyService._compute_tier(initial_lifetime)
            
            doc = {
                "user_id": str(user_id),
                "points": initial_points,
                "lifetime_points": initial_lifetime,
                "tier": tier_info["tier"],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            res = await db.loyalty_accounts.insert_one(doc)
            doc["_id"] = res.inserted_id
            
            # Initial welcome transaction
            await db.loyalty_transactions.insert_one({
                "user_id": str(user_id),
                "type": "EARNED",
                "points": initial_points,
                "reference": "WELCOME-BONUS",
                "description": "Nexgile-TravAI Member Welcome Reward",
                "created_at": datetime.utcnow().isoformat()
            })
            account = doc

        points = int(account.get("points", 0))
        lifetime = int(account.get("lifetime_points", points))
        tier_info = LoyaltyService._compute_tier(lifetime)

        return {
            "user_id": str(user_id),
            "points": points,
            "lifetime_points": lifetime,
            "tier": tier_info["tier"],
            "points_to_next_tier": tier_info["points_to_next"],
            "next_tier": tier_info["next_tier"]
        }

    @staticmethod
    async def award_points_for_booking(user_id: str, booking_reference: str, total_amount: float) -> int:
        """Award loyalty points for completed reservation (1 pt per ₹100 or $1 spent)."""
        db = get_database()
        points_earned = max(int(total_amount / 10), 10)  # Generous point award
        now_iso = datetime.utcnow().isoformat()

        account = await db.loyalty_accounts.find_one({"user_id": str(user_id)})
        if not account:
            await LoyaltyService.get_or_create_loyalty_account(user_id)
            account = await db.loyalty_accounts.find_one({"user_id": str(user_id)})

        new_points = int(account.get("points", 0)) + points_earned
        new_lifetime = int(account.get("lifetime_points", 0)) + points_earned
        tier_info = LoyaltyService._compute_tier(new_lifetime)

        await db.loyalty_accounts.update_one(
            {"user_id": str(user_id)},
            {"$set": {
                "points": new_points,
                "lifetime_points": new_lifetime,
                "tier": tier_info["tier"],
                "updated_at": now_iso
            }}
        )

        await db.loyalty_transactions.insert_one({
            "user_id": str(user_id),
            "type": "EARNED",
            "points": points_earned,
            "reference": booking_reference,
            "description": f"Points earned for stay {booking_reference}",
            "created_at": now_iso
        })

        logger.info(f"Awarded {points_earned} loyalty points to user {user_id} for booking {booking_reference}")
        return points_earned

    @staticmethod
    async def get_transactions(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch traveler loyalty activity history."""
        db = get_database()
        cursor = db.loyalty_transactions.find({"user_id": str(user_id)}).sort("created_at", -1).limit(limit)
        txs = await cursor.to_list(length=limit)
        
        return [{
            "id": str(tx["_id"]),
            "user_id": str(tx["user_id"]),
            "type": tx.get("type", "EARNED"),
            "points": int(tx.get("points", 0)),
            "reference": tx.get("reference", ""),
            "description": tx.get("description", "Reward point activity"),
            "created_at": tx.get("created_at", datetime.utcnow().isoformat())
        } for tx in txs]

    @staticmethod
    async def redeem_points(user_id: str, points: int, reward_name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Redeem points for member benefits."""
        db = get_database()
        account = await db.loyalty_accounts.find_one({"user_id": str(user_id)})
        if not account or int(account.get("points", 0)) < points:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient points balance. You have {account.get('points', 0) if account else 0} points, but {points} are required."
            )

        new_points = int(account.get("points", 0)) - points
        now_iso = datetime.utcnow().isoformat()

        await db.loyalty_accounts.update_one(
            {"user_id": str(user_id)},
            {"$set": {"points": new_points, "updated_at": now_iso}}
        )

        await db.loyalty_transactions.insert_one({
            "user_id": str(user_id),
            "type": "REDEEMED",
            "points": -points,
            "reference": f"RED-{reward_name.upper().replace(' ', '-')[:12]}",
            "description": description or f"Redeemed for {reward_name}",
            "created_at": now_iso
        })

        return {
            "success": True,
            "redeemed_points": points,
            "remaining_points": new_points,
            "reward_name": reward_name,
            "message": f"Successfully redeemed {points} points for {reward_name}!"
        }
