import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.weather_service import weather_service
from app.services.multimodal_service import MultimodalService
from app.database.mongodb import connect_to_mongo, close_mongo_connection


@pytest_asyncio.fixture(autouse=True)
async def db_lifecycle():
    await connect_to_mongo()
    yield
    await close_mongo_connection()


@pytest.mark.asyncio
async def test_weather_service_direct():
    """Verify WeatherService returns valid structure for luxury resort cities."""
    res = await weather_service.get_city_weather("Goa")
    assert res["city"] == "Goa"
    assert "temp" in res
    assert "condition" in res
    assert "humidity" in res
    assert res["temp"] > 0


@pytest.mark.asyncio
async def test_weather_api_endpoint():
    """Verify GET /api/v1/weather/{city} endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/weather/Mumbai")
        assert res.status_code == 200
        data = res.json()
        assert data["city"] == "Mumbai"
        assert "temp" in data
        assert "condition" in data


@pytest.mark.asyncio
async def test_multimodal_live_flights_enrichment():
    """Verify search_flights_live aggregates flight catalog with live telemetry support."""
    res = await MultimodalService.search_flights_live(
        origin="NYC",
        destination="LON",
        departure_date="2026-12-01",
        cabin_class="ECONOMY"
    )
    assert res["origin"] == "NYC"
    assert res["destination"] == "LON"
    assert res["total_found"] >= 4
    assert len(res["flights"]) >= 4
    first_flight = res["flights"][0]
    assert "airline" in first_flight
    assert "price" in first_flight
