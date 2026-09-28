from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MarketplaceRoomTypeItem(BaseModel):
    id: str
    property_id: str
    name: str
    code: str
    description: Optional[str] = None
    base_rate: float
    max_occupancy: int
    bed_type: Optional[str] = "King Bed"
    amenities: List[str] = []
    photos: List[str] = []
    available_rooms_count: int
    total_stay_price: float


class MarketplacePropertyItem(BaseModel):
    id: str
    property_code: str
    name: str
    property_type: str
    star_rating: float
    city: str
    state: str
    country: str
    address_line_1: str
    description: Optional[str] = None
    amenities: List[str] = []
    photos: List[str] = []
    starting_price: float
    available_room_types_count: int
    room_types: List[MarketplaceRoomTypeItem] = []


class MarketplaceSearchResponse(BaseModel):
    properties: List[MarketplacePropertyItem]
    total_found: int
    check_in: str
    check_out: str
    nights: int
    adults: int
    children: int
    rooms: int


class TravelerBookingCreateRequest(BaseModel):
    property_id: str
    room_type_id: str
    room_id: Optional[str] = None
    check_in_date: str  # YYYY-MM-DD
    check_out_date: str  # YYYY-MM-DD
    adults: int = Field(default=1, ge=1)
    children: int = Field(default=0, ge=0)
    guest_first_name: str
    guest_last_name: str
    guest_email: str
    guest_phone: str
    special_requests: Optional[str] = None
    payment_method: Optional[str] = "DEMO_CREDIT_CARD"


class TravelerBookingResponse(BaseModel):
    reservation_id: str
    booking_reference: str
    property_id: str
    property_name: str
    property_city: str
    room_id: str
    room_number: str
    room_type_name: str
    check_in_date: str
    check_out_date: str
    nights: int
    adults: int
    children: int
    guest_name: str
    guest_email: str
    total_amount: float
    status: str
    payment_status: str
    created_at: str
    special_requests: Optional[str] = None
