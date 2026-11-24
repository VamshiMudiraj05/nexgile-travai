from fastapi import APIRouter
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Live Weather"])


@router.get("/{city}")
async def get_destination_weather(city: str):
    """Retrieve live weather forecast and conditions for a hotel destination city."""
    return await weather_service.get_city_weather(city)
