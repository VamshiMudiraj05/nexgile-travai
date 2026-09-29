from datetime import datetime
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.mongodb import get_database
from app.core.logging import logger
from app.services.loyalty_service import LoyaltyService
from fastapi import HTTPException, status


class TravelerProfileService:
    @staticmethod
    async def get_traveler_profile(user_id: str) -> Dict[str, Any]:
        """Retrieve traveler profile, custom preferences, past trip stats, and loyalty tier."""
        db = get_database()
        
        user = await db.users.find_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Fetch or create traveler preferences document
        profile_doc = await db.traveler_profiles.find_one({"user_id": str(user_id)})
        if not profile_doc:
            default_preferences = {
                "favorite_destinations": ["Goa", "Udaipur", "Jaipur", "Kerala", "Mumbai"],
                "preferred_room_type": "Deluxe Ocean Suite",
                "budget_range": "LUXURY",
                "preferred_amenities": ["WiFi", "Swimming Pool", "Spa & Wellness", "Ocean View", "Complimentary Breakfast"],
                "dietary_preferences": "Vegetarian / Gourmet",
                "special_interests": ["Beachfront Relaxation", "Fine Dining", "Heritage Retreats"]
            }
            profile_doc = {
                "user_id": str(user_id),
                "preferences": default_preferences,
                "phone": user.get("phone", "+91 98765 43210"),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            await db.traveler_profiles.insert_one(profile_doc)

        # Loyalty stats
        loyalty = await LoyaltyService.get_or_create_loyalty_account(str(user_id))

        # Booking stats
        total_trips = await db.reservations.count_documents({
            "$or": [
                {"user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else None},
                {"user_id": str(user_id)}
            ]
        })
        upcoming_trips = await db.reservations.count_documents({
            "$or": [
                {"user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else None},
                {"user_id": str(user_id)}
            ],
            "status": "CONFIRMED"
        })

        return {
            "user_id": str(user_id),
            "name": user.get("name", "Traveler"),
            "email": user.get("email", ""),
            "phone": profile_doc.get("phone", user.get("phone", "+91 98765 43210")),
            "role": user.get("role", "TRAVELER"),
            "preferences": profile_doc.get("preferences", {}),
            "total_trips": total_trips,
            "upcoming_trips": upcoming_trips,
            "loyalty_tier": loyalty["tier"],
            "loyalty_points": loyalty["points"]
        }

    @staticmethod
    async def update_traveler_profile(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update traveler preferences and contact info."""
        db = get_database()
        
        now_iso = datetime.utcnow().isoformat()
        update_fields: Dict[str, Any] = {"updated_at": now_iso}

        if "name" in data and data["name"]:
            await db.users.update_one(
                {"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id},
                {"$set": {"name": data["name"], "updated_at": now_iso}}
            )

        if "phone" in data:
            update_fields["phone"] = data["phone"]
        if "preferences" in data and data["preferences"]:
            update_fields["preferences"] = data["preferences"]

        await db.traveler_profiles.update_one(
            {"user_id": str(user_id)},
            {"$set": update_fields},
            upsert=True
        )

        return await TravelerProfileService.get_traveler_profile(user_id)

    @staticmethod
    async def get_personalized_recommendations(user_id: str) -> List[Dict[str, Any]]:
        """Inference wrapper: match traveler preferences against property catalog."""
        db = get_database()
        
        profile = await TravelerProfileService.get_traveler_profile(user_id)
        prefs = profile.get("preferences", {})
        fav_destinations = [d.lower() for d in prefs.get("favorite_destinations", [])]
        preferred_amenities = [a.lower() for a in prefs.get("preferred_amenities", [])]
        budget_range = prefs.get("budget_range", "MODERATE")

        # Fetch active properties from MongoDB
        properties = await db.properties.find({"status": "ACTIVE"}).to_list(length=20)
        
        recommendations = []
        for prop in properties:
            prop_id = prop["_id"]
            city = prop.get("city", "").lower()
            prop_amenities = [a.lower() for a in prop.get("amenities", [])]
            
            # Compute match scoring
            match_score = 0.70  # Baseline
            match_reasons = []

            # Destination matching
            if any(fav in city or city in fav for fav in fav_destinations):
                match_score += 0.15
                match_reasons.append(f"Matches your favorite destination ({prop.get('city')})")

            # Amenity matching
            overlap_amenities = [a for a in preferred_amenities if any(pa in a or a in pa for pa in prop_amenities)]
            if overlap_amenities:
                match_score += 0.10
                match_reasons.append(f"Features your preferred amenities ({', '.join(prop.get('amenities', [])[:3])})")

            # Star rating
            if float(prop.get("star_rating", 4.0)) >= 4.5:
                match_score += 0.05
                match_reasons.append("Top-rated 5-star luxury property")

            # Room type matching
            room_type = await db.room_types.find_one({"property_id": prop_id, "is_active": True})
            rt_name = room_type.get("name", "Executive Suite") if room_type else "Deluxe Suite"
            starting_price = float(room_type.get("base_rate", 250.0)) if room_type else 200.0

            if not match_reasons:
                match_reasons.append("Curated popular destination for your tier")

            from app.services.marketplace_service import MarketplaceService
            photos = MarketplaceService._extract_photos(prop, is_room=False)

            recommendations.append({
                "property_id": str(prop["_id"]),
                "property_name": prop.get("name", "Resort"),
                "city": prop.get("city", ""),
                "star_rating": float(prop.get("star_rating", 4.8)),
                "starting_price": starting_price,
                "match_score": min(round(match_score, 2), 0.99),
                "match_reasons": match_reasons,
                "photos": photos,
                "recommended_room_type": rt_name
            })

        # Sort recommendations by highest match score
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations
