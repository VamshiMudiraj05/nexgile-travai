import hashlib
import hmac
import time
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.services.superapp_service import SuperAppService


@pytest_asyncio.fixture(autouse=True)
async def db_lifecycle():
    await connect_to_mongo()
    yield
    await close_mongo_connection()


@pytest.mark.asyncio
async def test_razorpay_config_and_packages():
    """Verify Razorpay public config and server-defined credit packages."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Config
        cfg_resp = await client.get("/api/v1/payments/config")
        assert cfg_resp.status_code == 200
        cfg_data = cfg_resp.json()
        assert cfg_data["currency"] == "INR"
        assert cfg_data["mode"] == "test"
        assert "razorpay_key_id" in cfg_data

        # 2. Credit Packages
        pkg_resp = await client.get("/api/v1/payments/packages")
        assert pkg_resp.status_code == 200
        packages = pkg_resp.json()
        assert len(packages) >= 4
        package_ids = [p["id"] for p in packages]
        assert "pkg_starter" in package_ids
        assert "pkg_silver" in package_ids
        assert "pkg_gold" in package_ids
        assert "pkg_platinum" in package_ids

        # Ensure silver package has expected pricing & credit values
        silver = next(p for p in packages if p["id"] == "pkg_silver")
        assert silver["price_inr"] == 1500.0
        assert silver["total_credits"] == 1650


@pytest.mark.asyncio
async def test_razorpay_wallet_credit_order_and_verification():
    """Test full cycle: select package -> create order -> verify payment -> credit wallet."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register and log in a traveler
        traveler_email = f"razor_traveler_{int(time.time() * 1000)}@example.com"
        await client.post("/api/v1/auth/register", json={
            "name": "Razorpay Tester",
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

        # Check initial wallet balance
        wallet_resp = await client.get("/api/v1/superapp/wallet", headers=headers)
        assert wallet_resp.status_code == 200
        initial_balance = wallet_resp.json()["cash_balance"]

        # 1. Create Razorpay order for 'pkg_silver' (₹1500 for 1650 credits)
        order_resp = await client.post(
            "/api/v1/payments/razorpay/create-order",
            headers=headers,
            json={"package_id": "pkg_silver"}
        )
        assert order_resp.status_code == 200
        order_data = order_resp.json()
        assert "order_id" in order_data
        assert order_data["amount"] == 150000  # 1500 INR in paise
        assert order_data["currency"] == "INR"
        assert order_data["purchased_credits"] == 1650
        order_id = order_data["order_id"]

        # 2. Verify signature and credit wallet
        payment_id = f"pay_test_{int(time.time() * 1000)}"
        msg = f"{order_id}|{payment_id}"
        valid_signature = hmac.new("test_secret".encode(), msg.encode(), hashlib.sha256).hexdigest()

        verify_resp = await client.post(
            "/api/v1/payments/razorpay/verify",
            headers=headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": valid_signature,
                "package_id": "pkg_silver"
            }
        )
        assert verify_resp.status_code == 200
        verify_data = verify_resp.json()
        assert verify_data["success"] is True
        assert verify_data["status"] == "SUCCESSFUL"
        assert verify_data["credits_added"] == 1650
        assert verify_data["wallet_balance"] == initial_balance + 1650

        # Verify wallet directly from wallet API
        updated_wallet = await client.get("/api/v1/superapp/wallet", headers=headers)
        assert updated_wallet.json()["cash_balance"] == initial_balance + 1650

        # 3. IDEMPOTENCY TEST: Submit duplicate verification request with same payment_id
        dup_resp = await client.post(
            "/api/v1/payments/razorpay/verify",
            headers=headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": valid_signature,
                "package_id": "pkg_silver"
            }
        )
        assert dup_resp.status_code == 200
        # Ensure credits were NOT added a second time!
        wallet_after_dup = await client.get("/api/v1/superapp/wallet", headers=headers)
        assert wallet_after_dup.json()["cash_balance"] == initial_balance + 1650


@pytest.mark.asyncio
async def test_razorpay_tampered_signature_rejected():
    """Verify that forged/tampered payment signatures are strictly rejected and no credits added."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        traveler_email = f"tamper_traveler_{int(time.time() * 1000)}@example.com"
        await client.post("/api/v1/auth/register", json={
            "name": "Tamper Tester",
            "email": traveler_email,
            "password": "Password123!",
            "role": "TRAVELER"
        })
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": traveler_email,
            "password": "Password123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create Order
        order_resp = await client.post(
            "/api/v1/payments/razorpay/create-order",
            headers=headers,
            json={"package_id": "pkg_gold"}
        )
        assert order_resp.status_code == 200
        order_id = order_resp.json()["order_id"]

        # Submit bogus signature
        verify_resp = await client.post(
            "/api/v1/payments/razorpay/verify",
            headers=headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": "pay_fake_99999",
                "razorpay_signature": "totally_fabricated_invalid_signature_hash",
                "package_id": "pkg_gold"
            }
        )
        assert verify_resp.status_code == 400
        assert "Invalid Razorpay payment signature" in verify_resp.json()["detail"]


@pytest.mark.asyncio
async def test_razorpay_reservation_checkout_flow():
    """Verify hotel stay reservation payment via Razorpay."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        db = get_database()
        user_email = f"hotel_pay_{int(time.time() * 1000)}@example.com"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "name": "Hotel Guest",
            "email": user_email,
            "password": "Password123!",
            "role": "TRAVELER"
        })
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": user_email,
            "password": "Password123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a mock reservation in DB
        res_doc = {
            "booking_reference": f"NGX-TEST-{int(time.time() * 1000)}",
            "guest_email": user_email,
            "total_amount": 22000.0,
            "payment_status": "PENDING",
            "status": "CONFIRMED"
        }
        ins_res = await db.reservations.insert_one(res_doc)
        res_id = str(ins_res.inserted_id)

        # 1. Create order for reservation
        order_resp = await client.post(
            "/api/v1/payments/razorpay/create-order",
            headers=headers,
            json={"reservation_id": res_id}
        )
        assert order_resp.status_code == 200
        order_data = order_resp.json()
        assert order_data["amount"] == 2200000  # ₹22,000 in paise
        assert order_data["currency"] == "INR"
        order_id = order_data["order_id"]

        # 2. Verify payment
        payment_id = f"pay_hotel_{int(time.time() * 1000)}"
        msg = f"{order_id}|{payment_id}"
        valid_signature = hmac.new("test_secret".encode(), msg.encode(), hashlib.sha256).hexdigest()

        verify_resp = await client.post(
            "/api/v1/payments/razorpay/verify",
            headers=headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": valid_signature,
                "reservation_id": res_id
            }
        )
        assert verify_resp.status_code == 200
        assert verify_resp.json()["success"] is True

        # Verify reservation is marked PAID in database
        updated_res = await db.reservations.find_one({"_id": ins_res.inserted_id})
        assert updated_res["payment_status"] == "PAID"
        assert updated_res["payment_details"]["gateway"] == "RAZORPAY"
        assert updated_res["payment_details"]["razorpay_payment_id"] == payment_id
