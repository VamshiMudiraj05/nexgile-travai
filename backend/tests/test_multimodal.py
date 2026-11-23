import pytest
from mongomock_motor import AsyncMongoMockClient

from app.database.mongodb import db_manager
from app.services.multimodal_service import MultimodalService


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]
    yield
    mock_client.close()


@pytest.mark.anyio
async def test_search_flights():
    res = MultimodalService.search_flights(origin="JFK", destination="LHR", departure_date="2026-12-15")
    assert res["origin"] == "JFK"
    assert res["destination"] == "LHR"
    assert res["total_found"] >= 4
    first = res["flights"][0]
    assert "airline" in first
    assert "price" in first
    assert first["seats_remaining"] > 0


@pytest.mark.anyio
async def test_search_cars():
    res = MultimodalService.search_cars(location="San Francisco", pickup_date="2026-12-01", return_date="2026-12-04")
    assert res["location"] == "San Francisco"
    assert res["total_found"] >= 3
    assert res["cars"][0]["daily_rate"] > 0


@pytest.mark.anyio
async def test_search_activities():
    res = MultimodalService.search_activities(destination="Tokyo", date="2026-12-10")
    assert res["destination"] == "Tokyo"
    assert res["total_found"] >= 3
    assert res["activities"][0]["price_per_person"] > 0


@pytest.mark.anyio
async def test_search_packages():
    res = MultimodalService.search_packages(destination="Cancun")
    assert res["destination"] == "Cancun"
    assert res["total_found"] >= 1
    pkg = res["packages"][0]
    assert pkg["savings_amount"] > 0
    assert pkg["package_price"] < pkg["original_total"]


@pytest.mark.anyio
async def test_unified_cart_lifecycle():
    user_id = "test_traveler_001"

    # 1. Get or create empty cart
    cart = await MultimodalService.get_or_create_cart(user_id=user_id)
    assert cart["user_id"] == user_id
    assert len(cart["items"]) == 0
    assert cart["status"] == "ACTIVE"

    # 2. Add Flight item
    flight_item = {
        "product_type": "FLIGHT",
        "title": "British Airways BA-178 (JFK -> LHR)",
        "subtitle": "Economy Class, 1 Stop",
        "dates": "2026-12-15",
        "quantity": 2,
        "unit_price": 650.0,
        "details": {"airline": "British Airways", "flight_number": "BA-178"},
    }
    updated_cart = await MultimodalService.add_to_cart(user_id=user_id, item_data=flight_item)
    assert len(updated_cart["items"]) == 1
    assert updated_cart["subtotal"] == 1300.0

    # 3. Add Hotel item
    hotel_item = {
        "product_type": "HOTEL",
        "title": "The Grand Savoy London - Executive Suite",
        "subtitle": "Complimentary Breakfast & Butler Service",
        "dates": "2026-12-15 to 2026-12-18",
        "quantity": 1,
        "unit_price": 450.0,
        "details": {"nights": 3},
    }
    updated_cart2 = await MultimodalService.add_to_cart(user_id=user_id, item_data=hotel_item)
    assert len(updated_cart2["items"]) == 2
    assert updated_cart2["subtotal"] == 1750.0

    # 4. Hold Cart (Price Freeze)
    hold_res = await MultimodalService.hold_cart_price(user_id=user_id)
    assert hold_res["status"] == "HELD"
    assert hold_res["price_locked_amount"] == updated_cart2["total_amount"]
    assert hold_res["hold_expires_at"] is not None

    # 5. Apply Promo Code
    promo_res = await MultimodalService.apply_promo_code(user_id=user_id, promo_code="TRAVAI20")
    assert promo_res["is_valid"] is True
    assert promo_res["discount_amount"] > 0

    # 6. Checkout
    checkout_data = {
        "traveler_name": "Eleanor Vance",
        "traveler_email": "eleanor@example.com",
        "payment_method": "CORPORATE_CARD",
    }
    checkout_res = await MultimodalService.checkout(user_id=user_id, checkout_data=checkout_data)
    assert checkout_res["status"] == "CONFIRMED"
    assert checkout_res["items_booked"] == 2
    assert len(checkout_res["vouchers"]) == 2
    assert checkout_res["master_booking_reference"].startswith("PNR-")

    # 7. Voucher lookup
    v_code = checkout_res["vouchers"][0]["voucher_code"]
    v_doc = await MultimodalService.get_voucher(v_code)
    assert v_doc["voucher_code"] == v_code
    assert v_doc["traveler_name"] == "Eleanor Vance"

    # 8. Disruption resolution
    disr_res = MultimodalService.resolve_disruption(
        booking_reference=checkout_res["master_booking_reference"],
        product_type="FLIGHT",
        disruption_type="FLIGHT_CANCELLED",
    )
    assert disr_res["resolution_status"] == "REBOOKED"
    assert disr_res["compensation_credit"] == 150.0
    assert "Delta" in disr_res["rebooked_alternative"]
