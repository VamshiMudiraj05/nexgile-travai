from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ProductTypeEnum(str, Enum):
    HOTEL = "HOTEL"
    FLIGHT = "FLIGHT"
    CAR = "CAR"
    ACTIVITY = "ACTIVITY"
    PACKAGE = "PACKAGE"


class CabinClassEnum(str, Enum):
    ECONOMY = "ECONOMY"
    PREMIUM_ECONOMY = "PREMIUM_ECONOMY"
    BUSINESS = "BUSINESS"
    FIRST = "FIRST"


class CarCategoryEnum(str, Enum):
    SEDAN = "SEDAN"
    SUV = "SUV"
    LUXURY = "LUXURY"
    ELECTRIC = "ELECTRIC"
    CONVERTIBLE = "CONVERTIBLE"


# --- FLIGHTS ---
class FlightItem(BaseModel):
    id: str
    airline: str
    airline_logo: str
    flight_number: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    duration: str
    stops: int
    cabin_class: CabinClassEnum
    price: float
    seats_remaining: int
    refundable: bool


class FlightSearchResponse(BaseModel):
    origin: str
    destination: str
    departure_date: str
    total_found: int
    flights: List[FlightItem]


# --- CARS ---
class CarRentalItem(BaseModel):
    id: str
    provider: str
    model: str
    category: CarCategoryEnum
    image_url: str
    daily_rate: float
    total_price: float
    seats: int
    transmission: str
    unlimited_mileage: bool
    pickup_location: str
    dropoff_location: str


class CarSearchResponse(BaseModel):
    location: str
    pickup_date: str
    return_date: str
    total_found: int
    cars: List[CarRentalItem]


# --- ACTIVITIES ---
class ActivityItem(BaseModel):
    id: str
    title: str
    category: str
    image_url: str
    duration: str
    location: str
    rating: float
    review_count: int
    price_per_person: float
    free_cancellation: bool
    highlights: List[str]


class ActivitySearchResponse(BaseModel):
    destination: str
    date: str
    total_found: int
    activities: List[ActivityItem]


# --- DYNAMIC PACKAGES ---
class DynamicPackageItem(BaseModel):
    id: str
    title: str
    destination: str
    duration_days: int
    hotel_name: str
    flight_airline: str
    car_model: Optional[str] = None
    original_total: float
    package_price: float
    savings_amount: float
    savings_pct: float
    image_url: str
    inclusions: List[str]


class PackageSearchResponse(BaseModel):
    destination: str
    total_found: int
    packages: List[DynamicPackageItem]


# --- UNIFIED CART ---
class CartItemInput(BaseModel):
    product_type: ProductTypeEnum
    title: str
    subtitle: Optional[str] = ""
    dates: str
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., gt=0.0)
    details: Optional[Dict[str, Any]] = {}


class CartItemResponse(BaseModel):
    item_id: str
    product_type: str
    title: str
    subtitle: str
    dates: str
    quantity: int
    unit_price: float
    total_price: float
    details: Dict[str, Any] = {}


class CartResponse(BaseModel):
    id: str
    user_id: str
    status: str
    items: List[CartItemResponse] = []
    subtotal: float
    discount_amount: float
    promo_code: Optional[str] = None
    tax_amount: float
    total_amount: float
    currency: str
    hold_expires_at: Optional[datetime] = None


class HoldCartResponse(BaseModel):
    cart_id: str
    status: str
    hold_expires_at: datetime
    price_locked_amount: float
    currency: str
    message: str


class PromoApplyRequest(BaseModel):
    promo_code: str


class PromoApplyResponse(BaseModel):
    is_valid: bool
    promo_code: str
    discount_amount: float
    message: str


class CheckoutRequest(BaseModel):
    traveler_name: str
    traveler_email: str
    traveler_phone: Optional[str] = None
    payment_method: str = "CARD"
    card_number: Optional[str] = None
    billing_address: Optional[str] = None


class VoucherResponse(BaseModel):
    id: str
    voucher_code: str
    booking_reference: str
    product_type: str
    supplier_name: str
    supplier_confirmation_code: str
    traveler_name: str
    traveler_email: str
    title: str
    valid_dates: str
    inclusions: List[str] = []
    status: str
    qr_payload: str
    issued_at: Optional[datetime] = None


class CheckoutResponse(BaseModel):
    status: str
    master_booking_reference: str
    total_paid: float
    currency: str
    items_booked: int
    vouchers: List[VoucherResponse]
    confirmation_message: str


# --- DISRUPTION HANDLING ---
class DisruptionSimulationRequest(BaseModel):
    booking_reference: str
    product_type: ProductTypeEnum = ProductTypeEnum.FLIGHT
    disruption_type: str = "FLIGHT_DELAY"  # FLIGHT_DELAY, FLIGHT_CANCELLED, WEATHER_ALERT, HOTEL_OVERBOOK


class DisruptionResolveResponse(BaseModel):
    disruption_case_id: str
    booking_reference: str
    disruption_type: str
    severity: str
    resolution_status: str  # REBOOKED, TRIP_CREDIT_ISSUED, ALTERNATIVE_DISPATCHED
    rebooked_alternative: Optional[str] = None
    compensation_credit: float
    traveler_notification: str
