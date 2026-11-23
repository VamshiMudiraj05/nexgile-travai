import pytest
from mongomock_motor import AsyncMongoMockClient
from app.database.mongodb import db_manager
from app.services.rate_plan_service import RatePlanService


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]
    yield
    mock_client.close()


@pytest.mark.anyio
async def test_rate_plan_stay_validation_logic():
    # Mock rate plan directly in service validation
    test_plan = {
        "property_id": "test_prop_1",
        "room_type_id": "",
        "code": "TEST_MIN3",
        "name": "Weekend Minimum Stay",
        "rate_multiplier": 0.90,
        "fixed_adjustment": 10.0,
        "meal_plan": "BED_AND_BREAKFAST",
        "cancellation_policy": "FLEXIBLE_48H",
        "is_active": True,
        "inclusions": [{"name": "Breakfast", "value": 25.0}],
        "restrictions": {
            "min_los": 3,
            "max_los": 10,
            "closed_to_arrival": False,
            "closed_to_departure": False,
            "min_advance_days": 0,
            "max_advance_days": 365,
        }
    }
    
    # Create rate plan
    created = await RatePlanService.create_rate_plan(test_plan)
    plan_id = created["id"]

    try:
        # 1. Test MinLOS violation: 2 nights when minimum is 3
        res_fail = await RatePlanService.validate_stay_and_calculate(
            rate_plan_id=plan_id,
            check_in_str="2026-12-01",
            check_out_str="2026-12-03",
            base_nightly_rate=200.0,
        )
        assert res_fail["is_valid"] is False
        assert any("Minimum length of stay" in v for v in res_fail["violations"])

        # 2. Test valid stay: 3 nights
        res_pass = await RatePlanService.validate_stay_and_calculate(
            rate_plan_id=plan_id,
            check_in_str="2026-12-01",
            check_out_str="2026-12-04",
            base_nightly_rate=200.0,
        )
        assert res_pass["is_valid"] is True
        assert len(res_pass["violations"]) == 0
        assert res_pass["nights"] == 3
        # Nightly rate: (200 * 0.90) + 10 = 190.0
        assert res_pass["calculated_nightly_rate"] == 190.0
        assert res_pass["total_estimated_amount"] == 570.0
        # Inclusions: 25 * 3 nights = 75.0
        assert res_pass["inclusions_value"] == 75.0

    finally:
        await RatePlanService.delete_rate_plan(plan_id)
