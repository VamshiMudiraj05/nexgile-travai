from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Path, status
from bson import ObjectId

from app.core.security import security_bearer, decode_access_token
from app.schemas.marketplace_multimodal import (
    FlightSearchResponse,
    CarSearchResponse,
    ActivitySearchResponse,
    PackageSearchResponse,
    CartItemInput,
    CartResponse,
    HoldCartResponse,
    PromoApplyRequest,
    PromoApplyResponse,
    CheckoutRequest,
    CheckoutResponse,
    VoucherResponse,
    DisruptionSimulationRequest,
    DisruptionResolveResponse,
)
from app.services.multimodal_service import MultimodalService

router = APIRouter(prefix="/multimodal", tags=["Multimodal Travel Marketplace & Unified Cart"])


async def get_optional_user_id(
    credentials=Depends(security_bearer),
) -> str:
    """Helper to extract user_id if token provided, otherwise default to guest."""
    if credentials and credentials.credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            if payload and payload.get("sub"):
                return str(payload.get("sub"))
        except Exception:
            pass
    return "guest_traveler"


# --- FLIGHTS ---
@router.get(
    "/flights/search",
    response_model=FlightSearchResponse,
    summary="Search global multimodal flights across airline networks",
)
async def search_flights(
    origin: str = Query("NYC", description="Origin IATA airport code"),
    destination: str = Query("LON", description="Destination IATA airport code"),
    departure_date: str = Query("2026-12-01", description="Departure date (YYYY-MM-DD)"),
    cabin_class: str = Query("ECONOMY", description="Cabin class: ECONOMY, BUSINESS, FIRST"),
):
    return MultimodalService.search_flights(
        origin=origin,
        destination=destination,
        departure_date=departure_date,
        cabin_class=cabin_class,
    )


# --- CARS ---
@router.get(
    "/cars/search",
    response_model=CarSearchResponse,
    summary="Search car rentals & airport chauffeur fleets",
)
async def search_cars(
    location: str = Query("Miami", description="Pickup city or airport"),
    pickup_date: str = Query("2026-12-01", description="Pickup date (YYYY-MM-DD)"),
    return_date: str = Query("2026-12-05", description="Return date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Car category filter (SEDAN, SUV, LUXURY, ELECTRIC)"),
):
    return MultimodalService.search_cars(
        location=location,
        pickup_date=pickup_date,
        return_date=return_date,
        category=category,
    )


# --- ACTIVITIES & EXPERIENCES ---
@router.get(
    "/activities/search",
    response_model=ActivitySearchResponse,
    summary="Search destination tours, activities, and dining experiences",
)
async def search_activities(
    destination: str = Query("Paris", description="Destination city"),
    date: str = Query("2026-12-02", description="Activity date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Category filter"),
):
    return MultimodalService.search_activities(
        destination=destination,
        date=date,
        category=category,
    )


# --- PACKAGES ---
@router.get(
    "/packages/search",
    response_model=PackageSearchResponse,
    summary="Search dynamic flight+hotel+car bundled packages with bundled discounts",
)
async def search_packages(
    destination: str = Query("Cancun", description="Destination name"),
):
    return MultimodalService.search_packages(destination=destination)


# --- UNIFIED CART ---
@router.get(
    "/cart",
    response_model=CartResponse,
    summary="Retrieve current active multimodal cart",
)
async def get_active_cart(
    user_id: str = Depends(get_optional_user_id),
):
    return await MultimodalService.get_or_create_cart(user_id=user_id)


@router.post(
    "/cart/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add multimodal line item (Hotel, Flight, Car, Tour) to Unified Cart",
)
async def add_cart_item(
    item: CartItemInput,
    user_id: str = Depends(get_optional_user_id),
):
    return await MultimodalService.add_to_cart(user_id=user_id, item_data=item.model_dump())


@router.delete(
    "/cart/items/{item_id}",
    response_model=CartResponse,
    summary="Remove line item from Unified Cart",
)
async def remove_cart_item(
    item_id: str = Path(..., description="Line item ID to remove"),
    user_id: str = Depends(get_optional_user_id),
):
    return await MultimodalService.remove_from_cart(user_id=user_id, item_id=item_id)


@router.post(
    "/cart/hold",
    response_model=HoldCartResponse,
    summary="Hold cart and freeze prices across all suppliers for 48 hours",
)
async def hold_cart(
    user_id: str = Depends(get_optional_user_id),
):
    return await MultimodalService.hold_cart_price(user_id=user_id)


@router.post(
    "/cart/apply-promo",
    response_model=PromoApplyResponse,
    summary="Apply promotional voucher code to Unified Cart",
)
async def apply_promo(
    payload: PromoApplyRequest,
    user_id: str = Depends(get_optional_user_id),
):
    return await MultimodalService.apply_promo_code(user_id=user_id, promo_code=payload.promo_code)


@router.post(
    "/cart/checkout",
    response_model=CheckoutResponse,
    summary="Execute one-click unified checkout across all multimodal suppliers",
)
async def checkout_cart(
    payload: CheckoutRequest,
    user_id: str = Depends(get_optional_user_id),
):
    return await MultimodalService.checkout(user_id=user_id, checkout_data=payload.model_dump())


# --- DIGITAL VOUCHERS ---
@router.get(
    "/vouchers/{voucher_code}",
    response_model=VoucherResponse,
    summary="Retrieve issued digital voucher by code with supplier barcode/QR payload",
)
async def get_voucher(
    voucher_code: str = Path(..., description="Voucher code, e.g. VCH-202611-ABCDEF"),
):
    return await MultimodalService.get_voucher(voucher_code=voucher_code)


# --- DISRUPTIONS & REBOOKING ---
@router.post(
    "/disruptions/resolve",
    response_model=DisruptionResolveResponse,
    summary="Simulate travel disruption and trigger AI proactive rebooking & credit protection",
)
async def resolve_disruption(
    payload: DisruptionSimulationRequest,
):
    return MultimodalService.resolve_disruption(
        booking_reference=payload.booking_reference,
        product_type=payload.product_type.value,
        disruption_type=payload.disruption_type,
    )
