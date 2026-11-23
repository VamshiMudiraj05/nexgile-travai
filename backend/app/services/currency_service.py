from datetime import datetime, timezone
from typing import Dict, Any, List


class CurrencyService:
    # Baseline USD pegged reference conversion matrix covering 50+ global currencies
    FX_RATES: Dict[str, float] = {
        "USD": 1.0,
        "EUR": 0.92,
        "GBP": 0.79,
        "JPY": 154.50,
        "CAD": 1.36,
        "AUD": 1.52,
        "CHF": 0.88,
        "CNY": 7.23,
        "INR": 83.45,
        "SGD": 1.34,
        "HKD": 7.82,
        "AED": 3.67,
        "SAR": 3.75,
        "QAR": 3.64,
        "KWD": 0.31,
        "BHD": 0.38,
        "OMR": 0.385,
        "NZD": 1.67,
        "SEK": 10.75,
        "NOK": 10.95,
        "DKK": 6.89,
        "ZAR": 18.25,
        "BRL": 5.45,
        "MXN": 18.10,
        "TRY": 32.80,
        "KRW": 1380.0,
        "THB": 36.60,
        "MYR": 4.71,
        "IDR": 16400.0,
        "PHP": 58.70,
        "VND": 25400.0,
        "PLN": 3.98,
        "CZK": 23.20,
        "HUF": 365.0,
        "ILS": 3.72,
        "EGP": 47.90,
        "CLP": 930.0,
        "COP": 4120.0,
        "PEN": 3.80,
        "ARS": 915.0,
        "TWD": 32.40,
        "MAD": 9.95,
        "KES": 130.0,
        "NGN": 1490.0,
        "GHS": 15.20,
        "PKR": 278.50,
        "BDT": 117.50,
        "LKR": 305.0,
        "JOD": 0.709,
        "CRC": 525.0,
        "DOP": 59.20,
        "ISK": 139.50,
    }

    @classmethod
    def get_supported_currencies(cls) -> List[Dict[str, Any]]:
        """Return list of supported currency codes and baseline rates to USD."""
        return [
            {"code": code, "rate_to_usd": rate}
            for code, rate in sorted(cls.FX_RATES.items())
        ]

    @classmethod
    def convert(cls, amount: float, from_curr: str, to_curr: str) -> Dict[str, Any]:
        """Convert an amount from one currency to another."""
        from_upper = from_curr.upper().strip()
        to_upper = to_curr.upper().strip()

        rate_from = cls.FX_RATES.get(from_upper, 1.0)
        rate_to = cls.FX_RATES.get(to_upper, 1.0)

        # Convert to USD first, then to target currency
        usd_amount = amount / rate_from
        converted_amount = usd_amount * rate_to
        effective_rate = rate_to / rate_from

        return {
            "original_amount": round(amount, 2),
            "from_currency": from_upper,
            "converted_amount": round(converted_amount, 2),
            "to_currency": to_upper,
            "rate": round(effective_rate, 6),
            "timestamp": datetime.now(timezone.utc),
        }
