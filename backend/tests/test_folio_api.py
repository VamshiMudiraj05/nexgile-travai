import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token


@pytest.mark.anyio
async def test_folio_currencies_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/folios/currencies")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 50
        codes = [item["code"] for item in data]
        assert "USD" in codes
        assert "EUR" in codes
        assert "JPY" in codes


@pytest.mark.anyio
async def test_currency_conversion_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/folios/currencies/convert",
            json={"amount": 100.0, "from_currency": "USD", "to_currency": "EUR"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["from_currency"] == "USD"
        assert data["to_currency"] == "EUR"
        assert data["converted_amount"] == 92.0
