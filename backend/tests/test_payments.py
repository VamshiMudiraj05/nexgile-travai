import pytest
import pytest_asyncio
import time
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database


@pytest_asyncio.fixture(autouse=True)
async def db_lifecycle():
    await connect_to_mongo()
    yield
    await close_mongo_connection()


@pytest.mark.asyncio
async def test_payment_config_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/payments/config")
        assert resp.status_code == 200
        data = resp.json()
        assert "paypal_client_id" in data
        assert "paypal_mode" in data
        assert data["paypal_mode"] in ["sandbox", "live"]


@pytest.mark.asyncio
async def test_paypal_create_and_capture_order_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register and log in a traveler
        traveler_email = f"pay_traveler_{int(time.time() * 1000)}@example.com"
        await client.post("/api/v1/auth/register", json={
            "name": "Payment Tester",
            "email": traveler_email,
            "password": "Password123!",
            "role": "TRAVELER"
        })
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": traveler_email,
            "password": "Password123!"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create PayPal Order
        order_resp = await client.post(
            "/api/v1/payments/paypal/create-order",
            headers=headers,
            json={
                "amount": 15000.0,
                "currency": "INR",
                "description": "Test PayPal Hotel Booking",
                "reservation_id": "65a000000000000000000099"
            }
        )
        assert order_resp.status_code == 200
        order_data = order_resp.json()
        assert "order_id" in order_data
        assert order_data["status"] == "CREATED"
        assert "approval_url" in order_data
        order_id = order_data["order_id"]

        # 2. Capture PayPal Order
        capture_resp = await client.post(
            "/api/v1/payments/paypal/capture-order",
            headers=headers,
            json={
                "order_id": order_id,
                "reservation_id": "65a000000000000000000099"
            }
        )
        assert capture_resp.status_code == 200
        capture_data = capture_resp.json()
        assert capture_data["success"] is True
        assert capture_data["status"] == "COMPLETED"
        assert capture_data["order_id"] == order_id
        assert "capture_id" in capture_data
