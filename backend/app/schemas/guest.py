from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class GuestBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=30)
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = "Indian"
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    postal_code: Optional[str] = None
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    identity_document_url: Optional[str] = None
    preferences: Optional[str] = None
    notes: Optional[str] = None
    loyalty_id: Optional[str] = None


class GuestCreate(GuestBase):
    pass


class GuestUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    identity_document_url: Optional[str] = None
    preferences: Optional[str] = None
    notes: Optional[str] = None
    loyalty_id: Optional[str] = None


class GuestResponse(GuestBase):
    id: str = Field(..., alias="_id")
    total_bookings: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }


class PaginatedGuestResponse(BaseModel):
    items: List[GuestResponse]
    page: int
    limit: int
    total: int
    total_pages: int
