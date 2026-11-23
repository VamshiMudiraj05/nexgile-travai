from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class PaymentTermsEnum(str, Enum):
    DIRECT_BILL = "DIRECT_BILL"
    CREDIT_CARD = "CREDIT_CARD"
    PRE_PAID = "PRE_PAID"


class AccountStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class GroupBlockStatusEnum(str, Enum):
    TENTATIVE = "TENTATIVE"
    DEFINITE = "DEFINITE"
    RELEASED = "RELEASED"
    CANCELLED = "CANCELLED"


class CorporateAccountBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=150)
    corporate_code: str = Field(..., min_length=3, max_length=30)
    industry: Optional[str] = Field(default="ENTERPRISE")
    contact_name: str = Field(..., min_length=2, max_length=100)
    contact_email: EmailStr
    contact_phone: Optional[str] = Field(default="")
    billing_address: Optional[str] = Field(default="")
    tax_identifier: Optional[str] = Field(default="")
    contracted_discount_pct: float = Field(default=15.0, ge=0.0, le=90.0)
    payment_terms: PaymentTermsEnum = Field(default=PaymentTermsEnum.DIRECT_BILL)
    credit_limit: float = Field(default=50000.0, ge=0.0)
    status: AccountStatusEnum = Field(default=AccountStatusEnum.ACTIVE)


class CorporateAccountCreate(CorporateAccountBase):
    pass


class CorporateAccountUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    billing_address: Optional[str] = None
    contracted_discount_pct: Optional[float] = None
    payment_terms: Optional[PaymentTermsEnum] = None
    credit_limit: Optional[float] = None
    status: Optional[AccountStatusEnum] = None


class CorporateAccountResponse(CorporateAccountBase):
    id: str
    current_balance: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class GroupBlockBase(BaseModel):
    property_id: str
    corporate_account_id: Optional[str] = None
    group_name: str = Field(..., min_length=2, max_length=150)
    group_code: str = Field(..., min_length=3, max_length=30)
    check_in_date: str
    check_out_date: str
    cutoff_date: str
    room_type_id: str
    total_rooms_blocked: int = Field(..., ge=1, le=500)
    agreed_rate: float = Field(..., gt=0.0)
    coordinator_name: str
    coordinator_email: EmailStr
    status: GroupBlockStatusEnum = Field(default=GroupBlockStatusEnum.DEFINITE)
    notes: Optional[str] = None


class GroupBlockCreate(GroupBlockBase):
    pass


class GroupBlockUpdate(BaseModel):
    group_name: Optional[str] = None
    cutoff_date: Optional[str] = None
    total_rooms_blocked: Optional[int] = None
    agreed_rate: Optional[float] = None
    coordinator_name: Optional[str] = None
    coordinator_email: Optional[EmailStr] = None
    status: Optional[GroupBlockStatusEnum] = None
    notes: Optional[str] = None


class GroupBlockResponse(GroupBlockBase):
    id: str
    room_type_name: str
    rooms_picked_up: int
    rooms_remaining: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CorporateCodeVerifyResponse(BaseModel):
    is_valid: bool
    account_id: Optional[str] = None
    company_name: Optional[str] = None
    corporate_code: str
    contracted_discount_pct: float = 0.0
    payment_terms: str = "CREDIT_CARD"
    message: str
