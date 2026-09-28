from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.property import ImageMetadata


class BedType(str):
    KING = "KING"
    QUEEN = "QUEEN"
    TWIN = "TWIN"
    DOUBLE = "DOUBLE"
    SINGLE = "SINGLE"


class RoomTypeBase(BaseModel):
    property_id: str
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = None
    max_occupancy: int = Field(default=2, ge=1, le=20)
    adults_capacity: int = Field(default=2, ge=1, le=10)
    children_capacity: int = Field(default=1, ge=0, le=10)
    bed_type: str = Field(default="KING")
    bed_count: int = Field(default=1, ge=1, le=10)
    base_price: float = Field(..., ge=0)
    amenities: List[str] = Field(default_factory=list)
    size: Optional[str] = Field(default="350 sq ft")
    images: List[ImageMetadata] = Field(default_factory=list)
    status: str = Field(default="ACTIVE")


class RoomTypeCreate(RoomTypeBase):
    pass


class RoomTypeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    max_occupancy: Optional[int] = Field(default=None, ge=1, le=20)
    adults_capacity: Optional[int] = Field(default=None, ge=1, le=10)
    children_capacity: Optional[int] = Field(default=None, ge=0, le=10)
    bed_type: Optional[str] = None
    bed_count: Optional[int] = Field(default=None, ge=1, le=10)
    base_price: Optional[float] = Field(default=None, ge=0)
    amenities: Optional[List[str]] = None
    size: Optional[str] = None
    images: Optional[List[ImageMetadata]] = None
    status: Optional[str] = None


class RoomTypeResponse(RoomTypeBase):
    id: str = Field(..., alias="_id")
    total_rooms: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }
