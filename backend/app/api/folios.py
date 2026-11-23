from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from app.core.security import get_current_user, require_role
from app.schemas.user import UserResponse, UserRole
from app.schemas.folio import (
    FolioResponse,
    FolioChargeCreate,
    FolioPaymentCreate,
    InvoiceResponse,
    CurrencyConversionRequest,
    CurrencyConversionResponse,
)
from app.services.folio_service import FolioService
from app.services.currency_service import CurrencyService

router = APIRouter(prefix="/folios", tags=["PMS Guest Folios & Finance"])


@router.get(
    "/currencies",
    summary="List Supported Global FX Currencies",
)
async def get_currencies():
    """Retrieve list of 50+ supported currencies with real-time exchange rates to USD."""
    return CurrencyService.get_supported_currencies()


@router.post(
    "/currencies/convert",
    response_model=CurrencyConversionResponse,
    summary="Convert Amount Between Supported Currencies",
)
async def convert_currency(payload: CurrencyConversionRequest):
    """Real-time multi-currency calculation."""
    return CurrencyService.convert(
        amount=payload.amount,
        from_curr=payload.from_currency,
        to_curr=payload.to_currency,
    )


@router.get(
    "",
    response_model=List[FolioResponse],
    summary="List Folios with Optional Filtering",
)
async def list_folios(
    property_id: Optional[str] = Query(None, description="Optional property ID filter"),
    status: Optional[str] = Query(None, description="Optional status filter: OPEN, SETTLED, CLOSED"),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve list of active or settled folios."""
    return await FolioService.list_folios(
        property_id=property_id,
        status_filter=status,
        limit=limit,
    )


@router.get(
    "/reservation/{reservation_id}",
    response_model=FolioResponse,
    summary="Get or Generate Folio for a Specific Reservation",
)
async def get_folio_by_reservation(
    reservation_id: str = Path(..., description="Reservation ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve existing folio or auto-instantiate one from reservation parameters."""
    return await FolioService.get_or_create_folio_for_reservation(reservation_id)


@router.get(
    "/{folio_id}",
    response_model=FolioResponse,
    summary="Get Folio Details by ID",
)
async def get_folio(
    folio_id: str = Path(..., description="Folio ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve full folio line-item ledger."""
    return await FolioService.get_folio(folio_id)


@router.post(
    "/{folio_id}/charges",
    response_model=FolioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post Charge to Guest Folio",
)
async def post_charge(
    folio_id: str = Path(..., description="Folio ID"),
    payload: FolioChargeCreate = ...,
    current_user: UserResponse = Depends(get_current_user),
):
    """Post room, F&B, spa, or incidental charge to guest account."""
    user_name = current_user.name or current_user.email or "FRONT_DESK"
    return await FolioService.add_charge(
        folio_id=folio_id,
        payload=payload.model_dump(),
        user_name=user_name,
    )


@router.post(
    "/{folio_id}/payments",
    response_model=FolioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record Payment on Guest Folio",
)
async def record_payment(
    folio_id: str = Path(..., description="Folio ID"),
    payload: FolioPaymentCreate = ...,
    current_user: UserResponse = Depends(get_current_user),
):
    """Record guest settlement (Credit Card, Cash, PayPal, Loyalty, Direct Bill)."""
    return await FolioService.add_payment(
        folio_id=folio_id,
        payload=payload.model_dump(),
    )


@router.get(
    "/{folio_id}/invoice",
    response_model=InvoiceResponse,
    summary="Generate Formal Audit-Ready Tax Invoice",
)
async def generate_invoice(
    folio_id: str = Path(..., description="Folio ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Generate official VAT/tax invoice with breakdown of all line items and settled payments."""
    return await FolioService.generate_invoice(folio_id)
