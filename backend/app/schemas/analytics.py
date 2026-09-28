from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DashboardOverviewResponse(BaseModel):
    # High-level KPIs
    total_properties: int
    total_rooms: int
    occupancy_rate: float
    today_checkins: int
    today_checkouts: int
    active_reservations: int
    total_revenue: float
    adr: float  # Average Daily Rate
    revpar: float  # Revenue per available room

    # Operational Cards
    rooms_to_clean: int
    open_maintenance: int
    pending_service_requests: int

    # Charts
    revenue_chart: List[Dict[str, Any]]
    occupancy_chart: List[Dict[str, Any]]
    booking_trend_chart: List[Dict[str, Any]]

    # Recent lists
    recent_reservations: List[Dict[str, Any]]
    today_arrivals: List[Dict[str, Any]]
    today_departures: List[Dict[str, Any]]


class RevenueAnalyticsResponse(BaseModel):
    total_revenue: float
    adr: float
    revpar: float
    occupancy_percentage: float
    rooms_sold: int
    total_room_nights_available: int
    revenue_by_property: List[Dict[str, Any]]
    revenue_by_room_type: List[Dict[str, Any]]
    revenue_by_date: List[Dict[str, Any]]


class OccupancyAnalyticsResponse(BaseModel):
    summary: Dict[str, float]  # current, average, peak, lowest
    trend: List[Dict[str, Any]]  # [{date: "2026-09-01", occupancy: 72}]


class BookingAnalyticsResponse(BaseModel):
    total_bookings: int
    confirmed: int
    cancelled: int
    checked_in: int
    checked_out: int
    no_show: int
    cancellation_rate: float
    average_length_of_stay: float
    bookings_by_source: List[Dict[str, Any]]
    trend: List[Dict[str, Any]]


class ForecastItem(BaseModel):
    date: str
    occupancy: float
    revenue: float
    bookings: int


class ForecastAnalyticsResponse(BaseModel):
    horizon_days: int
    forecast: List[ForecastItem]
    disclaimer: str = "Statistical projection based on historical velocity and active forward bookings. Not a financial guarantee."
