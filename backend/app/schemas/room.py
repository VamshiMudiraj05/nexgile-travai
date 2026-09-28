from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class RoomStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"
    OUT_OF_ORDER = "OUT_OF_ORDER"


# Valid Room Status Transition Map
VALID_ROOM_STATUS_TRANSITIONS = {
    RoomStatus.AVAILABLE: [RoomStatus.RESERVED, RoomStatus.OCCUPIED, RoomStatus.MAINTENANCE, RoomStatus.OUT_OF_ORDER, RoomStatus.CLEANING],
    RoomStatus.RESERVED: [RoomStatus.OCCUPIED, RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE],
    RoomStatus.OCCUPIED: [RoomStatus.CLEANING, RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE],
    RoomStatus.CLEANING: [RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE, RoomStatus.OUT_OF_ORDER],
    RoomStatus.MAINTENANCE: [RoomStatus.AVAILABLE, RoomStatus.CLEANING, RoomStatus.OUT_OF_ORDER],
    RoomStatus.OUT_OF_ORDER: [RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE, RoomStatus.CLEANING],
}


class RoomBase(BaseModel):
    property_id: str
    room_type_id: str
    room_number: str = Field(..., min_length=1, max_length=20)
    floor: int = Field(default=1)
    status: RoomStatus = RoomStatus.AVAILABLE
    housekeeping_status: Optional[str] = "CLEAN"
    maintenance_status: Optional[str] = "NONE"
    notes: Optional[str] = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_type_id: Optional[str] = None
    room_number: Optional[str] = None
    floor: Optional[int] = None
    status: Optional[RoomStatus] = None
    housekeeping_status: Optional[str] = None
    maintenance_status: Optional[str] = None
    notes: Optional[str] = None


class RoomStatusUpdate(BaseModel):
    status: RoomStatus
    reason: Optional[str] = None


class RoomStatusHistoryItem(BaseModel):
    id: Optional[str] = None
    room_id: str
    previous_status: RoomStatus
    new_status: RoomStatus
    changed_by: Optional[str] = None
    changed_at: datetime
    reason: Optional[str] = None


class RoomResponse(RoomBase):
    id: str = Field(..., alias="_id")
    property_name: Optional[str] = None
    room_type_name: Optional[str] = None
    current_guest_name: Optional[str] = None
    current_reservation_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }


class PaginatedRoomResponse(BaseModel):
    items: List[RoomResponse]
    page: int
    limit: int
    total: int
    total_pages: int
