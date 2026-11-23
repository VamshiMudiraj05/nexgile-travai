from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class DocTypeEnum(str, Enum):
    PASSPORT = "PASSPORT"
    VISA = "VISA"
    BOARDING_PASS = "BOARDING_PASS"
    DIGITAL_ROOM_KEY = "DIGITAL_ROOM_KEY"
    HEALTH_PASS = "HEALTH_PASS"


# --- DIGITAL WALLET ---
class WalletTopUpRequest(BaseModel):
    amount: float = Field(..., gt=0.0)
    payment_method: str = "APPLE_PAY"  # APPLE_PAY, GOOGLE_PAY, CREDIT_CARD


class WalletConvertPointsRequest(BaseModel):
    points_to_convert: int = Field(..., ge=500)


class WalletTransaction(BaseModel):
    tx_id: str
    tx_type: str  # TOP_UP, POINTS_CONVERSION, CASHBACK, BOOKING_PAYMENT, REFERRAL_BONUS
    amount: float
    description: str
    timestamp: datetime


class WalletResponse(BaseModel):
    id: str
    user_id: str
    cash_balance: float
    currency: str
    loyalty_points: int
    points_cash_value: float
    referral_code: str
    referral_earnings: float
    transactions: List[WalletTransaction] = []


# --- ENCRYPTED TRAVEL VAULT ---
class VaultDocumentCreate(BaseModel):
    doc_type: DocTypeEnum
    title: str
    holder_name: str
    document_number: str
    issuing_country: str = "United States"
    expiry_date: str = "2028-10-15"
    room_number: Optional[str] = None
    barcode_payload: Optional[str] = None


class VaultDocumentResponse(BaseModel):
    id: str
    user_id: str
    doc_type: DocTypeEnum
    title: str
    holder_name: str
    document_number_masked: str
    issuing_country: str
    expiry_date: str
    is_expired: bool
    expires_soon: bool
    nfc_ble_token: Optional[str] = None
    barcode_payload: Optional[str] = None
    created_at: Optional[datetime] = None


# --- MULTILINGUAL i18n ---
class LanguageOption(BaseModel):
    code: str
    name: str
    native_name: str
    is_rtl: bool = False
    flag: str


class TranslationDictionaryResponse(BaseModel):
    locale: str
    language_name: str
    translations: Dict[str, str]
    currency_symbol: str
    date_format: str


# --- MULTI-TENANCY ---
class TenantCreate(BaseModel):
    organization_name: str
    subdomain: str
    primary_brand_color: str = "#3B82F6"
    secondary_brand_color: str = "#0F172A"
    logo_url: Optional[str] = None


class TenantResponse(TenantCreate):
    id: str
    tenant_id: str
    data_isolation_level: str
    active_properties_count: int
    status: str
    created_at: Optional[datetime] = None
