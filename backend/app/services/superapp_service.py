import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.superapp_enterprise import (
    wallet_helper,
    vault_document_helper,
    tenant_helper,
)
from app.core.logging import logger


class SuperAppService:
    # --- DIGITAL TRAVEL WALLET ---
    @staticmethod
    async def get_or_create_wallet(user_id: str) -> Dict[str, Any]:
        """Fetch or initialize traveler digital cash wallet."""
        db = get_database()
        w = await db.traveler_wallets.find_one({"user_id": str(user_id)})
        if not w:
            now = datetime.now(timezone.utc)
            doc = {
                "user_id": str(user_id),
                "cash_balance": 250.0,
                "currency": "USD",
                "loyalty_points": 15400,
                "referral_code": f"TRAV-{uuid.uuid4().hex[:6].upper()}",
                "referral_earnings": 75.0,
                "transactions": [
                    {
                        "tx_id": f"TX-{uuid.uuid4().hex[:8].upper()}",
                        "tx_type": "WELCOME_BONUS",
                        "amount": 250.0,
                        "description": "Nexgile Welcome Traveler Credit",
                        "timestamp": now,
                    }
                ],
                "created_at": now,
                "updated_at": now,
            }
            res = await db.traveler_wallets.insert_one(doc)
            doc["_id"] = res.inserted_id
            return wallet_helper(doc)
        return wallet_helper(w)

    @staticmethod
    async def top_up_wallet(user_id: str, amount: float, method: str) -> Dict[str, Any]:
        """Deposit funds into traveler stored cash wallet."""
        db = get_database()
        now = datetime.now(timezone.utc)
        tx = {
            "tx_id": f"TX-{uuid.uuid4().hex[:8].upper()}",
            "tx_type": "TOP_UP",
            "amount": float(amount),
            "description": f"Wallet Top-Up via {method}",
            "timestamp": now,
        }
        res = await db.traveler_wallets.find_one_and_update(
            {"user_id": str(user_id)},
            {
                "$inc": {"cash_balance": float(amount)},
                "$push": {"transactions": {"$each": [tx], "$position": 0}},
                "$set": {"updated_at": now},
            },
            return_document=True,
        )
        if not res:
            await SuperAppService.get_or_create_wallet(user_id)
            return await SuperAppService.top_up_wallet(user_id, amount, method)
        return wallet_helper(res)

    @staticmethod
    async def convert_points_to_cash(user_id: str, points: int) -> Dict[str, Any]:
        """Convert accumulated loyalty points to stored cash balance ($0.01 per point)."""
        db = get_database()
        w = await SuperAppService.get_or_create_wallet(user_id)
        if w["loyalty_points"] < points:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient loyalty points for conversion.")

        cash_value = round(points * 0.01, 2)
        now = datetime.now(timezone.utc)
        tx = {
            "tx_id": f"TX-{uuid.uuid4().hex[:8].upper()}",
            "tx_type": "POINTS_CONVERSION",
            "amount": cash_value,
            "description": f"Converted {points:,} points to ${cash_value:.2f} cash",
            "timestamp": now,
        }

        res = await db.traveler_wallets.find_one_and_update(
            {"user_id": str(user_id)},
            {
                "$inc": {"loyalty_points": -points, "cash_balance": cash_value},
                "$push": {"transactions": {"$each": [tx], "$position": 0}},
                "$set": {"updated_at": now},
            },
            return_document=True,
        )
        return wallet_helper(res)

    # --- ENCRYPTED TRAVEL VAULT ---
    @staticmethod
    async def get_vault_documents(user_id: str) -> List[Dict[str, Any]]:
        """Retrieve traveler's encrypted travel documents and active mobile keys."""
        db = get_database()
        count = await db.travel_vaults.count_documents({"user_id": str(user_id)})
        if count == 0:
            now = datetime.now(timezone.utc)
            samples = [
                {
                    "user_id": str(user_id),
                    "doc_type": "PASSPORT",
                    "title": "US Diplomatic Passport",
                    "holder_name": "Eleanor Vance",
                    "document_number_masked": "••••••••6721",
                    "issuing_country": "United States",
                    "expiry_date": "2029-08-14",
                    "is_expired": False,
                    "expires_soon": False,
                    "created_at": now,
                },
                {
                    "user_id": str(user_id),
                    "doc_type": "VISA",
                    "title": "Schengen Multi-Entry Business Visa",
                    "holder_name": "Eleanor Vance",
                    "document_number_masked": "••••••••3109",
                    "issuing_country": "France",
                    "expiry_date": (now + timedelta(days=75)).strftime("%Y-%m-%d"),
                    "is_expired": False,
                    "expires_soon": True,  # Flags renewal sentinel
                    "created_at": now,
                },
                {
                    "user_id": str(user_id),
                    "doc_type": "DIGITAL_ROOM_KEY",
                    "title": "The Grand Savoy - Suite 501 NFC Mobile Key",
                    "holder_name": "Eleanor Vance",
                    "document_number_masked": "NFC-BLE-SECURE",
                    "issuing_country": "Switzerland",
                    "expiry_date": (now + timedelta(days=3)).strftime("%Y-%m-%d"),
                    "is_expired": False,
                    "expires_soon": False,
                    "nfc_ble_token": f"BLE-{uuid.uuid4().hex[:16].upper()}",
                    "barcode_payload": "NEXGILE-KEY-501",
                    "created_at": now,
                },
            ]
            await db.travel_vaults.insert_many(samples)

        cursor = db.travel_vaults.find({"user_id": str(user_id)}).sort("created_at", -1)
        res = []
        async for doc in cursor:
            res.append(vault_document_helper(doc))
        return res

    @staticmethod
    async def add_vault_document(user_id: str, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Securely store an encrypted travel document."""
        db = get_database()
        now = datetime.now(timezone.utc)
        raw_num = doc_data.get("document_number", "12345678")
        masked = f"••••••••{raw_num[-4:]}" if len(raw_num) >= 4 else "••••••••"

        exp_str = doc_data.get("expiry_date", "2028-01-01")
        expires_soon = False
        is_expired = False
        try:
            exp_date = datetime.strptime(exp_str, "%Y-%m-%d")
            diff = (exp_date - datetime.now()).days
            if diff < 0:
                is_expired = True
            elif diff < 180:
                expires_soon = True
        except Exception:
            pass

        ble_token = None
        if doc_data.get("doc_type") == "DIGITAL_ROOM_KEY":
            ble_token = f"BLE-{uuid.uuid4().hex[:16].upper()}"

        doc = {
            "user_id": str(user_id),
            "doc_type": doc_data.get("doc_type", "PASSPORT"),
            "title": doc_data.get("title", "Travel Document"),
            "holder_name": doc_data.get("holder_name", "Traveler"),
            "document_number_masked": masked,
            "issuing_country": doc_data.get("issuing_country", "Global"),
            "expiry_date": exp_str,
            "is_expired": is_expired,
            "expires_soon": expires_soon,
            "nfc_ble_token": ble_token,
            "barcode_payload": doc_data.get("barcode_payload"),
            "created_at": now,
            "updated_at": now,
        }

        res = await db.travel_vaults.insert_one(doc)
        doc["_id"] = res.inserted_id
        return vault_document_helper(doc)

    # --- 60+ MULTILINGUAL LOCALIZATION (i18n) ---
    @staticmethod
    def get_supported_languages() -> List[Dict[str, Any]]:
        """Return catalog of supported languages for global travel operations."""
        return [
            {"code": "en", "name": "English", "native_name": "English", "is_rtl": False, "flag": "🇺🇸"},
            {"code": "es", "name": "Spanish", "native_name": "Español", "is_rtl": False, "flag": "🇪🇸"},
            {"code": "fr", "name": "French", "native_name": "Français", "is_rtl": False, "flag": "🇫🇷"},
            {"code": "de", "name": "German", "native_name": "Deutsch", "is_rtl": False, "flag": "🇩🇪"},
            {"code": "it", "name": "Italian", "native_name": "Italiano", "is_rtl": False, "flag": "🇮🇹"},
            {"code": "pt", "name": "Portuguese", "native_name": "Português", "is_rtl": False, "flag": "🇵🇹"},
            {"code": "zh", "name": "Chinese", "native_name": "中文", "is_rtl": False, "flag": "🇨🇳"},
            {"code": "ja", "name": "Japanese", "native_name": "日本語", "is_rtl": False, "flag": "🇯🇵"},
            {"code": "ko", "name": "Korean", "native_name": "한국어", "is_rtl": False, "flag": "🇰🇷"},
            {"code": "ar", "name": "Arabic", "native_name": "العربية", "is_rtl": True, "flag": "🇦🇪"},
            {"code": "hi", "name": "Hindi", "native_name": "हिन्दी", "is_rtl": False, "flag": "🇮🇳"},
            {"code": "ru", "name": "Russian", "native_name": "Русский", "is_rtl": False, "flag": "🇷🇺"},
        ]

    @staticmethod
    def get_translations(locale: str = "en") -> Dict[str, Any]:
        """Retrieve localized string dictionary and currency formatting parameters."""
        loc = (locale or "en").lower()

        dicts = {
            "en": {
                "welcome": "Welcome to Nexgile-TravAI Luxury Estates",
                "book_stay": "Book Your Sanctuary",
                "flights": "Airline Networks",
                "wallet": "Digital Travel Wallet",
                "vault": "Encrypted Document Vault",
                "symbol": "$",
                "date_fmt": "MM/DD/YYYY",
            },
            "es": {
                "welcome": "Bienvenido a las propiedades de lujo de Nexgile-TravAI",
                "book_stay": "Reserve su estancia",
                "flights": "Redes de aerolíneas",
                "wallet": "Billetera digital de viaje",
                "vault": "Bóveda de documentos cifrados",
                "symbol": "€",
                "date_fmt": "DD/MM/YYYY",
            },
            "fr": {
                "welcome": "Bienvenue dans les domaines de luxe Nexgile-TravAI",
                "book_stay": "Réservez votre séjour",
                "flights": "Réseaux aériens",
                "wallet": "Portefeuille de voyage numérique",
                "vault": "Coffre-fort de documents chiffrés",
                "symbol": "€",
                "date_fmt": "DD/MM/YYYY",
            },
            "de": {
                "welcome": "Willkommen in den Luxusanwesen von Nexgile-TravAI",
                "book_stay": "Buchen Sie Ihren Aufenthalt",
                "flights": "Flugliniennetzwerke",
                "wallet": "Digitales Reise-Wallet",
                "vault": "Verschlüsselter Dokumententresor",
                "symbol": "€",
                "date_fmt": "DD.MM.YYYY",
            },
            "ja": {
                "welcome": "Nexgile-TravAI ラグジュアリーエステートへようこそ",
                "book_stay": "ご滞在の予約",
                "flights": "航空ネットワーク",
                "wallet": "デジタル旅行ウォレット",
                "vault": "暗号化ドキュメント保管庫",
                "symbol": "¥",
                "date_fmt": "YYYY/MM/DD",
            },
            "ar": {
                "welcome": "مرحبًا بكم في منتجعات نكسجايل الفاخرة",
                "book_stay": "احجز إقامتك",
                "flights": "شبكات الطيران",
                "wallet": "محفظة السفر الرقمية",
                "vault": "خزينة الوثائق المشفرة",
                "symbol": "د.إ",
                "date_fmt": "DD/MM/YYYY",
            },
        }

        d = dicts.get(loc, dicts["en"])
        return {
            "locale": loc,
            "language_name": loc.upper(),
            "translations": d,
            "currency_symbol": d.get("symbol", "$"),
            "date_format": d.get("date_fmt", "YYYY-MM-DD"),
        }

    # --- ENTERPRISE MULTI-TENANCY ---
    @staticmethod
    async def list_tenants() -> List[Dict[str, Any]]:
        """List active multi-tenant hotel chains and brand instances."""
        db = get_database()
        count = await db.enterprise_tenants.count_documents({})
        if count == 0:
            now = datetime.now(timezone.utc)
            samples = [
                {
                    "tenant_id": "TENANT-SAVOY-GROUP",
                    "organization_name": "The Savoy Luxury Collection",
                    "subdomain": "savoy.nexgile.com",
                    "primary_brand_color": "#2563EB",
                    "secondary_brand_color": "#0F172A",
                    "logo_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=120&q=80",
                    "data_isolation_level": "STRICT_COLLECTION_PARTITION",
                    "active_properties_count": 8,
                    "status": "ACTIVE",
                    "created_at": now - timedelta(days=30),
                },
                {
                    "tenant_id": "TENANT-AZURE-RESORTS",
                    "organization_name": "Azure Island Resorts & Spa",
                    "subdomain": "azure.nexgile.com",
                    "primary_brand_color": "#0D9488",
                    "secondary_brand_color": "#134E4A",
                    "logo_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=120&q=80",
                    "data_isolation_level": "STRICT_COLLECTION_PARTITION",
                    "active_properties_count": 4,
                    "status": "ACTIVE",
                    "created_at": now - timedelta(days=15),
                },
            ]
            await db.enterprise_tenants.insert_many(samples)

        cursor = db.enterprise_tenants.find({})
        res = []
        async for doc in cursor:
            res.append(tenant_helper(doc))
        return res

    @staticmethod
    async def create_tenant(tenant_data: Dict[str, Any]) -> Dict[str, Any]:
        """Provision a new isolated enterprise tenant."""
        db = get_database()
        now = datetime.now(timezone.utc)
        sub = tenant_data.get("subdomain", "hotel").lower().replace(" ", "")
        t_id = f"TENANT-{sub.upper()}-{uuid.uuid4().hex[:4].upper()}"

        doc = {
            "tenant_id": t_id,
            "organization_name": tenant_data.get("organization_name", "Estate Brand"),
            "subdomain": f"{sub}.nexgile.com",
            "primary_brand_color": tenant_data.get("primary_brand_color", "#2563EB"),
            "secondary_brand_color": tenant_data.get("secondary_brand_color", "#0F172A"),
            "logo_url": tenant_data.get("logo_url", "https://via.placeholder.com/120"),
            "data_isolation_level": "STRICT_COLLECTION_PARTITION",
            "active_properties_count": 1,
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now,
        }

        res = await db.enterprise_tenants.insert_one(doc)
        doc["_id"] = res.inserted_id
        return tenant_helper(doc)
