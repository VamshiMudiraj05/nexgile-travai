import pytest
from datetime import date, timedelta
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.database.mongodb import db_manager
from app.core.security import hash_password, create_access_token


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]

    # Setup admin user in mock DB
    admin_doc = {
        "name": "Test Admin",
        "email": "admin@nexgile.com",
        "password_hash": hash_password("AdminPassword123!"),
        "role": "ADMIN",
        "is_active": True,
    }
    res = await db_manager.db.users.insert_one(admin_doc)
    admin_id = str(res.inserted_id)

    # Setup indexes in mock DB
    await db_manager.db.properties.create_index([("property_code", 1)], unique=True)
    await db_manager.db.room_types.create_index([("property_id", 1), ("code", 1)], unique=True)
    await db_manager.db.rooms.create_index([("property_id", 1), ("room_number", 1)], unique=True)
    await db_manager.db.reservations.create_index([("booking_reference", 1)], unique=True)

    yield admin_id
    mock_client.close()


@pytest.mark.asyncio
async def test_full_pms_lifecycle(mock_db):
    admin_id = mock_db
    token = create_access_token({"sub": admin_id, "email": "admin@nexgile.com", "role": "ADMIN"})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create Property
        prop_payload = {
            "name": "The Oberoi Grand",
            "property_code": "OBR-001",
            "property_type": "HOTEL",
            "address": "15 Jawaharlal Nehru Road",
            "city": "Kolkata",
            "country": "India",
            "star_rating": 5,
            "amenities": ["WiFi", "Pool", "Spa"],
            "check_in_time": "14:00",
            "check_out_time": "12:00",
            "currency": "INR",
            "status": "ACTIVE"
        }
        res_prop = await ac.post("/api/v1/properties", json=prop_payload, headers=headers)
        assert res_prop.status_code == 201
        prop_data = res_prop.json()
        property_id = prop_data["_id"]
        assert prop_data["property_code"] == "OBR-001"

        # Reject duplicate property code
        res_dup_prop = await ac.post("/api/v1/properties", json=prop_payload, headers=headers)
        assert res_dup_prop.status_code == 409

        # 2. Create Room Type
        rt_payload = {
            "property_id": property_id,
            "name": "Luxury Suite",
            "code": "LUX-STE",
            "max_occupancy": 3,
            "adults_capacity": 2,
            "children_capacity": 1,
            "bed_type": "KING",
            "bed_count": 1,
            "base_price": 9500.0,
            "amenities": ["Balcony", "Jacuzzi"]
        }
        res_rt = await ac.post(f"/api/v1/properties/{property_id}/room-types", json=rt_payload, headers=headers)
        assert res_rt.status_code == 201
        rt_data = res_rt.json()
        room_type_id = rt_data["_id"]
        assert rt_data["code"] == "LUX-STE"

        # 3. Create Room
        room_payload = {
            "property_id": property_id,
            "room_type_id": room_type_id,
            "room_number": "301",
            "floor": 3,
            "status": "AVAILABLE"
        }
        res_room = await ac.post(f"/api/v1/properties/{property_id}/rooms", json=room_payload, headers=headers)
        assert res_room.status_code == 201
        room_data = res_room.json()
        room_id = room_data["_id"]
        assert room_data["room_number"] == "301"

        # Reject duplicate room number in same property
        res_dup_room = await ac.post(f"/api/v1/properties/{property_id}/rooms", json=room_payload, headers=headers)
        assert res_dup_room.status_code == 409

        # 4. Create Guest Profile
        guest_payload = {
            "first_name": "Elena",
            "last_name": "Rostova",
            "email": "elena.rostova@example.com",
            "phone": "+91-9988776655",
            "nationality": "Indian",
            "city": "Delhi"
        }
        res_guest = await ac.post("/api/v1/guests", json=guest_payload, headers=headers)
        assert res_guest.status_code == 201
        guest_data = res_guest.json()
        guest_id = guest_data["_id"]
        assert guest_data["email"] == "elena.rostova@example.com"

        # 5. Check Availability
        today = date.today()
        d_in = today
        d_out = today + timedelta(days=2)
        res_avail = await ac.get(
            f"/api/v1/reservations/availability?property_id={property_id}&check_in_date={d_in}&check_out_date={d_out}",
            headers=headers
        )
        assert res_avail.status_code == 200
        assert res_avail.json()["total_available"] >= 1

        # 6. Create Reservation
        res_payload = {
            "property_id": property_id,
            "guest_id": guest_id,
            "room_type_id": room_type_id,
            "room_id": room_id,
            "check_in_date": d_in.isoformat(),
            "check_out_date": d_out.isoformat(),
            "number_of_adults": 2,
            "number_of_children": 0,
            "rate_per_night": 9500.0,
            "source": "DIRECT",
            "status": "CONFIRMED"
        }
        res_booking = await ac.post("/api/v1/reservations", json=res_payload, headers=headers)
        assert res_booking.status_code == 201
        booking_data = res_booking.json()
        reservation_id = booking_data["_id"]
        assert "NGX-" in booking_data["booking_reference"]
        assert booking_data["total_amount"] > 0

        # 7. Prevent Double Booking
        res_double_booking = await ac.post("/api/v1/reservations", json=res_payload, headers=headers)
        assert res_double_booking.status_code == 409

        # 8. Check-in Guest
        res_checkin = await ac.post(f"/api/v1/reservations/{reservation_id}/check-in", headers=headers)
        assert res_checkin.status_code == 200
        assert res_checkin.json()["status"] == "CHECKED_IN"

        # Verify Room is now OCCUPIED
        room_check = await ac.get(f"/api/v1/rooms/{room_id}", headers=headers)
        assert room_check.json()["status"] == "OCCUPIED"

        # 9. Check-out Guest
        res_checkout = await ac.post(f"/api/v1/reservations/{reservation_id}/check-out", headers=headers)
        assert res_checkout.status_code == 200
        assert res_checkout.json()["status"] == "CHECKED_OUT"

        # Verify Room is now CLEANING (never directly available)
        room_check2 = await ac.get(f"/api/v1/rooms/{room_id}", headers=headers)
        assert room_check2.json()["status"] == "CLEANING"

        # 10. Dashboard Summary
        res_dash = await ac.get("/api/v1/dashboard/summary", headers=headers)
        assert res_dash.status_code == 200
        dash_data = res_dash.json()
        assert dash_data["total_properties"] >= 1
        assert dash_data["total_rooms"] >= 1
        assert dash_data["cleaning_rooms"] >= 1
        assert dash_data["total_guests"] >= 1
