from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class CreditPackage(BaseModel):
    id: str
    name: str
    credits: int
    bonus_credits: int = 0
    total_credits: int
    price_inr: float
    badge: Optional[str] = None
    description: str


class PaymentConfigResponse(BaseModel):
    razorpay_key_id: str
    currency: str = "INR"
    mode: str = "test"


class RazorpayCreateOrderRequest(BaseModel):
    package_id: Optional[str] = Field(default=None, description="Credit package ID for wallet top-up")
    reservation_id: Optional[str] = Field(default=None, description="Reservation ID for hotel booking checkout")
    notes: Optional[Dict[str, Any]] = None


class RazorpayCreateOrderResponse(BaseModel):
    order_id: str
    amount: int  # in paise (e.g. 150000 = ₹1500.00)
    amount_inr: float
    currency: str = "INR"
    key_id: str
    package_id: Optional[str] = None
    reservation_id: Optional[str] = None
    purchased_credits: Optional[int] = None
    description: str


class RazorpayVerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    package_id: Optional[str] = None
    reservation_id: Optional[str] = None


class RazorpayVerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    order_id: str
    payment_id: str
    status: str
    wallet_balance: Optional[float] = None
    credits_added: Optional[int] = None
    reservation_id: Optional[str] = None
    booking_reference: Optional[str] = None
