from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import get_current_user, require_role
from app.schemas.user import UserRole
from app.schemas.revenue import (
    RateRecommendationResponse,
    RateRecommendationItem,
    ApplyRateRecommendationRequest,
    ApplyRateRecommendationResponse,
)
from app.services.revenue_service import RevenueService

router = APIRouter(prefix="/revenue", tags=["Revenue Management & AI Pricing"])


@router.get(
    "/recommendations",
    response_model=List[RateRecommendationItem],
    summary="Get AI Rate Recommendations for Room Types",
)
async def get_rate_recommendations(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Generate dynamic rate recommendations based on demand, pace, day of week, and inventory."""
    return await RevenueService.get_rate_recommendations(property_id=property_id)


@router.post(
    "/recommendations/apply",
    response_model=ApplyRateRecommendationResponse,
    summary="Apply an AI Rate Recommendation",
)
async def apply_rate_recommendation(
    payload: ApplyRateRecommendationRequest,
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Apply the recommended rate to the room type in MongoDB and log audit record."""
    return await RevenueService.apply_rate_recommendation(
        room_type_id=payload.room_type_id,
        recommended_rate=payload.recommended_rate,
        reason=payload.reason,
        user=current_user.model_dump() if hasattr(current_user, "model_dump") else current_user,
    )
