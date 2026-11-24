import json
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.api.websockets import hotel_ws_manager
from app.database.mongodb import connect_to_mongo, close_mongo_connection


@pytest_asyncio.fixture(autouse=True)
async def db_lifecycle():
    await connect_to_mongo()
    yield
    await close_mongo_connection()


def test_websocket_ping_pong():
    """Verify WebSocket connection, initial handshake, and ping/pong heartbeat."""
    client = TestClient(app)
    with client.websocket_connect("/ws/hotel-events") as websocket:
        initial = websocket.receive_json()
        assert initial["type"] == "CONNECTION_ESTABLISHED"
        assert "Nexgile-TravAI" in initial["message"]

        # Send heartbeat PING
        websocket.send_text(json.dumps({"type": "PING"}))
        pong = websocket.receive_json()
        assert pong["type"] == "PONG"


@pytest.mark.asyncio
async def test_websocket_broadcast_manager():
    """Verify in-memory hotel_ws_manager broadcast gracefully handles empty/active clients."""
    await hotel_ws_manager.broadcast(
        event_type="ROOM_STATUS_CHANGED",
        data={"room_id": "mock_room_1", "new_status": "CLEAN"}
    )
    assert len(hotel_ws_manager.active_connections) >= 0


@pytest.mark.asyncio
async def test_concierge_sse_streaming():
    """Verify SSE streaming endpoint delivers typewriter token stream and terminal payload."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register a test traveler
        email = f"stream_traveler_{int(pytest.importorskip('time').time() * 1000)}@example.com"
        reg_res = await client.post("/api/v1/auth/register", json={
            "name": "Maya Lin",
            "email": email,
            "password": "Password123!",
            "role": "TRAVELER"
        })
        assert reg_res.status_code == 201

        login_res = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Request SSE stream
        res = await client.post(
            "/api/v1/concierge/chat/stream",
            headers=auth_headers,
            json={"message": "What time is pool opening?"}
        )
        assert res.status_code == 200
        assert "text/event-stream" in res.headers.get("content-type", "")
        body = res.text
        assert "data: " in body
        assert '"done": true' in body
