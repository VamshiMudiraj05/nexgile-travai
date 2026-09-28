from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId

from app.database.mongodb import get_database
from app.models.reservation import reservation_helper
from app.schemas.dashboard import DashboardSummary
from app.schemas.reservation import ReservationResponse, ReservationStatus
from app.schemas.room import RoomStatus


class DashboardService:
    @staticmethod
    async def get_summary(property_id: Optional[str] = None) -> DashboardSummary:
        db = get_database()
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        room_query: Dict[str, Any] = {}
        res_query: Dict[str, Any] = {}
        if property_id:
            room_query["property_id"] = property_id
            res_query["property_id"] = property_id

        # Aggregations
        total_props = await db.properties.count_documents({"status": "ACTIVE"}) if not property_id else 1
        total_rooms = await db.rooms.count_documents(room_query)
        total_guests = await db.guests.count_documents({})

        # Room statuses
        available_rooms = await db.rooms.count_documents({**room_query, "status": RoomStatus.AVAILABLE.value})
        occupied_rooms = await db.rooms.count_documents({**room_query, "status": RoomStatus.OCCUPIED.value})
        reserved_rooms = await db.rooms.count_documents({**room_query, "status": RoomStatus.RESERVED.value})
        cleaning_rooms = await db.rooms.count_documents({**room_query, "status": RoomStatus.CLEANING.value})
        maintenance_rooms = await db.rooms.count_documents({**room_query, "status": RoomStatus.MAINTENANCE.value})
        out_of_order_rooms = await db.rooms.count_documents({**room_query, "status": RoomStatus.OUT_OF_ORDER.value})

        occupancy_rate = round((occupied_rooms / total_rooms) * 100, 1) if total_rooms > 0 else 0.0

        # Today's arrivals (check_in_date == today)
        arrivals_cursor = db.reservations.find({
            **res_query,
            "check_in_date": today_str,
            "status": {"$in": [ReservationStatus.CONFIRMED.value, ReservationStatus.CHECKED_IN.value]}
        }).limit(10)
        arrivals_docs = await arrivals_cursor.to_list(length=10)
        todays_arrivals_count = await db.reservations.count_documents({
            **res_query,
            "check_in_date": today_str,
            "status": {"$in": [ReservationStatus.CONFIRMED.value, ReservationStatus.CHECKED_IN.value]}
        })

        # Today's departures (check_out_date == today)
        departures_cursor = db.reservations.find({
            **res_query,
            "check_out_date": today_str,
            "status": {"$in": [ReservationStatus.CHECKED_IN.value, ReservationStatus.CHECKED_OUT.value]}
        }).limit(10)
        departures_docs = await departures_cursor.to_list(length=10)
        todays_departures_count = await db.reservations.count_documents({
            **res_query,
            "check_out_date": today_str,
            "status": {"$in": [ReservationStatus.CHECKED_IN.value, ReservationStatus.CHECKED_OUT.value]}
        })

        # Active reservations count
        active_reservations = await db.reservations.count_documents({
            **res_query,
            "status": {"$in": [ReservationStatus.CONFIRMED.value, ReservationStatus.CHECKED_IN.value]}
        })

        # Recent reservations
        recent_cursor = db.reservations.find(res_query).sort("created_at", -1).limit(10)
        recent_docs = await recent_cursor.to_list(length=10)

        # Helper to populate reservation items
        async def populate_res_list(docs: List[dict]) -> List[ReservationResponse]:
            result = []
            for r in docs:
                p_name = None
                g_name = None
                g_email = None
                g_phone = None
                rt_name = None
                r_num = None

                if ObjectId.is_valid(r.get("property_id")):
                    p_doc = await db.properties.find_one({"_id": ObjectId(r["property_id"])}, {"name": 1})
                    if p_doc:
                        p_name = p_doc.get("name")

                if ObjectId.is_valid(r.get("guest_id")):
                    g_doc = await db.guests.find_one({"_id": ObjectId(r["guest_id"])})
                    if g_doc:
                        g_name = f"{g_doc.get('first_name', '')} {g_doc.get('last_name', '')}".strip()
                        g_email = g_doc.get("email")
                        g_phone = g_doc.get("phone")

                if ObjectId.is_valid(r.get("room_type_id")):
                    rt_doc = await db.room_types.find_one({"_id": ObjectId(r["room_type_id"])}, {"name": 1})
                    if rt_doc:
                        rt_name = rt_doc.get("name")

                if ObjectId.is_valid(r.get("room_id")):
                    room_doc = await db.rooms.find_one({"_id": ObjectId(r["room_id"])}, {"room_number": 1})
                    if room_doc:
                        r_num = room_doc.get("room_number")

                result.append(ReservationResponse(**reservation_helper(
                    r,
                    guest_name=g_name,
                    guest_email=g_email,
                    guest_phone=g_phone,
                    property_name=p_name,
                    room_type_name=rt_name,
                    room_number=r_num,
                )))
            return result

        arrivals_items = await populate_res_list(arrivals_docs)
        departures_items = await populate_res_list(departures_docs)
        recent_items = await populate_res_list(recent_docs)

        return DashboardSummary(
            total_properties=total_props,
            total_rooms=total_rooms,
            available_rooms=available_rooms,
            occupied_rooms=occupied_rooms,
            reserved_rooms=reserved_rooms,
            cleaning_rooms=cleaning_rooms,
            maintenance_rooms=maintenance_rooms,
            out_of_order_rooms=out_of_order_rooms,
            occupancy_rate=occupancy_rate,
            todays_arrivals_count=todays_arrivals_count,
            todays_departures_count=todays_departures_count,
            active_reservations=active_reservations,
            total_guests=total_guests,
            room_status_counts={
                "AVAILABLE": available_rooms,
                "OCCUPIED": occupied_rooms,
                "RESERVED": reserved_rooms,
                "CLEANING": cleaning_rooms,
                "MAINTENANCE": maintenance_rooms,
                "OUT_OF_ORDER": out_of_order_rooms,
            },
            todays_arrivals=arrivals_items,
            todays_departures=departures_items,
            recent_reservations=recent_items,
        )


dashboard_service = DashboardService()
