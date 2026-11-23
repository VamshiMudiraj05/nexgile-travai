import pytest
from mongomock_motor import AsyncMongoMockClient
from app.database.mongodb import db_manager
from app.services.corporate_service import CorporateService


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]
    yield
    mock_client.close()


@pytest.mark.anyio
async def test_corporate_account_verification():
    # 1. Initially auto-seeds sample accounts
    accounts = await CorporateService.list_corporate_accounts()
    assert len(accounts) >= 3
    codes = [a["corporate_code"] for a in accounts]
    assert "CORP-GOOG" in codes

    # 2. Verify Google code
    res = await CorporateService.verify_corporate_code("CORP-GOOG")
    assert res["is_valid"] is True
    assert res["company_name"] == "Google LLC"
    assert res["contracted_discount_pct"] == 20.0

    # 3. Invalid code
    res_inv = await CorporateService.verify_corporate_code("CORP-UNKNOWN")
    assert res_inv["is_valid"] is False
    assert res_inv["contracted_discount_pct"] == 0.0


@pytest.mark.anyio
async def test_group_block_lifecycle_and_pickup():
    # Create group block
    block_payload = {
        "property_id": "prop_test_1",
        "group_name": "Executive Retreat 2026",
        "group_code": "GRP-EXEC-26",
        "check_in_date": "2026-12-01",
        "check_out_date": "2026-12-05",
        "cutoff_date": "2026-11-20",
        "room_type_id": "rt_123",
        "total_rooms_blocked": 10,
        "agreed_rate": 195.0,
        "coordinator_name": "Jane Smith",
        "coordinator_email": "jane@smith.com",
    }

    block = await CorporateService.create_group_block(block_payload)
    assert block["group_code"] == "GRP-EXEC-26"
    assert block["total_rooms_blocked"] == 10
    assert block["rooms_picked_up"] == 0
    assert block["rooms_remaining"] == 10

    # Pickup 2 rooms
    await CorporateService.record_pickup("GRP-EXEC-26")
    await CorporateService.record_pickup("GRP-EXEC-26")

    updated = await CorporateService.get_group_block(block["id"])
    assert updated["rooms_picked_up"] == 2
    assert updated["rooms_remaining"] == 8

    # Release remaining rooms upon cutoff
    released = await CorporateService.release_unpicked_rooms(block["id"])
    assert released["status"] == "RELEASED"
    assert released["total_rooms_blocked"] == 2
    assert released["rooms_remaining"] == 0
