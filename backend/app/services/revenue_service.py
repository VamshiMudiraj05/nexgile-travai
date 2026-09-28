from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.mongodb import get_database
from app.core.logging import logger
from fastapi import HTTPException, status


class RevenueService:
    @staticmethod
    async def get_rate_recommendations(property_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Generate demand, pace, and inventory-driven AI rate recommendations."""
        db = get_database()
        
        rt_filter: Dict[str, Any] = {}
        if property_id and ObjectId.is_valid(property_id):
            rt_filter["property_id"] = ObjectId(property_id)
            
        room_types = await db.room_types.find(rt_filter).to_list(length=100)
        
        recommendations = []
        today = date.today()
        next_week = today + timedelta(days=7)
        today_str = today.isoformat()
        next_week_str = next_week.isoformat()
        day_of_week = today.weekday()

        for rt in room_types:
            rt_id = rt["_id"]
            prop_id = rt.get("property_id")
            
            # Fetch property name
            prop_name = "Grand Resort"
            if prop_id:
                prop = await db.properties.find_one({"_id": prop_id})
                if prop:
                    prop_name = prop.get("name", "Grand Resort")

            current_rate = float(rt.get("base_rate", 200.0))
            
            # Count total rooms for this room type
            total_rooms_rt = await db.rooms.count_documents({"room_type_id": rt_id})
            if total_rooms_rt == 0:
                total_rooms_rt = 1

            # Count currently occupied rooms for this room type
            occupied_rt = await db.rooms.count_documents({"room_type_id": rt_id, "status": "OCCUPIED"})
            current_occ = (occupied_rt / total_rooms_rt) * 100.0

            # Count future bookings for next 7 days
            future_bookings = await db.reservations.count_documents({
                "room_type_id": rt_id,
                "check_in_date": {"$gte": today_str, "$lte": next_week_str},
                "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
            })
            future_occ = min(((occupied_rt + future_bookings) / (total_rooms_rt * 7)) * 100.0, 100.0)

            # Heuristic decision tree for dynamic pricing
            change_pct = 0.0
            reason = "Standard baseline demand."
            confidence = 0.80

            if current_occ >= 75.0 or future_occ >= 60.0:
                change_pct = 12.0
                reason = "High room occupancy and strong 7-day forward booking pace."
                confidence = 0.88
            elif current_occ >= 50.0 and day_of_week in [4, 5]:  # Friday/Saturday
                change_pct = 8.0
                reason = "Elevated weekend leisure demand and moderate inventory remaining."
                confidence = 0.84
            elif current_occ <= 20.0 and future_bookings <= 1:
                change_pct = -6.0
                reason = "Low occupancy velocity. Recommend competitive discount to stimulate demand."
                confidence = 0.79
            elif current_occ < 40.0:
                change_pct = 3.0
                reason = "Steady weekday absorption rate; minor yield optimization."
                confidence = 0.75
            else:
                change_pct = 5.0
                reason = "Balanced market demand and steady booking pace."
                confidence = 0.82

            recommended_rate = round(current_rate * (1.0 + (change_pct / 100.0)), 2)

            recommendations.append({
                "room_type_id": str(rt_id),
                "room_type_name": rt.get("name", "Standard Room"),
                "property_id": str(prop_id) if prop_id else "",
                "property_name": prop_name,
                "current_rate": current_rate,
                "recommended_rate": recommended_rate,
                "change_percentage": change_pct,
                "reason": reason,
                "confidence": confidence,
                "current_occupancy": round(current_occ, 1),
                "future_occupancy": round(future_occ, 1)
            })

        return recommendations

    @staticmethod
    async def apply_rate_recommendation(
        room_type_id: str,
        recommended_rate: float,
        reason: Optional[str],
        user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply recommended rate to room type and log audit record."""
        db = get_database()
        if not ObjectId.is_valid(room_type_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room type ID")

        rt = await db.room_types.find_one({"_id": ObjectId(room_type_id)})
        if not rt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

        previous_rate = float(rt.get("base_rate", 0.0))
        now_iso = datetime.utcnow().isoformat()

        # Update room type base_rate
        await db.room_types.update_one(
            {"_id": ObjectId(room_type_id)},
            {"$set": {"base_rate": recommended_rate, "updated_at": now_iso}}
        )

        # Record recommendation audit trail
        history_doc = {
            "room_type_id": ObjectId(room_type_id),
            "property_id": rt.get("property_id"),
            "previous_rate": previous_rate,
            "new_rate": recommended_rate,
            "applied_by": str(user.get("_id", "admin")),
            "applied_by_name": user.get("name", "Administrator"),
            "reason": reason or "AI dynamic rate recommendation applied",
            "applied_at": now_iso
        }
        await db.rate_recommendation_history.insert_one(history_doc)

        logger.info(f"Updated rate for room type '{rt.get('name')}' from {previous_rate} to {recommended_rate} by {user.get('email')}")

        return {
            "success": True,
            "room_type_id": room_type_id,
            "previous_rate": previous_rate,
            "new_rate": recommended_rate,
            "applied_by": user.get("name", "Administrator"),
            "applied_at": now_iso,
            "message": f"Successfully updated rate to ₹{recommended_rate:,.2f}"
        }
