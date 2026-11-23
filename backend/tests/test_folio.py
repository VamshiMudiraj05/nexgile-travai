import pytest
from app.services.currency_service import CurrencyService


def test_currency_conversion():
    # USD to EUR
    res = CurrencyService.convert(100.0, "USD", "EUR")
    assert res["from_currency"] == "USD"
    assert res["to_currency"] == "EUR"
    assert res["converted_amount"] == 92.0

    # EUR to USD
    res_back = CurrencyService.convert(92.0, "EUR", "USD")
    assert round(res_back["converted_amount"], 1) == 100.0

    # 50+ Currencies supported
    supported = CurrencyService.get_supported_currencies()
    assert len(supported) >= 50
    codes = [c["code"] for c in supported]
    assert "USD" in codes
    assert "EUR" in codes
    assert "GBP" in codes
    assert "JPY" in codes
    assert "INR" in codes
    assert "AED" in codes
    assert "SAR" in codes
