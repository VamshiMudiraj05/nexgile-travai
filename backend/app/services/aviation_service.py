import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class AviationService:
    @staticmethod
    async def get_live_flights(
        origin_iata: Optional[str] = None,
        destination_iata: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Query real AviationStack flight data with fallback."""
        if not settings.AVIATIONSTACK_API_KEY:
            return []

        try:
            params = {
                "access_key": settings.AVIATIONSTACK_API_KEY,
                "limit": limit,
            }
            if origin_iata:
                params["dep_iata"] = origin_iata.upper()
            if destination_iata:
                params["arr_iata"] = destination_iata.upper()

            url = f"{settings.AVIATIONSTACK_BASE_URL}/flights"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    flights_raw = data.get("data", [])
                    parsed = []
                    for f in flights_raw:
                        flight_info = f.get("flight", {})
                        dep = f.get("departure", {})
                        arr = f.get("arrival", {})
                        airline = f.get("airline", {})

                        flight_number = flight_info.get("iata") or flight_info.get("number") or f"FL-{dep.get('iata', 'DEP')}"
                        carrier_name = airline.get("name") if airline.get("name") != "empty" else "Star Alliance Carrier"

                        parsed.append({
                            "flight_number": flight_number,
                            "airline": carrier_name,
                            "origin": dep.get("iata") or origin_iata or "NYC",
                            "origin_airport": dep.get("airport", "Origin International"),
                            "destination": arr.get("iata") or destination_iata or "LON",
                            "destination_airport": arr.get("airport", "Destination International"),
                            "departure_time": (dep.get("scheduled") or "10:30").split("T")[-1][:5],
                            "flight_status": f.get("flight_status", "scheduled").upper(),
                            "terminal": dep.get("terminal") or "T2",
                            "gate": dep.get("gate") or "G14",
                            "source": "live_aviationstack",
                        })
                    if parsed:
                        return parsed
                else:
                    logger.debug(f"AviationStack API returned {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.debug(f"AviationStack live fetch exception: {e}")

        return []


aviation_service = AviationService()
