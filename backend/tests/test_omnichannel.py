import pytest
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import db_manager
from app.services.omnichannel_service import OmnichannelService


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]
    yield
    mock_client.close()


@pytest.mark.anyio
async def test_inbound_message_classification_and_dispatch():
    # 1. Ingest Housekeeping request via WhatsApp
    msg_payload = {
        "channel": "WHATSAPP",
        "guest_name": "Eleanor Vance",
        "guest_phone": "+44 7911 123456",
        "room_number": "502",
        "message_text": "Please bring 2 extra towels and hypoallergenic pillows to room 502.",
    }
    msg = await OmnichannelService.process_inbound_message(msg_payload)
    assert msg["detected_intent"] == "HOUSEKEEPING_REQUEST"
    assert msg["assigned_department"] == "HOUSEKEEPING"
    assert msg["status"] == "DISPATCHED_TO_STAFF"
    assert "housekeeping team has received" in msg["ai_automated_reply"]

    # 2. Ingest Maintenance alert via SMS
    msg_payload2 = {
        "channel": "SMS",
        "guest_name": "Marcus Vance",
        "guest_phone": "+1 415-555-0199",
        "room_number": "304",
        "message_text": "The air conditioning unit is making a loud rattling sound and leaking water.",
    }
    msg2 = await OmnichannelService.process_inbound_message(msg_payload2)
    assert msg2["detected_intent"] == "MAINTENANCE_ALERT"
    assert msg2["priority"] == "HIGH"
    assert msg2["assigned_department"] == "MAINTENANCE"

    # 3. Staff resolves message
    resolved = await OmnichannelService.resolve_message(
        msg_id=msg["id"],
        staff_name="Floor Supervisor Anna",
        notes="Delivered pillows and towels directly to guest.",
    )
    assert resolved["status"] == "STAFF_RESOLVED"
    assert resolved["assigned_staff"] == "Floor Supervisor Anna"


@pytest.mark.anyio
async def test_post_stay_survey_and_service_recovery():
    # 1. Promoter survey (NPS 10)
    surv1 = await OmnichannelService.submit_survey({
        "reservation_id": "RES-TEST-100",
        "guest_name": "Julian Mercer",
        "guest_email": "julian@example.com",
        "nps_score": 10,
        "csat_score": 5,
        "comments": "Flawless stay and magnificent view!",
    })
    assert surv1["sentiment_category"] == "PROMOTER"
    assert surv1["service_recovery_ticket_id"] is None

    # 2. Detractor survey (NPS 4) -> Triggers automatic Service Recovery Ticket
    surv2 = await OmnichannelService.submit_survey({
        "reservation_id": "RES-TEST-200",
        "guest_name": "Angry Traveler",
        "guest_email": "angry@example.com",
        "nps_score": 4,
        "csat_score": 2,
        "comments": "Hot water was unavailable on Friday morning.",
    })
    assert surv2["sentiment_category"] == "DETRACTOR"
    assert surv2["service_recovery_ticket_id"] is not None
    assert surv2["service_recovery_ticket_id"].startswith("RECOV-")

    # 3. Summary analytics
    summary = await OmnichannelService.get_survey_sentiment_summary()
    assert summary["total_surveys"] >= 2
    assert summary["active_recovery_tickets_count"] >= 1
    assert summary["average_csat"] > 0


@pytest.mark.anyio
async def test_housekeeping_schedule_optimization():
    res = OmnichannelService.optimize_housekeeping_schedule(property_id="prop_luxury_01")
    assert res["total_rooms_scheduled"] == 5
    assert res["high_priority_vip_rooms"] >= 2

    # VIP Diamond Suite (Penthouse or Spa Suite) must be ranked highest (#1)
    first_task = res["schedule"][0]
    assert first_task["priority_rank"] == 1
    assert first_task["guest_loyalty_tier"] == "DIAMOND"
    assert "VIP" in first_task["priority_reason"]
