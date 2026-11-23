from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class ChannelEnum(str, Enum):
    WHATSAPP = "WHATSAPP"
    SMS = "SMS"
    EMAIL = "EMAIL"
    IN_APP_CHAT = "IN_APP_CHAT"


class IntentEnum(str, Enum):
    ROOM_SERVICE = "ROOM_SERVICE"
    HOUSEKEEPING_REQUEST = "HOUSEKEEPING_REQUEST"
    CONCIERGE_INQUIRY = "CONCIERGE_INQUIRY"
    MAINTENANCE_ALERT = "MAINTENANCE_ALERT"
    BILLING_ISSUE = "BILLING_ISSUE"
    COMPLAINT = "COMPLAINT"


class PriorityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class DispatchStatusEnum(str, Enum):
    AUTO_RESOLVED = "AUTO_RESOLVED"
    DISPATCHED_TO_STAFF = "DISPATCHED_TO_STAFF"
    STAFF_RESOLVED = "STAFF_RESOLVED"


# --- OMNICHANNEL MESSAGING ---
class InboundMessageSimulateRequest(BaseModel):
    channel: ChannelEnum = ChannelEnum.WHATSAPP
    guest_name: str = "Marcus Vance"
    guest_phone: Optional[str] = "+1 555-019-8833"
    guest_email: Optional[EmailStr] = "guest@example.com"
    room_number: Optional[str] = "402"
    message_text: str = Field(..., min_length=2)


class OmnichannelMessageResponse(BaseModel):
    id: str
    channel: ChannelEnum
    guest_name: str
    guest_phone: Optional[str] = None
    guest_email: Optional[str] = None
    reservation_id: Optional[str] = None
    room_number: str
    incoming_message: str
    detected_intent: IntentEnum
    sentiment_score: float
    ai_automated_reply: str
    assigned_department: str
    assigned_staff: Optional[str] = None
    priority: PriorityEnum
    status: DispatchStatusEnum
    staff_notes: Optional[str] = None
    created_at: Optional[datetime] = None


class StaffActionRequest(BaseModel):
    action: str = "RESOLVE"  # RESOLVE, REASSIGN
    staff_name: str = "Concierge Desk Agent"
    reply_message: Optional[str] = None
    staff_notes: Optional[str] = None


# --- POST-STAY SURVEY & SENTIMENT ---
class PostStaySurveyCreate(BaseModel):
    reservation_id: str
    guest_name: str
    guest_email: EmailStr
    property_id: Optional[str] = "prop_default_101"
    nps_score: int = Field(..., ge=0, le=10)
    csat_score: int = Field(..., ge=1, le=5)
    cleanliness_rating: int = Field(default=5, ge=1, le=5)
    staff_rating: int = Field(default=5, ge=1, le=5)
    comments: Optional[str] = ""


class PostStaySurveyResponse(BaseModel):
    id: str
    reservation_id: str
    guest_name: str
    guest_email: str
    property_id: str
    nps_score: int
    csat_score: int
    cleanliness_rating: int
    staff_rating: int
    comments: str
    sentiment_category: str  # PROMOTER, PASSIVE, DETRACTOR
    service_recovery_ticket_id: Optional[str] = None
    created_at: Optional[datetime] = None


class SurveySentimentSummary(BaseModel):
    total_surveys: int
    nps_score: float  # -100 to +100
    average_csat: float  # 1.0 to 5.0
    promoters_count: int
    passives_count: int
    detractors_count: int
    active_recovery_tickets_count: int
    top_positive_keywords: List[str]
    top_concern_areas: List[str]


# --- HOUSEKEEPING AUTO-SCHEDULER ---
class HousekeepingTaskResponse(BaseModel):
    id: str
    property_id: str
    room_number: str
    room_type: str
    cleaning_status: str
    priority_rank: int
    priority_reason: str
    assigned_housekeeper: str
    estimated_duration_minutes: int
    scheduled_start_time: str
    guest_arrival_time: str
    guest_loyalty_tier: str
    special_instructions: str


class ScheduleOptimizationResponse(BaseModel):
    property_id: str
    total_rooms_scheduled: int
    active_housekeepers: int
    high_priority_vip_rooms: int
    schedule: List[HousekeepingTaskResponse]
    optimization_algorithm: str
