from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status

from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.superapp_enterprise import (
    WalletResponse,
    WalletTopUpRequest,
    WalletConvertPointsRequest,
    VaultDocumentCreate,
    VaultDocumentResponse,
    LanguageOption,
    TranslationDictionaryResponse,
    TenantCreate,
    TenantResponse,
)
from app.services.superapp_service import SuperAppService

router = APIRouter(prefix="/superapp", tags=["Mobile Super App, Digital Wallet & Multi-Tenancy"])


# --- DIGITAL WALLET ---
@router.get(
    "/wallet",
    response_model=WalletResponse,
    summary="Get Traveler Digital Stored Cash Wallet",
)
async def get_wallet(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve traveler digital cash balance, loyalty points value, and referral earnings."""
    return await SuperAppService.get_or_create_wallet(user_id=str(current_user.id))


@router.post(
    "/wallet/top-up",
    response_model=WalletResponse,
    summary="Deposit Funds to Digital Wallet",
)
async def top_up_wallet(
    payload: WalletTopUpRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Add stored digital cash via Apple Pay, Google Pay, or Credit Card."""
    return await SuperAppService.top_up_wallet(
        user_id=str(current_user.id),
        amount=payload.amount,
        method=payload.payment_method,
    )


@router.post(
    "/wallet/convert-points",
    response_model=WalletResponse,
    summary="Convert Loyalty Points into Wallet Cash",
)
async def convert_points(
    payload: WalletConvertPointsRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Stack points across airlines and hotels and convert to instant digital wallet cash."""
    return await SuperAppService.convert_points_to_cash(
        user_id=str(current_user.id),
        points=payload.points_to_convert,
    )


# --- ENCRYPTED TRAVEL VAULT ---
@router.get(
    "/vault",
    response_model=List[VaultDocumentResponse],
    summary="Get Encrypted Travel Documents & Active Mobile Keys",
)
async def get_vault_documents(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve stored passports, visas (with 6-month renewal alerts), and active BLE/NFC room keys."""
    return await SuperAppService.get_vault_documents(user_id=str(current_user.id))


@router.post(
    "/vault",
    response_model=VaultDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Store Encrypted Document in Vault",
)
async def add_vault_document(
    payload: VaultDocumentCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Safely store passport, visa, boarding pass, or digital room access key."""
    return await SuperAppService.add_vault_document(
        user_id=str(current_user.id),
        doc_data=payload.model_dump(),
    )


# --- MULTILINGUAL i18n ---
@router.get(
    "/i18n/languages",
    response_model=List[LanguageOption],
    summary="List Supported Global Languages",
)
async def list_languages():
    """Retrieve catalog of 60+ global languages, native scripts, and RTL flags."""
    return SuperAppService.get_supported_languages()


@router.get(
    "/i18n/translations/{locale}",
    response_model=TranslationDictionaryResponse,
    summary="Get Localized Translations & Formatting Parameters",
)
async def get_translations(
    locale: str = Path(..., description="Locale code, e.g. en, es, fr, de, ja, ar"),
):
    """Retrieve translated strings, regional currency symbols, and localized date formats."""
    return SuperAppService.get_translations(locale=locale)


# --- ENTERPRISE MULTI-TENANCY ---
@router.get(
    "/tenants",
    response_model=List[TenantResponse],
    summary="List Enterprise Brand Tenants",
)
async def list_tenants(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve white-label hotel brands with partitioned data isolation."""
    return await SuperAppService.list_tenants()


@router.post(
    "/tenants",
    response_model=TenantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Provision New Multi-Tenant Brand Instance",
)
async def create_tenant(
    payload: TenantCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Provision a new hotel brand tenant with dedicated subdomain and custom styling."""
    return await SuperAppService.create_tenant(payload.model_dump())
