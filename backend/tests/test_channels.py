import pytest
from mongomock_motor import AsyncMongoMockClient
from app.database.mongodb import db_manager
from app.services.channel_service import ChannelService


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]
    yield
    mock_client.close()


@pytest.mark.anyio
async def test_channel_listing_and_seeding():
    channels = await ChannelService.list_channels()
    assert len(channels) >= 5
    codes = [c["code"] for c in channels]
    assert "BOOKING_COM" in codes
    assert "EXPEDIA" in codes
    assert "AMADEUS_GDS" in codes
    assert "DIRECT_WEB" in codes


@pytest.mark.anyio
async def test_allotment_allocation_and_stopsell():
    payload = {
        "property_id": "prop_test_100",
        "room_type_id": "rt_test_100",
        "channel_code": "BOOKING_COM",
        "date": "2026-12-15",
        "allocated_rooms": 8,
        "stop_sell": False,
    }

    allotment = await ChannelService.set_allotment(payload)
    assert allotment["channel_code"] == "BOOKING_COM"
    assert allotment["allocated_rooms"] == 8
    assert allotment["available_rooms"] == 8
    assert allotment["stop_sell"] is False

    # Toggle stop sell
    payload["stop_sell"] = True
    updated = await ChannelService.set_allotment(payload)
    assert updated["stop_sell"] is True


@pytest.mark.anyio
async def test_trigger_ari_sync():
    res = await ChannelService.trigger_ari_sync("prop_test_100")
    assert res["status"] == "SUCCESS"
    assert res["channels_synced"] >= 5
    assert res["items_synced"] > 0
    assert res["average_latency_ms"] > 0

    logs = await ChannelService.get_sync_logs(limit=10)
    assert len(logs) > 0
    assert logs[0]["event_type"] == "ARI_PUSH"
    assert logs[0]["status"] == "SUCCESS"


@pytest.mark.anyio
async def test_channel_performance_analytics():
    perf = await ChannelService.get_channel_performance("prop_test_100")
    assert perf["total_gross_revenue"] > 0
    assert perf["total_commission_paid"] > 0
    assert perf["total_net_revenue"] > 0
    assert len(perf["channels"]) >= 5
    # Direct web should have 0% commission
    direct = next(ch for ch in perf["channels"] if ch["channel_code"] == "DIRECT_WEB")
    assert direct["commission_rate"] == 0.0
    assert direct["commission_paid"] == 0.0
