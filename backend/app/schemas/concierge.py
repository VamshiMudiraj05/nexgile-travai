from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ConciergeChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Traveler inquiry message")
    reservation_id: Optional[str] = Field(None, description="Optional reservation ID context")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Session conversation history")


class ConciergeAction(BaseModel):
    action_type: str = Field(..., description="Action identifier: CREATE_SERVICE_REQUEST, VIEW_RESERVATION, BROWSE_MARKETPLACE, VIEW_REQUESTS")
    action_label: str = Field(..., description="Human-readable label for interactive button")
    payload: Optional[Dict[str, Any]] = Field(default={}, description="Action payload to send on execution")


class ConciergeChatResponse(BaseModel):
    message: str
    suggested_action: Optional[ConciergeAction] = None
    quick_replies: List[str] = []


class ActiveStaySummary(BaseModel):
    reservation_id: str
    booking_reference: str
    property_id: str
    property_name: str
    property_city: str
    room_number: Optional[str] = None
    room_type_name: str
    check_in_date: str
    check_out_date: str
    nights: int
    status: str
    check_in_time: Optional[str] = "14:00"
    check_out_time: Optional[str] = "11:00"


class ConciergeWelcomeResponse(BaseModel):
    traveler_name: str
    active_stay: Optional[ActiveStaySummary] = None
    loyalty_tier: str
    loyalty_points: int
    quick_suggestions: List[str]
