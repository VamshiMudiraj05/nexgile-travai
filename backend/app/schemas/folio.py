from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class ChargeCategory(str, Enum):
    ROOM_CHARGE = "ROOM_CHARGE"
    TAX = "TAX"
    FOOD_AND_BEVERAGE = "FOOD_AND_BEVERAGE"
    SPA_AND_WELLNESS = "SPA_AND_WELLNESS"
    TRANSPORTATION = "TRANSPORTATION"
    LAUNDRY = "LAUNDRY"
    MINIBAR = "MINIBAR"
    LATE_CHECKOUT = "LATE_CHECKOUT"
    DAMAGE_FEE = "DAMAGE_FEE"
    MISCELLANEOUS = "MISCELLANEOUS"


class PaymentMethodEnum(str, Enum):
    CARD = "CARD"
    CASH = "CASH"
    RAZORPAY = "RAZORPAY"
    BANK_TRANSFER = "BANK_TRANSFER"
    CRYPTO = "CRYPTO"
    DIRECT_BILL = "DIRECT_BILL"
    LOYALTY_POINTS = "LOYALTY_POINTS"


class FolioStatus(str, Enum):
    OPEN = "OPEN"
    SETTLED = "SETTLED"
    CLOSED = "CLOSED"


class FolioChargeCreate(BaseModel):
    category: ChargeCategory = Field(default=ChargeCategory.ROOM_CHARGE)
    description: str = Field(..., min_length=2, max_length=200)
    amount: float = Field(..., gt=0.0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    tax_rate: float = Field(default=0.12, ge=0.0, le=1.0)  # default 12% hotel tax
    posted_by: Optional[str] = Field(default="FRONT_DESK")


class FolioChargeResponse(BaseModel):
    id: str
    category: str
    description: str
    amount: float
    currency: str
    tax_amount: float
    date: Optional[datetime] = None
    posted_by: str


class FolioPaymentCreate(BaseModel):
    payment_method: PaymentMethodEnum = Field(default=PaymentMethodEnum.CARD)
    amount: float = Field(..., gt=0.0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    transaction_reference: Optional[str] = Field(default="")
    notes: Optional[str] = None


class FolioPaymentResponse(BaseModel):
    id: str
    payment_method: str
    amount: float
    currency: str
    transaction_reference: str
    status: str
    date: Optional[datetime] = None


class FolioResponse(BaseModel):
    id: str
    reservation_id: str
    property_id: str
    guest_id: str
    guest_name: str
    guest_email: str
    room_number: str
    currency: str
    status: FolioStatus
    charges: List[FolioChargeResponse] = []
    payments: List[FolioPaymentResponse] = []
    total_charges: float
    total_tax: float
    total_paid: float
    balance: float
    invoice_number: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class InvoiceResponse(BaseModel):
    invoice_number: str
    folio_id: str
    reservation_id: str
    property_name: str
    property_address: str
    property_tax_id: str
    guest_name: str
    guest_email: str
    check_in_date: str
    check_out_date: str
    room_number: str
    issue_date: str
    currency: str
    subtotal: float
    tax_total: float
    total: float
    amount_paid: float
    amount_due: float
    status: str
    line_items: List[FolioChargeResponse]
    payments: List[FolioPaymentResponse]


class CurrencyConversionRequest(BaseModel):
    amount: float = Field(..., gt=0.0)
    from_currency: str = Field(..., min_length=3, max_length=3)
    to_currency: str = Field(..., min_length=3, max_length=3)


class CurrencyConversionResponse(BaseModel):
    original_amount: float
    from_currency: str
    converted_amount: float
    to_currency: str
    rate: float
    timestamp: datetime
