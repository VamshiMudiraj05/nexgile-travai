from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ServiceRequestCreate(BaseModel):
    category: str = Field(..., description="HOUSEKEEPING, TRANSPORTATION, ROOM_SERVICE, MAINTENANCE, CONCIERGE")
    item: str = Field(..., description="e.g. Extra Towels, Airport Transfer, Room Turnaround")
    details: Optional[str] = Field(None, description="Detailed instructions or specifications")
    property_id: Optional[str] = None
    reservation_id: Optional[str] = None
    room_number: Optional[str] = None


class ServiceRequestUpdate(BaseModel):
    status: Optional[str] = Field(None, description="OPEN, IN_PROGRESS, COMPLETED, CANCELLED")
    notes: Optional[str] = None


class ServiceRequestResponse(BaseModel):
    id: str
    user_id: str
    guest_name: Optional[str] = None
    reservation_id: Optional[str] = None
    property_id: Optional[str] = None
    property_name: Optional[str] = None
    room_number: Optional[str] = None
    category: str
    item: str
    details: Optional[str] = None
    status: str
    created_at: str
    updated_at: str
