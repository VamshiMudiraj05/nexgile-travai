import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import date, timedelta
from app.main import app
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database


@pytest_asyncio.fixture(autouse=True)
async def db_lifecycle():
    await connect_to_mongo()
    yield
    await close_mongo_connection()


@pytest.mark.asyncio
async def test_analytics_and_bi_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register and login admin
        admin_email = f"admin_bi_{date.today().strftime('%s')}@example.com"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "name": "BI Admin",
            "email": admin_email,
            "password": "Password123!",
            "role": "ADMIN"
        })
        assert reg_resp.status_code in [201, 400]
        
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": admin_email,
            "password": "Password123!"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Dashboard Overview
        dash_resp = await client.get("/api/v1/dashboard/overview", headers=headers)
        assert dash_resp.status_code == 200
        dash_data = dash_resp.json()
        assert "total_properties" in dash_data
        assert "total_rooms" in dash_data
        assert "occupancy_rate" in dash_data
        assert "revenue_chart" in dash_data
        assert "recent_reservations" in dash_data

        # 2. Revenue Analytics
        rev_resp = await client.get("/api/v1/analytics/revenue", headers=headers)
        assert rev_resp.status_code == 200
        rev_data = rev_resp.json()
        assert "total_revenue" in rev_data
        assert "adr" in rev_data
        assert "revpar" in rev_data
        assert "revenue_by_property" in rev_data

        # 3. Occupancy Analytics
        occ_resp = await client.get("/api/v1/analytics/occupancy", headers=headers)
        assert occ_resp.status_code == 200
        occ_data = occ_resp.json()
        assert "summary" in occ_data
        assert "trend" in occ_data
        assert "average" in occ_data["summary"]

        # 4. Booking Analytics
        book_resp = await client.get("/api/v1/analytics/bookings", headers=headers)
        assert book_resp.status_code == 200
        book_data = book_resp.json()
        assert "total_bookings" in book_data
        assert "bookings_by_source" in book_data

        # 5. Forecast Analytics
        fc_resp = await client.get("/api/v1/analytics/forecast?horizon=7", headers=headers)
        assert fc_resp.status_code == 200
        fc_data = fc_resp.json()
        assert "forecast" in fc_data
        assert len(fc_data["forecast"]) == 7

        # 6. Rate Recommendations
        rec_resp = await client.get("/api/v1/revenue/recommendations", headers=headers)
        assert rec_resp.status_code == 200
        recs = rec_resp.json()
        assert isinstance(recs, list)


@pytest.mark.asyncio
async def test_traveler_marketplace_and_booking_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register and login traveler
        traveler_email = f"traveler_{date.today().strftime('%s')}@example.com"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "name": "Sarah Jenkins",
            "email": traveler_email,
            "password": "Password123!",
            "role": "TRAVELER"
        })
        assert reg_resp.status_code in [201, 400]
        
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": traveler_email,
            "password": "Password123!"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Search Marketplace
        search_resp = await client.get("/api/v1/marketplace/search")
        assert search_resp.status_code == 200
        search_data = search_resp.json()
        assert "properties" in search_data
        
        if search_data["properties"]:
            prop = search_data["properties"][0]
            prop_id = prop["id"]

            # 2. Get Property Details
            prop_resp = await client.get(f"/api/v1/marketplace/properties/{prop_id}")
            assert prop_resp.status_code == 200
            prop_detail = prop_resp.json()
            assert prop_detail["id"] == prop_id

            if prop_detail.get("room_types"):
                rt = prop_detail["room_types"][0]
                rt_id = rt["id"]

                # 3. Create Traveler Booking
                cin = (date.today() + timedelta(days=20)).isoformat()
                cout = (date.today() + timedelta(days=23)).isoformat()

                booking_payload = {
                    "property_id": prop_id,
                    "room_type_id": rt_id,
                    "check_in_date": cin,
                    "check_out_date": cout,
                    "adults": 2,
                    "children": 0,
                    "guest_first_name": "Sarah",
                    "guest_last_name": "Jenkins",
                    "guest_email": traveler_email,
                    "guest_phone": "+1 555-0199",
                    "special_requests": "Quiet room on high floor"
                }

                book_resp = await client.post("/api/v1/traveler/bookings", json=booking_payload, headers=headers)
                assert book_resp.status_code in [201, 409]
                
                if book_resp.status_code == 201:
                    booking_info = book_resp.json()
                    assert "booking_reference" in booking_info
                    res_id = booking_info["reservation_id"]

                    # 4. View My Trips
                    trips_resp = await client.get("/api/v1/traveler/bookings", headers=headers)
                    assert trips_resp.status_code == 200
                    trips_data = trips_resp.json()
                    assert "upcoming" in trips_data

                    # 5. Check Loyalty Account
                    loyalty_resp = await client.get("/api/v1/loyalty/me", headers=headers)
                    assert loyalty_resp.status_code == 200
                    loyalty_data = loyalty_resp.json()
                    assert "tier" in loyalty_data
                    assert loyalty_data["points"] > 0

                    # 6. Check Traveler Profile & Recommendations
                    prof_resp = await client.get("/api/v1/traveler/profile", headers=headers)
                    assert prof_resp.status_code == 200
                    
                    rec_resp = await client.get("/api/v1/traveler/recommendations", headers=headers)
                    assert rec_resp.status_code == 200
                    assert isinstance(rec_resp.json(), list)

                    # 7. Cancel Trip
                    cancel_resp = await client.post(f"/api/v1/traveler/bookings/{res_id}/cancel", headers=headers)
                    assert cancel_resp.status_code == 200
