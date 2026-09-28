from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TravelerPreferences(BaseModel):
    favorite_destinations: List[str] = ["Goa", "Miami", "Paris", "Bali"]
    preferred_room_type: Optional[str] = "Deluxe Ocean Suite"
    budget_range: Optional[str] = "MODERATE"  # BUDGET, MODERATE, LUXURY, ULTRA_LUXURY
    preferred_amenities: List[str] = ["WiFi", "Pool", "Breakfast", "Spa"]
    dietary_preferences: Optional[str] = "None"
    special_interests: List[str] = ["Beach", "Wellness", "Fine Dining"]


class TravelerProfileResponse(BaseModel):
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    preferences: TravelerPreferences
    total_trips: int
    upcoming_trips: int
    loyalty_tier: str
    loyalty_points: int


class UpdateTravelerProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    preferences: Optional[TravelerPreferences] = None


class RecommendationItem(BaseModel):
    property_id: str
    property_name: str
    city: str
    star_rating: float
    starting_price: float
    match_score: float  # 0.0 - 1.0
    match_reasons: List[str]
    photos: List[str] = []
    recommended_room_type: Optional[str] = None


class TravelerRecommendationsResponse(BaseModel):
    recommendations: List[RecommendationItem]
    model_source: str = "Trained Traveler Preferences Engine"
