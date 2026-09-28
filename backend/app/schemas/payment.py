from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class PayPalCreateOrderRequest(BaseModel):
    reservation_id: Optional[str] = None
    amount: float = Field(..., gt=0, description="Amount in USD or local currency")
    currency: str = Field(default="USD", description="Currency code (USD, EUR, GBP, etc.)")
    booking_reference: Optional[str] = None
    description: Optional[str] = "Nexgile-TravAI Hotel Stay"


class PayPalCreateOrderResponse(BaseModel):
    order_id: str
    status: str
    approval_url: Optional[str] = None
    amount: float
    currency: str


class PayPalCaptureOrderRequest(BaseModel):
    order_id: str
    reservation_id: str


class PayPalCaptureOrderResponse(BaseModel):
    success: bool
    status: str
    order_id: str
    capture_id: Optional[str] = None
    payer_email: Optional[str] = None
    amount: float
    currency: str
    reservation_id: str
    booking_reference: str
    message: str
