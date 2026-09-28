from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator


class PropertyType(str, Enum):
    HOTEL = "HOTEL"
    RESORT = "RESORT"
    HOSTEL = "HOSTEL"
    APARTMENT = "APARTMENT"
    VILLA = "VILLA"
    OTHER = "OTHER"


class PropertyStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class ImageMetadata(BaseModel):
    url: str
    public_id: str
    resource_type: str = "image"


class PropertyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    property_code: str = Field(..., min_length=2, max_length=30)
    property_type: PropertyType = PropertyType.HOTEL
    description: Optional[str] = None
    address: str = Field(..., min_length=3)
    city: str = Field(..., min_length=2)
    state: Optional[str] = None
    country: str = Field(default="India")
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    star_rating: Optional[int] = Field(default=4, ge=1, le=5)
    amenities: List[str] = Field(default_factory=list)
    images: List[ImageMetadata] = Field(default_factory=list)
    check_in_time: str = Field(default="14:00")
    check_out_time: str = Field(default="11:00")
    currency: str = Field(default="INR")
    timezone: str = Field(default="Asia/Kolkata")
    status: PropertyStatus = PropertyStatus.ACTIVE

    @field_validator("email", "phone", "website", "state", "postal_code", "description", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v



class PropertyCreate(PropertyBase):
    pass


class RoomTypeOnboarding(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = ""
    max_occupancy: int = Field(default=2, ge=1, le=20)
    adults_capacity: int = Field(default=2, ge=1, le=10)
    children_capacity: int = Field(default=1, ge=0, le=10)
    bed_type: str = Field(default="KING")
    bed_count: int = Field(default=1, ge=1, le=10)
    base_price: float = Field(..., ge=0)
    amenities: List[str] = Field(default_factory=list)
    images: List[ImageMetadata] = Field(default_factory=list)
    number_of_rooms: Optional[int] = Field(default=2, ge=0, le=100)
    starting_room_number: Optional[int] = Field(default=101)
    floor: Optional[int] = Field(default=1)
    custom_room_numbers: Optional[List[str]] = Field(default_factory=list)


class PropertyOnboardRequest(PropertyBase):
    room_types: List[RoomTypeOnboarding] = Field(default_factory=list)


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    property_code: Optional[str] = None
    property_type: Optional[PropertyType] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    star_rating: Optional[int] = Field(default=None, ge=1, le=5)
    amenities: Optional[List[str]] = None
    images: Optional[List[ImageMetadata]] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    status: Optional[PropertyStatus] = None

    @field_validator("email", "phone", "website", "state", "postal_code", "description", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v



class PropertyResponse(PropertyBase):
    id: str = Field(..., alias="_id")
    total_rooms: int = 0
    total_room_types: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }


class PaginatedPropertyResponse(BaseModel):
    items: List[PropertyResponse]
    page: int
    limit: int
    total: int
    total_pages: int
