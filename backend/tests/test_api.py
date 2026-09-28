import pytest
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.database.mongodb import db_manager
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token


@pytest.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["nexgile_travai_test"]
    yield
    mock_client.close()


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "nexgile-travai-backend"
    }


def test_password_security():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_generation_and_validation():
    payload = {"sub": "user_id_123", "email": "test@nexgile.com", "role": "ADMIN"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    
    decoded = decode_access_token(token)
    assert decoded["sub"] == "user_id_123"
    assert decoded["email"] == "test@nexgile.com"
    assert decoded["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_auth_registration_login_and_me_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register new user
        register_payload = {
            "name": "Sarah Connor",
            "email": "sarah@resistance.org",
            "password": "terminator_defense_123",
            "role": "ADMIN"
        }
        reg_response = await ac.post("/api/v1/auth/register", json=register_payload)
        assert reg_response.status_code == 201
        reg_data = reg_response.json()
        assert reg_data["name"] == "Sarah Connor"
        assert reg_data["email"] == "sarah@resistance.org"
        assert reg_data["role"] == "ADMIN"
        assert "password_hash" not in reg_data
        assert "_id" in reg_data

        # 2. Reject duplicate registration
        dup_response = await ac.post("/api/v1/auth/register", json=register_payload)
        assert dup_response.status_code == 400

        # 3. Reject invalid login
        invalid_login = await ac.post("/api/v1/auth/login", json={
            "email": "sarah@resistance.org",
            "password": "wrongpassword"
        })
        assert invalid_login.status_code == 401

        # 4. Successful login
        login_response = await ac.post("/api/v1/auth/login", json={
            "email": "sarah@resistance.org",
            "password": "terminator_defense_123"
        })
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "access_token" in login_data
        assert login_data["token_type"] == "bearer"
        assert login_data["user"]["name"] == "Sarah Connor"
        assert login_data["user"]["role"] == "ADMIN"

        token = login_data["access_token"]

        # 5. Get current user /me with valid JWT
        me_response = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["name"] == "Sarah Connor"
        assert me_data["email"] == "sarah@resistance.org"
        assert me_data["role"] == "ADMIN"

        # 6. Reject /me with invalid token
        invalid_me = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.payload"}
        )
        assert invalid_me.status_code == 401

        # 7. Test all 7 role registrations
        roles = ["ADMIN", "FRONT_DESK", "REVENUE_MANAGER", "HOUSEKEEPING", "MAINTENANCE", "FINANCE", "TRAVELER"]
        for role in roles:
            role_user = {
                "name": f"User {role}",
                "email": f"{role.lower()}@nexgile.com",
                "password": "Password123!",
                "role": role
            }
            res = await ac.post("/api/v1/auth/register", json=role_user)
            assert res.status_code == 201
            assert res.json()["role"] == role
