import pytest
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import db_manager
from app.services.superapp_service import SuperAppService


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]
    yield
    mock_client.close()


@pytest.mark.anyio
async def test_digital_wallet_lifecycle():
    user_id = "user_traveler_vip_99"

    # 1. Fetch or initialize wallet
    w = await SuperAppService.get_or_create_wallet(user_id=user_id)
    assert w["user_id"] == user_id
    assert w["cash_balance"] >= 250.0
    assert w["loyalty_points"] >= 15000

    # 2. Top-up cash balance
    updated_w = await SuperAppService.top_up_wallet(user_id=user_id, amount=100.0, method="APPLE_PAY")
    assert updated_w["cash_balance"] == w["cash_balance"] + 100.0
    assert len(updated_w["transactions"]) >= 2
    assert updated_w["transactions"][0]["tx_type"] == "TOP_UP"

    # 3. Convert points to stored cash ($0.01 per point)
    points_to_convert = 5000  # $50.00 cash
    converted_w = await SuperAppService.convert_points_to_cash(user_id=user_id, points=points_to_convert)
    assert converted_w["cash_balance"] == updated_w["cash_balance"] + 50.0
    assert converted_w["loyalty_points"] == updated_w["loyalty_points"] - 5000


@pytest.mark.anyio
async def test_travel_vault_and_nfc_key():
    user_id = "user_vault_test"

    # 1. Retrieve initial seeded documents
    docs = await SuperAppService.get_vault_documents(user_id=user_id)
    assert len(docs) >= 3
    doc_types = [d["doc_type"] for d in docs]
    assert "PASSPORT" in doc_types
    assert "VISA" in doc_types
    assert "DIGITAL_ROOM_KEY" in doc_types

    # Verify BLE key
    key_doc = next(d for d in docs if d["doc_type"] == "DIGITAL_ROOM_KEY")
    assert key_doc["nfc_ble_token"].startswith("BLE-")

    # 2. Add new boarding pass
    new_doc = await SuperAppService.add_vault_document(
        user_id=user_id,
        doc_data={
            "doc_type": "BOARDING_PASS",
            "title": "British Airways BA-178 JFK -> LHR",
            "holder_name": "Eleanor Vance",
            "document_number": "BA-9921448",
            "expiry_date": "2026-12-15",
            "barcode_payload": "M1VANCE/ELEANOR BA178 345Y012A0023",
        },
    )
    assert new_doc["doc_type"] == "BOARDING_PASS"
    assert new_doc["document_number_masked"].endswith("1448")


@pytest.mark.anyio
async def test_multilingual_i18n():
    langs = SuperAppService.get_supported_languages()
    assert len(langs) >= 12
    codes = [l["code"] for l in langs]
    assert "en" in codes
    assert "es" in codes
    assert "fr" in codes
    assert "de" in codes
    assert "ja" in codes
    assert "ar" in codes

    # Translation check
    es_dict = SuperAppService.get_translations("es")
    assert es_dict["locale"] == "es"
    assert "Bienvenido" in es_dict["translations"]["welcome"]
    assert es_dict["currency_symbol"] == "€"


@pytest.mark.anyio
async def test_enterprise_multi_tenancy():
    # 1. List existing tenants
    tenants = await SuperAppService.list_tenants()
    assert len(tenants) >= 2
    assert any("Savoy" in t["organization_name"] for t in tenants)

    # 2. Provision new tenant
    new_t = await SuperAppService.create_tenant({
        "organization_name": "Alpine Crest Luxury Chalets",
        "subdomain": "alpinecrest",
        "primary_brand_color": "#059669",
        "secondary_brand_color": "#064E3B",
    })
    assert new_t["tenant_id"].startswith("TENANT-")
    assert "alpinecrest.nexgile.com" in new_t["subdomain"]
    assert new_t["status"] == "ACTIVE"
