from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class MealPlanEnum(str, Enum):
    ROOM_ONLY = "ROOM_ONLY"
    BED_AND_BREAKFAST = "BED_AND_BREAKFAST"
    HALF_BOARD = "HALF_BOARD"  # Breakfast + Dinner
    FULL_BOARD = "FULL_BOARD"  # Breakfast + Lunch + Dinner
    ALL_INCLUSIVE = "ALL_INCLUSIVE"


class CancellationPolicyEnum(str, Enum):
    FLEXIBLE_24H = "FLEXIBLE_24H"  # Cancel free up to 24h before
    FLEXIBLE_48H = "FLEXIBLE_48H"  # Cancel free up to 48h before
    MODERATE_7D = "MODERATE_7D"    # Cancel free up to 7 days before
    NON_REFUNDABLE = "NON_REFUNDABLE"


class PackageInclusion(BaseModel):
    name: str = Field(..., examples=["Gourmet Breakfast Buffet"])
    description: Optional[str] = Field(default="", examples=["Daily champagne breakfast for 2"])
    value: float = Field(default=0.0, ge=0.0, examples=[45.0])


class StayRestrictions(BaseModel):
    min_los: int = Field(default=1, ge=1, le=365, description="Minimum Length of Stay in nights")
    max_los: int = Field(default=30, ge=1, le=365, description="Maximum Length of Stay in nights")
    closed_to_arrival: bool = Field(default=False, description="CTA: Disallow check-in on this date")
    closed_to_departure: bool = Field(default=False, description="CTD: Disallow check-out on this date")
    min_advance_days: int = Field(default=0, ge=0, description="Minimum days booked in advance")
    max_advance_days: int = Field(default=365, ge=1, description="Maximum days booked in advance")


class RatePlanBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=20, examples=["BAR", "BB_PKG", "NON_REF"])
    name: str = Field(..., min_length=2, max_length=100, examples=["Best Available Rate"])
    description: Optional[str] = Field(default="", max_length=500)
    rate_multiplier: float = Field(default=1.0, gt=0.0, le=5.0, description="Multiplier against Room Type base rate (e.g. 0.90 for 10% discount)")
    fixed_adjustment: float = Field(default=0.0, description="Fixed dollar surcharge/discount per night")
    meal_plan: MealPlanEnum = Field(default=MealPlanEnum.ROOM_ONLY)
    cancellation_policy: CancellationPolicyEnum = Field(default=CancellationPolicyEnum.FLEXIBLE_24H)
    is_active: bool = Field(default=True)
    is_default: bool = Field(default=False)
    inclusions: List[PackageInclusion] = []
    restrictions: StayRestrictions = StayRestrictions()


class RatePlanCreate(RatePlanBase):
    property_id: str
    room_type_id: Optional[str] = Field(default="", description="Optional room type specific override, or blank for property-wide")


class RatePlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rate_multiplier: Optional[float] = None
    fixed_adjustment: Optional[float] = None
    meal_plan: Optional[MealPlanEnum] = None
    cancellation_policy: Optional[CancellationPolicyEnum] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    inclusions: Optional[List[PackageInclusion]] = None
    restrictions: Optional[StayRestrictions] = None


class RatePlanResponse(RatePlanBase):
    id: str
    property_id: str
    room_type_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StayValidationRequest(BaseModel):
    rate_plan_id: str
    check_in_date: str  # YYYY-MM-DD
    check_out_date: str  # YYYY-MM-DD
    base_nightly_rate: float


class StayValidationResponse(BaseModel):
    is_valid: bool
    violations: List[str] = []
    nights: int
    calculated_nightly_rate: float
    total_estimated_amount: float
    inclusions_value: float
    cancellation_policy: str
