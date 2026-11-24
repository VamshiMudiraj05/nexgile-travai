import httpx
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback climatology for key Nexgile luxury destinations
DEFAULT_DESTINATION_WEATHER = {
    "goa": {"temp": 30, "condition": "Tropical Sunshine", "humidity": 68, "wind_speed": 12, "icon": "01d"},
    "mumbai": {"temp": 29, "condition": "Coastal Breeze", "humidity": 72, "wind_speed": 15, "icon": "02d"},
    "delhi": {"temp": 24, "condition": "Hazy Sunshine", "humidity": 45, "wind_speed": 8, "icon": "50d"},
    "udaipur": {"temp": 26, "condition": "Pleasant Lake Breeze", "humidity": 40, "wind_speed": 10, "icon": "01d"},
    "jaipur": {"temp": 27, "condition": "Sunny Desert Warmth", "humidity": 35, "wind_speed": 9, "icon": "01d"},
    "kerala": {"temp": 28, "condition": "Tropical Lush Showers", "humidity": 80, "wind_speed": 14, "icon": "10d"},
    "london": {"temp": 12, "condition": "Mild Overcast", "humidity": 75, "wind_speed": 18, "icon": "04d"},
    "new york": {"temp": 14, "condition": "Clear Sky", "humidity": 55, "wind_speed": 16, "icon": "01d"},
    "paris": {"temp": 13, "condition": "Partly Cloudy", "humidity": 65, "wind_speed": 12, "icon": "02d"},
    "dubai": {"temp": 32, "condition": "Warm Oasis Sun", "humidity": 50, "wind_speed": 11, "icon": "01d"},
}


class WeatherService:
    @staticmethod
    async def get_city_weather(city: str = "Goa") -> Dict[str, Any]:
        """Fetch live weather from OpenWeatherMap with automatic graceful fallback."""
        clean_city = (city or "Goa").strip()
        normalized_key = clean_city.lower()

        # If key is available, attempt real live OpenWeatherMap call
        if settings.OPENWEATHER_API_KEY:
            try:
                url = f"{settings.OPENWEATHER_BASE_URL}/weather"
                params = {
                    "q": clean_city,
                    "appid": settings.OPENWEATHER_API_KEY,
                    "units": "metric",
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        main = data.get("main", {})
                        weather = data.get("weather", [{}])[0]
                        wind = data.get("wind", {})
                        return {
                            "city": data.get("name", clean_city),
                            "temp": round(main.get("temp", 28)),
                            "feels_like": round(main.get("feels_like", 28)),
                            "condition": weather.get("description", "Clear").title(),
                            "humidity": main.get("humidity", 60),
                            "wind_speed": round(wind.get("speed", 10)),
                            "icon": weather.get("icon", "01d"),
                            "source": "live_openweather",
                        }
                    else:
                        logger.debug(f"OpenWeatherMap returned {resp.status_code} (likely newly created key activating): {resp.text}")
            except Exception as e:
                logger.debug(f"OpenWeatherMap call error: {e}")

        # Fallback to realistic climatology
        fallback = DEFAULT_DESTINATION_WEATHER.get(
            normalized_key,
            {"temp": 28, "condition": "Pleasant Resort Weather", "humidity": 60, "wind_speed": 10, "icon": "01d"}
        )
        return {
            "city": clean_city.title(),
            "temp": fallback["temp"],
            "feels_like": fallback["temp"],
            "condition": fallback["condition"],
            "humidity": fallback["humidity"],
            "wind_speed": fallback["wind_speed"],
            "icon": fallback["icon"],
            "source": "climatology_cache",
        }


weather_service = WeatherService()
