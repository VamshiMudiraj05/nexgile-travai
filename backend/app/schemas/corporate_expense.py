from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class ApprovalStatusEnum(str, Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    AUTO_APPROVED = "AUTO_APPROVED"


class ExpenseStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REIMBURSED = "REIMBURSED"


class SafetyStatusEnum(str, Enum):
    CHECKED_IN_SAFE = "CHECKED_IN_SAFE"
    IN_TRANSIT = "IN_TRANSIT"
    ASSISTANCE_REQUESTED = "ASSISTANCE_REQUESTED"


class RiskLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# --- POLICY ---
class CorporatePolicyCreate(BaseModel):
    company_id: str
    policy_name: str = "Global Corporate Travel Policy"
    max_hotel_rate_per_night: float = Field(default=300.0, gt=0.0)
    daily_meal_per_diem: float = Field(default=85.0, ge=0.0)
    max_flight_duration_for_economy: float = Field(default=6.0, ge=1.0)
    advance_booking_days: int = Field(default=7, ge=0)
    approval_threshold_amount: float = Field(default=1000.0, ge=0.0)
    restricted_destinations: List[str] = []
    is_active: bool = True


class CorporatePolicyResponse(CorporatePolicyCreate):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ComplianceCheckRequest(BaseModel):
    company_id: Optional[str] = None
    hotel_rate_per_night: Optional[float] = 0.0
    daily_meal_estimate: Optional[float] = 0.0
    flight_duration_hours: Optional[float] = 0.0
    flight_cabin: Optional[str] = "ECONOMY"
    days_in_advance: int = 10
    total_cost: float = 0.0
    destination: Optional[str] = ""


class ComplianceCheckResponse(BaseModel):
    is_compliant: bool
    requires_approval: bool
    violations: List[str] = []
    policy_notes: str


# --- APPROVALS ---
class TravelApprovalCreate(BaseModel):
    company_id: Optional[str] = "COMP-GLOBAL"
    employee_id: Optional[str] = "EMP-1001"
    employee_name: str
    employee_email: EmailStr
    department: str = "Sales & Operations"
    destination: str
    departure_date: str
    return_date: str
    estimated_total: float = Field(..., gt=0.0)
    hotel_rate_per_night: Optional[float] = 0.0
    flight_duration_hours: Optional[float] = 0.0
    flight_cabin: Optional[str] = "ECONOMY"
    business_justification: str


class TravelApprovalAction(BaseModel):
    action: str = Field(..., description="APPROVE or REJECT")
    approver_name: str = "Executive Approver"
    comments: Optional[str] = ""


class TravelApprovalResponse(BaseModel):
    id: str
    request_number: str
    company_id: str
    employee_id: str
    employee_name: str
    employee_email: str
    department: str
    destination: str
    departure_date: str
    return_date: str
    estimated_total: float
    is_in_policy: bool
    policy_violations: List[str] = []
    business_justification: str
    status: ApprovalStatusEnum
    approver_name: Optional[str] = None
    approver_comments: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


# --- EXPENSES & OCR ---
class ExpenseItem(BaseModel):
    item_id: Optional[str] = None
    date: str
    category: str = "HOTEL"  # HOTEL, FLIGHT, MEALS, GROUND_TRANSPORT, INCIDENTALS
    merchant: str
    description: str
    amount: float = Field(..., gt=0.0)
    vat_amount: float = 0.0
    receipt_url: Optional[str] = None


class OCRScanRequest(BaseModel):
    receipt_image_url: Optional[str] = None
    receipt_filename: Optional[str] = "hotel_folio_receipt.jpg"


class OCRScanResponse(BaseModel):
    merchant_name: str
    date: str
    category: str
    subtotal: float
    vat_amount: float
    total_amount: float
    vat_percentage: float
    confidence_score: float
    suggested_line_item: ExpenseItem


class ExpenseReportCreate(BaseModel):
    company_id: Optional[str] = "COMP-GLOBAL"
    employee_id: Optional[str] = "EMP-1001"
    employee_name: str
    title: str
    department: str = "Sales"
    cost_center: str = "CC-4001"
    period: str
    line_items: List[ExpenseItem] = []


class ExpenseReportResponse(BaseModel):
    id: str
    report_number: str
    company_id: str
    employee_id: str
    employee_name: str
    title: str
    department: str
    cost_center: str
    period: str
    line_items: List[ExpenseItem]
    subtotal: float
    vat_amount: float
    total_amount: float
    currency: str
    status: ExpenseStatusEnum
    receipt_count: int
    audit_flag: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class VATRecoverySummary(BaseModel):
    total_expense: float
    total_reclaimable_vat: float
    eligible_transactions_count: int
    by_category: Dict[str, float]


# --- DUTY OF CARE ---
class DutyOfCareTravelerResponse(BaseModel):
    id: str
    employee_name: str
    employee_email: str
    department: str
    current_city: str
    destination_country: str
    start_date: str
    end_date: str
    hotel_name: str
    flight_pnr: str
    risk_level: RiskLevelEnum
    safety_status: SafetyStatusEnum
    last_ping_time: Optional[datetime] = None
    emergency_phone: str


class BroadcastAlertRequest(BaseModel):
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    target_city: Optional[str] = None
    subject: str
    message: str
