from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.mongodb import get_database
from app.core.logging import logger


class AnalyticsService:
    @staticmethod
    async def get_dashboard_overview() -> Dict[str, Any]:
        """Fetch unified BI overview using real MongoDB collections."""
        db = get_database()
        today_str = date.today().isoformat()
        
        # 1. Total counts
        total_properties = await db.properties.count_documents({})
        total_rooms = await db.rooms.count_documents({})
        
        # 2. Room status breakdown
        occupied_rooms = await db.rooms.count_documents({"status": "OCCUPIED"})
        cleaning_rooms = await db.rooms.count_documents({"status": "CLEANING"})
        maintenance_rooms = await db.rooms.count_documents({"status": "MAINTENANCE"})
        
        # 3. Operational task counts (checking collections if available or room status)
        rooms_to_clean = cleaning_rooms
        open_maintenance = maintenance_rooms
        pending_service_requests = 0
        try:
            pending_service_requests = await db.service_requests.count_documents({"status": {"$in": ["PENDING", "OPEN", "IN_PROGRESS"]}})
        except Exception:
            pass

        # 4. Reservations metrics
        active_reservations = await db.reservations.count_documents({
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
        })
        
        today_checkins = await db.reservations.count_documents({
            "check_in_date": today_str,
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
        })
        
        today_checkouts = await db.reservations.count_documents({
            "check_out_date": today_str,
            "status": "CHECKED_IN"
        })

        # 5. Financial aggregates from completed/active reservations
        revenue_pipeline = [
            {"$match": {"status": {"$in": ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]}}},
            {"$group": {"_id": None, "total_rev": {"$sum": "$total_amount"}, "total_nights": {"$sum": "$nights"}}}
        ]
        rev_res = await db.reservations.aggregate(revenue_pipeline).to_list(length=1)
        total_revenue = float(rev_res[0]["total_rev"]) if rev_res else 0.0
        total_nights_sold = int(rev_res[0]["total_nights"]) if rev_res else 0

        # ADR: Total room revenue / number of rooms sold (room nights)
        adr = round(total_revenue / total_nights_sold, 2) if total_nights_sold > 0 else 0.0

        # Occupancy Rate (%)
        occupancy_rate = round((occupied_rooms / total_rooms) * 100.0, 1) if total_rooms > 0 else 0.0
        
        # RevPAR: Room revenue / available room nights (or ADR * Occupancy %)
        revpar = round((adr * (occupancy_rate / 100.0)), 2)

        # 6. Time series charts for the past 7 days to next 7 days
        base_date = date.today() - timedelta(days=6)
        revenue_chart = []
        occupancy_chart = []
        booking_trend_chart = []

        for i in range(14):
            day = base_date + timedelta(days=i)
            day_str = day.isoformat()
            
            # Find reservations active on that day
            active_cursor = db.reservations.find({
                "check_in_date": {"$lte": day_str},
                "check_out_date": {"$gt": day_str},
                "status": {"$in": ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]}
            })
            day_reservations = await active_cursor.to_list(length=500)
            day_occupied = len(day_reservations)
            day_occ_pct = round((day_occupied / total_rooms * 100.0), 1) if total_rooms > 0 else 0.0
            
            # Day revenue
            day_revenue = sum(float(r.get("total_amount", 0.0)) / max(int(r.get("nights", 1)), 1) for r in day_reservations)

            # Bookings created on or checking in on that date
            created_count = await db.reservations.count_documents({
                "check_in_date": day_str
            })

            revenue_chart.append({"date": day_str, "revenue": round(day_revenue, 2)})
            occupancy_chart.append({"date": day_str, "occupancy": day_occ_pct})
            booking_trend_chart.append({"date": day_str, "bookings": created_count})

        # 7. Recent lists
        recent_res_cursor = db.reservations.find().sort("created_at", -1).limit(5)
        recent_reservations_raw = await recent_res_cursor.to_list(length=5)
        recent_reservations = []
        for r in recent_reservations_raw:
            recent_reservations.append({
                "id": str(r["_id"]),
                "booking_reference": r.get("booking_reference", ""),
                "guest_name": r.get("guest_name", "Guest"),
                "room_number": r.get("room_number", "N/A"),
                "check_in_date": r.get("check_in_date"),
                "check_out_date": r.get("check_out_date"),
                "total_amount": float(r.get("total_amount", 0.0)),
                "status": r.get("status", "CONFIRMED")
            })

        # Today's Arrivals
        arr_cursor = db.reservations.find({"check_in_date": today_str}).limit(5)
        today_arr_raw = await arr_cursor.to_list(length=5)
        today_arrivals = [{
            "id": str(r["_id"]),
            "booking_reference": r.get("booking_reference", ""),
            "guest_name": r.get("guest_name", "Guest"),
            "room_number": r.get("room_number", "N/A"),
            "status": r.get("status", "CONFIRMED")
        } for r in today_arr_raw]

        # Today's Departures
        dep_cursor = db.reservations.find({"check_out_date": today_str}).limit(5)
        today_dep_raw = await dep_cursor.to_list(length=5)
        today_departures = [{
            "id": str(r["_id"]),
            "booking_reference": r.get("booking_reference", ""),
            "guest_name": r.get("guest_name", "Guest"),
            "room_number": r.get("room_number", "N/A"),
            "status": r.get("status", "CHECKED_IN")
        } for r in today_dep_raw]

        return {
            "total_properties": total_properties,
            "total_rooms": total_rooms,
            "occupancy_rate": occupancy_rate,
            "today_checkins": today_checkins,
            "today_checkouts": today_checkouts,
            "active_reservations": active_reservations,
            "total_revenue": round(total_revenue, 2),
            "adr": adr,
            "revpar": revpar,
            "rooms_to_clean": rooms_to_clean,
            "open_maintenance": open_maintenance,
            "pending_service_requests": pending_service_requests,
            "revenue_chart": revenue_chart,
            "occupancy_chart": occupancy_chart,
            "booking_trend_chart": booking_trend_chart,
            "recent_reservations": recent_reservations,
            "today_arrivals": today_arrivals,
            "today_departures": today_departures
        }

    @staticmethod
    async def get_revenue_analytics(
        property_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        room_type_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Compute ADR, RevPAR, Revenue by Property, Room Type, and Date Range."""
        db = get_database()
        
        match_filter: Dict[str, Any] = {
            "status": {"$in": ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]}
        }
        if property_id and ObjectId.is_valid(property_id):
            match_filter["property_id"] = ObjectId(property_id)
        if room_type_id and ObjectId.is_valid(room_type_id):
            match_filter["room_type_id"] = ObjectId(room_type_id)
        
        date_conditions = {}
        if start_date:
            date_conditions["$gte"] = start_date
        if end_date:
            date_conditions["$lte"] = end_date
        if date_conditions:
            match_filter["check_in_date"] = date_conditions

        # Fetch matching reservations
        reservations = await db.reservations.find(match_filter).to_list(length=1000)
        
        total_revenue = sum(float(r.get("total_amount", 0.0)) for r in reservations)
        rooms_sold = sum(int(r.get("nights", 1)) for r in reservations)
        
        # Room inventory count
        room_match: Dict[str, Any] = {}
        if property_id and ObjectId.is_valid(property_id):
            room_match["property_id"] = ObjectId(property_id)
        total_rooms = await db.rooms.count_documents(room_match) or 1
        
        # Determine number of days in window
        d_start = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else (date.today() - timedelta(days=30))
        d_end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else date.today()
        num_days = max((d_end - d_start).days + 1, 1)
        total_available_room_nights = total_rooms * num_days

        adr = round(total_revenue / rooms_sold, 2) if rooms_sold > 0 else 0.0
        occupancy_pct = round((rooms_sold / total_available_room_nights) * 100.0, 1) if total_available_room_nights > 0 else 0.0
        revpar = round(total_revenue / total_available_room_nights, 2) if total_available_room_nights > 0 else 0.0

        # Revenue by Property
        prop_pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": "$property_name", "revenue": {"$sum": "$total_amount"}, "bookings": {"$sum": 1}}}
        ]
        prop_rev_raw = await db.reservations.aggregate(prop_pipeline).to_list(length=50)
        revenue_by_property = [
            {"property_name": item["_id"] or "General Property", "revenue": round(float(item["revenue"]), 2), "bookings": item["bookings"]}
            for item in prop_rev_raw
        ]

        # Revenue by Room Type
        room_type_pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": "$room_type_name", "revenue": {"$sum": "$total_amount"}, "bookings": {"$sum": 1}, "nights": {"$sum": "$nights"}}}
        ]
        rt_rev_raw = await db.reservations.aggregate(room_type_pipeline).to_list(length=50)
        revenue_by_room_type = [
            {
                "room_type_name": item["_id"] or "Standard Room",
                "revenue": round(float(item["revenue"]), 2),
                "bookings": item["bookings"],
                "nights": item["nights"],
                "adr": round(float(item["revenue"]) / max(item["nights"], 1), 2)
            }
            for item in rt_rev_raw
        ]

        # Revenue by Date
        date_map: Dict[str, float] = {}
        for r in reservations:
            cin = r.get("check_in_date", today_str := date.today().isoformat())
            amt = float(r.get("total_amount", 0.0))
            date_map[cin] = date_map.get(cin, 0.0) + amt

        sorted_dates = sorted(date_map.keys())
        revenue_by_date = [{"date": d, "revenue": round(date_map[d], 2)} for d in sorted_dates]

        return {
            "total_revenue": round(total_revenue, 2),
            "adr": adr,
            "revpar": revpar,
            "occupancy_percentage": occupancy_pct,
            "rooms_sold": rooms_sold,
            "total_room_nights_available": total_available_room_nights,
            "revenue_by_property": revenue_by_property,
            "revenue_by_room_type": revenue_by_room_type,
            "revenue_by_date": revenue_by_date
        }

    @staticmethod
    async def get_occupancy_analytics(
        property_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Compute current, average, peak, and lowest occupancy rates + trend."""
        db = get_database()
        
        room_match: Dict[str, Any] = {}
        if property_id and ObjectId.is_valid(property_id):
            room_match["property_id"] = ObjectId(property_id)
        total_rooms = await db.rooms.count_documents(room_match) or 1

        d_start = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else (date.today() - timedelta(days=14))
        d_end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else (date.today() + timedelta(days=7))
        num_days = max((d_end - d_start).days + 1, 1)

        trend = []
        occupancy_values = []

        for i in range(num_days):
            current_day = d_start + timedelta(days=i)
            day_str = current_day.isoformat()

            res_filter: Dict[str, Any] = {
                "check_in_date": {"$lte": day_str},
                "check_out_date": {"$gt": day_str},
                "status": {"$in": ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]}
            }
            if property_id and ObjectId.is_valid(property_id):
                res_filter["property_id"] = ObjectId(property_id)

            occupied_count = await db.reservations.count_documents(res_filter)
            occ_pct = round((occupied_count / total_rooms) * 100.0, 1)
            occ_pct = min(occ_pct, 100.0)
            
            trend.append({"date": day_str, "occupancy": occ_pct})
            occupancy_values.append(occ_pct)

        today_str = date.today().isoformat()
        current_occ = next((item["occupancy"] for item in trend if item["date"] == today_str), occupancy_values[0] if occupancy_values else 0.0)
        avg_occ = round(sum(occupancy_values) / len(occupancy_values), 1) if occupancy_values else 0.0
        peak_occ = max(occupancy_values) if occupancy_values else 0.0
        lowest_occ = min(occupancy_values) if occupancy_values else 0.0

        return {
            "summary": {
                "current": current_occ,
                "average": avg_occ,
                "peak": peak_occ,
                "lowest": lowest_occ
            },
            "trend": trend
        }

    @staticmethod
    async def get_booking_analytics(
        property_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Compute booking status breakdown, source distribution, length of stay."""
        db = get_database()
        
        match_filter: Dict[str, Any] = {}
        if property_id and ObjectId.is_valid(property_id):
            match_filter["property_id"] = ObjectId(property_id)
        if start_date or end_date:
            date_cond = {}
            if start_date:
                date_cond["$gte"] = start_date
            if end_date:
                date_cond["$lte"] = end_date
            match_filter["check_in_date"] = date_cond

        reservations = await db.reservations.find(match_filter).to_list(length=1000)
        total_bookings = len(reservations)
        
        status_counts = {"CONFIRMED": 0, "CANCELLED": 0, "CHECKED_IN": 0, "CHECKED_OUT": 0, "NO_SHOW": 0}
        source_counts = {
            "DIRECT": 0, "WALK_IN": 0, "PHONE": 0, "WEBSITE": 0,
            "AGENCY": 0, "OTA": 0, "CORPORATE": 0
        }
        total_nights = 0

        for r in reservations:
            status = r.get("status", "CONFIRMED")
            status_counts[status] = status_counts.get(status, 0) + 1
            
            source = r.get("booking_source", "WEBSITE")
            source_counts[source] = source_counts.get(source, 0) + 1
            
            total_nights += int(r.get("nights", 1))

        cancellation_rate = round((status_counts["CANCELLED"] / total_bookings) * 100.0, 1) if total_bookings > 0 else 0.0
        avg_los = round(total_nights / total_bookings, 1) if total_bookings > 0 else 0.0

        bookings_by_source = [
            {"source": k, "count": v, "percentage": round((v / total_bookings) * 100.0, 1) if total_bookings > 0 else 0.0}
            for k, v in source_counts.items() if v > 0 or total_bookings == 0
        ]

        # Trend over past 14 days
        base_date = date.today() - timedelta(days=13)
        trend = []
        for i in range(14):
            day_str = (base_date + timedelta(days=i)).isoformat()
            day_count = sum(1 for r in reservations if r.get("check_in_date") == day_str)
            trend.append({"date": day_str, "bookings": day_count})

        return {
            "total_bookings": total_bookings,
            "confirmed": status_counts["CONFIRMED"],
            "cancelled": status_counts["CANCELLED"],
            "checked_in": status_counts["CHECKED_IN"],
            "checked_out": status_counts["CHECKED_OUT"],
            "no_show": status_counts["NO_SHOW"],
            "cancellation_rate": cancellation_rate,
            "average_length_of_stay": avg_los,
            "bookings_by_source": bookings_by_source,
            "trend": trend
        }

    @staticmethod
    async def get_forecast(
        property_id: Optional[str] = None,
        horizon_days: int = 7
    ) -> Dict[str, Any]:
        """Statistical 7-day or 30-day projection based on historical velocity & bookings."""
        db = get_database()
        
        horizon = min(max(horizon_days, 7), 30)
        
        room_match: Dict[str, Any] = {}
        if property_id and ObjectId.is_valid(property_id):
            room_match["property_id"] = ObjectId(property_id)
        total_rooms = await db.rooms.count_documents(room_match) or 1

        # Calculate historical average daily revenue and booking velocity
        past_res = await db.reservations.find({
            "status": {"$in": ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]}
        }).to_list(length=500)
        
        avg_booking_val = sum(float(r.get("total_amount", 0.0)) / max(int(r.get("nights", 1)), 1) for r in past_res) / max(len(past_res), 1)
        if avg_booking_val <= 0:
            avg_booking_val = 250.0

        forecast_list = []
        today = date.today()

        for i in range(1, horizon + 1):
            future_day = today + timedelta(days=i)
            future_day_str = future_day.isoformat()
            weekday = future_day.weekday()  # 4=Fri, 5=Sat

            # Check forward bookings already on the books
            forward_filter: Dict[str, Any] = {
                "check_in_date": {"$lte": future_day_str},
                "check_out_date": {"$gt": future_day_str},
                "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
            }
            if property_id and ObjectId.is_valid(property_id):
                forward_filter["property_id"] = ObjectId(property_id)

            known_booked = await db.reservations.count_documents(forward_filter)
            
            # Add weekend bump factor and pickup model
            weekend_factor = 1.25 if weekday in [4, 5] else 1.0
            pickup_ratio = max(0.2, (1.0 - (i / (horizon * 1.5))))
            projected_additional = int((total_rooms * 0.35) * pickup_ratio * weekend_factor)
            
            projected_occupied = min(known_booked + projected_additional, total_rooms)
            projected_occ_pct = round((projected_occupied / total_rooms) * 100.0, 1)
            projected_revenue = round(projected_occupied * avg_booking_val * weekend_factor, 2)
            projected_bookings = max(known_booked, int(projected_occupied * 0.4))

            forecast_list.append({
                "date": future_day_str,
                "occupancy": projected_occ_pct,
                "revenue": projected_revenue,
                "bookings": projected_bookings
            })

        return {
            "horizon_days": horizon,
            "forecast": forecast_list,
            "disclaimer": "Statistical projection based on historical velocity and active forward bookings. Not a financial guarantee."
        }
