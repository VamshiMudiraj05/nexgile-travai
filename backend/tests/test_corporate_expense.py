import pytest
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import db_manager
from app.services.corporate_expense_service import CorporateExpenseService


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]
    yield
    mock_client.close()


@pytest.mark.anyio
async def test_policy_compliance_check():
    # 1. Compliant booking
    comp1 = await CorporateExpenseService.check_compliance({
        "company_id": "COMP-TEST",
        "hotel_rate_per_night": 240.0,
        "daily_meal_estimate": 65.0,
        "flight_duration_hours": 3.0,
        "flight_cabin": "ECONOMY",
        "days_in_advance": 14,
        "total_cost": 850.0,
        "destination": "London",
    })
    assert comp1["is_compliant"] is True
    assert len(comp1["violations"]) == 0
    assert comp1["requires_approval"] is False

    # 2. Out-of-policy booking (expensive hotel + short flight business class)
    comp2 = await CorporateExpenseService.check_compliance({
        "company_id": "COMP-TEST",
        "hotel_rate_per_night": 450.0,
        "flight_duration_hours": 2.5,
        "flight_cabin": "BUSINESS",
        "days_in_advance": 3,
        "total_cost": 2100.0,
        "destination": "Paris",
    })
    assert comp2["is_compliant"] is False
    assert len(comp2["violations"]) >= 2
    assert comp2["requires_approval"] is True


@pytest.mark.anyio
async def test_travel_approval_lifecycle():
    # 1. Submit approval request
    payload = {
        "company_id": "COMP-TEST",
        "employee_id": "EMP-3001",
        "employee_name": "Julian Mercer",
        "employee_email": "julian@enterprise.com",
        "department": "Corporate Strategy",
        "destination": "Singapore",
        "departure_date": "2026-12-12",
        "return_date": "2026-12-18",
        "estimated_total": 4200.0,
        "hotel_rate_per_night": 380.0,
        "flight_duration_hours": 14.0,
        "flight_cabin": "BUSINESS",
        "business_justification": "APAC Strategic Joint Venture Finalization",
    }
    req = await CorporateExpenseService.submit_approval_request(payload)
    assert req["request_number"].startswith("REQ-")
    assert req["status"] == "PENDING_APPROVAL"
    assert req["is_in_policy"] is False

    # 2. List approvals
    approvals = await CorporateExpenseService.list_approvals(company_id="COMP-TEST")
    assert len(approvals) >= 1

    # 3. Approve request
    action_res = await CorporateExpenseService.take_approval_action(
        req_id=req["id"],
        action="APPROVE",
        approver_name="EVP Strategy",
        comments="Approved due to critical $10M APAC revenue impact.",
    )
    assert action_res["status"] == "APPROVED"
    assert action_res["approver_name"] == "EVP Strategy"
    assert action_res["reviewed_at"] is not None


@pytest.mark.anyio
async def test_ocr_receipt_simulation():
    res = CorporateExpenseService.simulate_receipt_ocr("hotel_folio_geneva.jpg")
    assert res["category"] == "HOTEL"
    assert res["merchant_name"] == "The Grand Savoy Resort & Spa"
    assert res["total_amount"] > 0
    assert res["vat_amount"] > 0
    assert res["confidence_score"] > 0.95
    assert res["suggested_line_item"]["merchant"] == "The Grand Savoy Resort & Spa"


@pytest.mark.anyio
async def test_expense_report_lifecycle_and_vat():
    # 1. Create digitized report
    report_data = {
        "company_id": "COMP-TEST",
        "employee_id": "EMP-4001",
        "employee_name": "Claire Redfield",
        "title": "North America Sales Roadshow",
        "department": "Commercial",
        "cost_center": "CC-900",
        "period": "November 2026",
        "line_items": [
            {
                "item_id": "ITEM-1",
                "date": "2026-11-20",
                "category": "HOTEL",
                "merchant": "Nexgile Estate New York",
                "description": "2 Nights Stay",
                "amount": 560.0,
                "vat_amount": 67.20,
            },
            {
                "item_id": "ITEM-2",
                "date": "2026-11-21",
                "category": "MEALS",
                "merchant": "Bistro 52",
                "description": "Client Catering",
                "amount": 140.0,
                "vat_amount": 16.80,
            },
        ],
    }
    rep = await CorporateExpenseService.create_expense_report(report_data)
    assert rep["report_number"].startswith("EXP-")
    assert rep["total_amount"] == 700.0
    assert rep["vat_amount"] == 84.0
    assert rep["subtotal"] == 616.0
    assert rep["status"] == "SUBMITTED"

    # 2. Update status to APPROVED
    updated = await CorporateExpenseService.update_report_status(rep["id"], "APPROVED")
    assert updated["status"] == "APPROVED"

    # 3. VAT recovery summary
    vat_summary = await CorporateExpenseService.get_vat_recovery_summary(company_id="COMP-TEST")
    assert vat_summary["total_expense"] >= 700.0
    assert vat_summary["total_reclaimable_vat"] >= 84.0
    assert "HOTEL" in vat_summary["by_category"]


@pytest.mark.anyio
async def test_duty_of_care_sentinel():
    # 1. List deployed travelers
    travelers = await CorporateExpenseService.list_travelers()
    assert len(travelers) >= 3
    first = travelers[0]
    assert "employee_name" in first
    assert "current_city" in first
    assert "safety_status" in first

    # 2. Dispatch emergency broadcast
    alert = await CorporateExpenseService.send_broadcast_alert({
        "severity": "CRITICAL",
        "target_city": "London",
        "subject": "Severe Winter Storm Alert",
        "message": "Stay indoors at hotel. Ground transportation suspended.",
    })
    assert alert["status"] == "DISPATCHED"
    assert alert["recipients_count"] >= 1
