from typing import Dict, List
from pydantic import BaseModel
from app.schemas.reservation import ReservationResponse


class DashboardSummary(BaseModel):
    total_properties: int = 0
    total_rooms: int = 0
    available_rooms: int = 0
    occupied_rooms: int = 0
    reserved_rooms: int = 0
    cleaning_rooms: int = 0
    maintenance_rooms: int = 0
    out_of_order_rooms: int = 0
    occupancy_rate: float = 0.0
    todays_arrivals_count: int = 0
    todays_departures_count: int = 0
    active_reservations: int = 0
    total_guests: int = 0
    room_status_counts: Dict[str, int] = {}
    todays_arrivals: List[ReservationResponse] = []
    todays_departures: List[ReservationResponse] = []
    recent_reservations: List[ReservationResponse] = []
