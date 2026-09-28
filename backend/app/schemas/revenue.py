from typing import List, Optional
from pydantic import BaseModel, Field


class RateRecommendationItem(BaseModel):
    room_type_id: str
    room_type_name: str
    property_id: str
    property_name: str
    current_rate: float
    recommended_rate: float
    change_percentage: float
    reason: str
    confidence: float
    current_occupancy: float
    future_occupancy: float


class RateRecommendationResponse(BaseModel):
    recommendations: List[RateRecommendationItem]


class ApplyRateRecommendationRequest(BaseModel):
    room_type_id: str
    recommended_rate: float
    reason: Optional[str] = None


class ApplyRateRecommendationResponse(BaseModel):
    success: bool
    room_type_id: str
    previous_rate: float
    new_rate: float
    applied_by: str
    applied_at: str
    message: str
