from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import get_current_user, require_role
from app.schemas.user import UserRole
from app.schemas.analytics import (
    DashboardOverviewResponse,
    RevenueAnalyticsResponse,
    OccupancyAnalyticsResponse,
    BookingAnalyticsResponse,
    ForecastAnalyticsResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["Analytics & Business Intelligence"])

STAFF_ROLES = [
    UserRole.ADMIN,
    UserRole.REVENUE_MANAGER,
    UserRole.FRONT_DESK,
    UserRole.FINANCE,
    UserRole.HOUSEKEEPING,
    UserRole.MAINTENANCE,
]


@router.get(
    "/dashboard/overview",
    response_model=DashboardOverviewResponse,
    summary="Get unified BI & PMS dashboard overview",
)
async def get_dashboard_overview(
    current_user: dict = Depends(require_role(STAFF_ROLES)),
):
    """Retrieve high-level KPIs, operational cards, time-series charts, and recent arrivals/departures."""
    return await AnalyticsService.get_dashboard_overview()


@router.get(
    "/analytics/revenue",
    response_model=RevenueAnalyticsResponse,
    summary="Get Revenue Analytics (ADR, RevPAR, Occupancy, Property Breakdown)",
)
async def get_revenue_analytics(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    room_type_id: Optional[str] = Query(None, description="Filter by room type ID"),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER, UserRole.FINANCE])),
):
    """Calculate ADR, RevPAR, Revenue by Property, Room Type, and Date."""
    return await AnalyticsService.get_revenue_analytics(
        property_id=property_id,
        start_date=start_date,
        end_date=end_date,
        room_type_id=room_type_id,
    )


@router.get(
    "/analytics/occupancy",
    response_model=OccupancyAnalyticsResponse,
    summary="Get Occupancy Analytics and Trend",
)
async def get_occupancy_analytics(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER, UserRole.FRONT_DESK])),
):
    """Compute current, average, peak, and lowest occupancy rates + trend."""
    return await AnalyticsService.get_occupancy_analytics(
        property_id=property_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/analytics/bookings",
    response_model=BookingAnalyticsResponse,
    summary="Get Booking Analytics and Channel Distribution",
)
async def get_booking_analytics(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(require_role(STAFF_ROLES)),
):
    """Compute booking status breakdown, source channels, length of stay, and cancellation rate."""
    return await AnalyticsService.get_booking_analytics(
        property_id=property_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/analytics/forecast",
    response_model=ForecastAnalyticsResponse,
    summary="Get 7-Day or 30-Day Statistical Forecast",
)
async def get_forecast(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    horizon: int = Query(7, description="Forecast horizon in days (7 to 30)"),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Compute statistical projection for occupancy, revenue, and bookings."""
    return await AnalyticsService.get_forecast(
        property_id=property_id,
        horizon_days=horizon,
    )
