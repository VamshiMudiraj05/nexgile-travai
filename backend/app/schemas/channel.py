from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChannelTypeEnum(str, Enum):
    OTA = "OTA"
    GDS = "GDS"
    METASEARCH = "METASEARCH"
    DIRECT = "DIRECT"
    WHOLESALER = "WHOLESALER"


class ChannelStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ERROR = "ERROR"


class SyncHealthEnum(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"


class ChannelBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=30, examples=["BOOKING_COM", "EXPEDIA", "AMADEUS_GDS"])
    name: str = Field(..., min_length=2, max_length=100, examples=["Booking.com", "Expedia Partner Network"])
    channel_type: ChannelTypeEnum = Field(default=ChannelTypeEnum.OTA)
    status: ChannelStatusEnum = Field(default=ChannelStatusEnum.ACTIVE)
    commission_pct: float = Field(default=15.0, ge=0.0, le=50.0)
    rate_parity_markup: float = Field(default=0.0, ge=-20.0, le=50.0)
    api_endpoint: Optional[str] = Field(default="", examples=["https://api.booking.com/v2/ari"])
    supports_two_way_ari: bool = Field(default=True)


class ChannelCreate(ChannelBase):
    pass


class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[ChannelStatusEnum] = None
    commission_pct: Optional[float] = None
    rate_parity_markup: Optional[float] = None
    api_endpoint: Optional[str] = None
    supports_two_way_ari: Optional[bool] = None


class ChannelResponse(ChannelBase):
    id: str
    last_sync_at: Optional[datetime] = None
    sync_health: SyncHealthEnum
    latency_ms: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ChannelMappingCreate(BaseModel):
    property_id: str
    room_type_id: str
    channel_code: str
    channel_room_code: str
    channel_rate_plan_code: Optional[str] = "BAR"
    stop_sell: bool = False


class ChannelMappingResponse(BaseModel):
    id: str
    property_id: str
    room_type_id: str
    room_type_name: str
    channel_code: str
    channel_room_code: str
    channel_rate_plan_code: str
    stop_sell: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ChannelAllotmentSetRequest(BaseModel):
    property_id: str
    room_type_id: str
    channel_code: str
    date: str  # YYYY-MM-DD
    allocated_rooms: int = Field(..., ge=0, le=500)
    stop_sell: Optional[bool] = None


class ChannelAllotmentResponse(BaseModel):
    id: str
    property_id: str
    room_type_id: str
    channel_code: str
    date: str
    allocated_rooms: int
    sold_rooms: int
    available_rooms: int
    stop_sell: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SyncTriggerResponse(BaseModel):
    status: str
    channels_synced: int
    items_synced: int
    average_latency_ms: int
    synced_at: datetime
    message: str


class SyncLogResponse(BaseModel):
    id: str
    channel_code: str
    event_type: str
    status: str
    items_synced: int
    latency_ms: int
    details: str
    timestamp: Optional[datetime] = None


class RateParityItem(BaseModel):
    room_type_name: str
    direct_rate: float
    channel_code: str
    channel_name: str
    channel_rate: float
    variance: float
    parity_status: str  # PARITY, OTA_UNDERCUTTING, OTA_PREMIUM
    is_violation: bool


class RateParityReport(BaseModel):
    property_id: str
    audited_at: datetime
    total_audited: int
    violations_count: int
    parity_health_score: float  # e.g. 94.5%
    items: List[RateParityItem]


class ChannelPerformanceMetric(BaseModel):
    channel_code: str
    channel_name: str
    channel_type: str
    status: str
    bookings_count: int
    gross_revenue: float
    commission_rate: float
    commission_paid: float
    net_revenue: float
    revenue_share_pct: float
    cancellation_rate_pct: float
    avg_lead_time_days: int


class ChannelPerformanceSummary(BaseModel):
    total_gross_revenue: float
    total_commission_paid: float
    total_net_revenue: float
    total_bookings: int
    direct_booking_share_pct: float
    channels: List[ChannelPerformanceMetric]
