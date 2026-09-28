from enum import Enum
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, model_validator


class ReservationStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class ReservationSource(str, Enum):
    DIRECT = "DIRECT"
    WALK_IN = "WALK_IN"
    PHONE = "PHONE"
    WEBSITE = "WEBSITE"
    AGENCY = "AGENCY"
    OTA = "OTA"
    CORPORATE = "CORPORATE"


class ReservationBase(BaseModel):
    property_id: str
    guest_id: str
    room_type_id: str
    room_id: str
    check_in_date: date
    check_out_date: date
    number_of_adults: int = Field(default=1, ge=1)
    number_of_children: int = Field(default=0, ge=0)
    number_of_rooms: int = Field(default=1, ge=1)
    rate_per_night: float = Field(..., ge=0)
    number_of_nights: Optional[int] = None
    subtotal: Optional[float] = None
    taxes: Optional[float] = Field(default=0.0, ge=0)
    discounts: Optional[float] = Field(default=0.0, ge=0)
    total_amount: Optional[float] = None
    special_requests: Optional[str] = None
    source: ReservationSource = ReservationSource.DIRECT
    status: ReservationStatus = ReservationStatus.CONFIRMED

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_out_date <= self.check_in_date:
            raise ValueError("check_out_date must be strictly after check_in_date.")
        
        # Calculate number_of_nights if not provided
        nights = (self.check_out_date - self.check_in_date).days
        self.number_of_nights = nights
        
        if self.subtotal is None or self.subtotal <= 0:
            self.subtotal = round(self.rate_per_night * nights, 2)
            
        if self.taxes is None:
            self.taxes = round(self.subtotal * 0.12, 2)  # 12% standard GST/Tax
            
        if self.discounts is None:
            self.discounts = 0.0
            
        if self.total_amount is None or self.total_amount <= 0:
            self.total_amount = round(self.subtotal + self.taxes - self.discounts, 2)
            
        return self


class ReservationCreate(ReservationBase):
    pass


class ReservationUpdate(BaseModel):
    room_id: Optional[str] = None
    room_type_id: Optional[str] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    number_of_adults: Optional[int] = Field(default=None, ge=1)
    number_of_children: Optional[int] = Field(default=None, ge=0)
    rate_per_night: Optional[float] = Field(default=None, ge=0)
    special_requests: Optional[str] = None
    source: Optional[ReservationSource] = None
    status: Optional[ReservationStatus] = None


class AvailabilityCheckRequest(BaseModel):
    property_id: str
    check_in_date: date
    check_out_date: date
    room_type_id: Optional[str] = None


class AvailabilityResponse(BaseModel):
    available_rooms: List[dict]
    total_available: int
    property_id: str
    check_in_date: date
    check_out_date: date


class ReservationResponse(ReservationBase):
    id: str = Field(..., alias="_id")
    booking_reference: str
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    property_name: Optional[str] = None
    room_type_name: Optional[str] = None
    room_number: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    checked_in_by: Optional[str] = None
    checked_out_at: Optional[datetime] = None
    checked_out_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }


class PaginatedReservationResponse(BaseModel):
    items: List[ReservationResponse]
    page: int
    limit: int
    total: int
    total_pages: int
