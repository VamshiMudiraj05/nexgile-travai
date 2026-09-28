from typing import Optional
from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.schemas.dashboard import DashboardSummary
from app.schemas.user import UserResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummary,
    summary="Get real-time dynamic PMS dashboard analytics and daily summary"
)
async def get_dashboard_summary(
    property_id: Optional[str] = Query(None, description="Optional property ID filter"),
    current_user: UserResponse = Depends(get_current_user)
):
    return await dashboard_service.get_summary(property_id=property_id)
