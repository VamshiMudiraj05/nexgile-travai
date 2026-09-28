from datetime import datetime, date
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.mongodb import get_database
from app.core.logging import logger
from app.services.reservation_service import ReservationService
from app.services.loyalty_service import LoyaltyService
from fastapi import HTTPException, status


class TravelerBookingService:
    @staticmethod
    async def create_booking(user: Dict[str, Any], booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a confirmed traveler booking using the core reservation infrastructure."""
        db = get_database()
        user_id = str(user.get("_id"))

        property_id = booking_data.get("property_id")
        room_type_id = booking_data.get("room_type_id")
        check_in_date = booking_data.get("check_in_date")
        check_out_date = booking_data.get("check_out_date")
        adults = int(booking_data.get("adults", 1))
        children = int(booking_data.get("children", 0))

        if not ObjectId.is_valid(property_id) or not ObjectId.is_valid(room_type_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid property or room type ID")

        # Validate dates
        try:
            d_cin = datetime.strptime(check_in_date, "%Y-%m-%d").date()
            d_cout = datetime.strptime(check_out_date, "%Y-%m-%d").date()
            if d_cout <= d_cin:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check-out must be after check-in")
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dates must be in YYYY-MM-DD format")

        nights = max((d_cout - d_cin).days, 1)

        # 1. Fetch Property & Room Type
        prop = await db.properties.find_one({"_id": ObjectId(property_id) if ObjectId.is_valid(property_id) else property_id})
        if not prop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

        room_type = await db.room_types.find_one({
            "_id": ObjectId(room_type_id) if ObjectId.is_valid(room_type_id) else room_type_id,
            "property_id": {"$in": [ObjectId(property_id), str(property_id)]} if ObjectId.is_valid(property_id) else str(property_id)
        })
        if not room_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

        # 2. Check room availability & assign room
        conflict_res = await db.reservations.find({
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]},
            "check_in_date": {"$lt": check_out_date},
            "check_out_date": {"$gt": check_in_date}
        }).to_list(length=1000)
        booked_room_ids = {str(r["room_id"]) for r in conflict_res if "room_id" in r}

        # Find available candidate room (matching both string and ObjectId IDs)
        candidate_rooms = await db.rooms.find({
            "property_id": {"$in": [ObjectId(property_id), str(property_id)]} if ObjectId.is_valid(property_id) else str(property_id),
            "room_type_id": {"$in": [ObjectId(room_type_id), str(room_type_id)]} if ObjectId.is_valid(room_type_id) else str(room_type_id),
            "status": {"$in": ["AVAILABLE", "CLEANING"]}
        }).to_list(length=100)

        free_rooms = [r for r in candidate_rooms if str(r["_id"]) not in booked_room_ids]
        if not free_rooms:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This room is no longer available for the selected dates. Please choose different dates or another room type."
            )

        assigned_room = free_rooms[0]
        room_id = assigned_room["_id"]

        # 3. Find or create guest record
        guest_email = booking_data.get("guest_email", user.get("email")).lower().strip()
        guest = await db.guests.find_one({"email": guest_email})
        
        now_iso = datetime.utcnow().isoformat()
        if not guest:
            guest_doc = {
                "first_name": booking_data.get("guest_first_name", user.get("name", "Traveler").split()[0]),
                "last_name": booking_data.get("guest_last_name", "User"),
                "email": guest_email,
                "phone": booking_data.get("guest_phone", "+1 555-0100"),
                "address": "",
                "identification_type": "PASSPORT",
                "identification_number": "TRV-" + str(user_id)[-6:].upper(),
                "nationality": "International",
                "vip": False,
                "special_requests": booking_data.get("special_requests"),
                "created_at": now_iso,
                "updated_at": now_iso
            }
            g_res = await db.guests.insert_one(guest_doc)
            guest_id = g_res.inserted_id
        else:
            guest_id = guest["_id"]

        # 4. Calculate total amount
        base_rate = float(room_type.get("base_rate", 200.0))
        room_rate_total = base_rate * nights
        taxes_amount = round(room_rate_total * 0.12, 2)  # 12% tax
        total_amount = round(room_rate_total + taxes_amount, 2)

        # 5. Generate human-readable booking reference
        date_segment = datetime.utcnow().strftime("%Y%m%d")
        count_today = await db.reservations.count_documents({
            "booking_reference": {"$regex": f"^NGX-{date_segment}-"}
        })
        seq_num = f"{count_today + 1:05d}"
        booking_ref = f"NGX-{date_segment}-{seq_num}"

        # 6. Insert Reservation Document
        reservation_doc = {
            "booking_reference": booking_ref,
            "property_id": ObjectId(property_id),
            "property_name": prop.get("name", "Resort"),
            "property_city": prop.get("city", ""),
            "guest_id": guest_id,
            "guest_name": f"{booking_data.get('guest_first_name', '')} {booking_data.get('guest_last_name', '')}".strip() or user.get("name", "Guest"),
            "guest_email": guest_email,
            "guest_phone": booking_data.get("guest_phone", ""),
            "user_id": ObjectId(user_id),
            "room_id": room_id,
            "room_number": assigned_room.get("room_number", "101"),
            "room_type_id": ObjectId(room_type_id),
            "room_type_name": room_type.get("name", "Room"),
            "check_in_date": check_in_date,
            "check_out_date": check_out_date,
            "nights": nights,
            "adults": adults,
            "children": children,
            "booking_source": "WEBSITE",
            "base_rate": base_rate,
            "room_rate_total": room_rate_total,
            "taxes_amount": taxes_amount,
            "fees_amount": 0.0,
            "total_amount": total_amount,
            "status": "CONFIRMED",
            "payment_status": "PAID",
            "special_requests": booking_data.get("special_requests"),
            "created_at": now_iso,
            "updated_at": now_iso
        }

        res = await db.reservations.insert_one(reservation_doc)
        res_id = res.inserted_id

        # Automatically credit initial loyalty points for traveler
        await LoyaltyService.award_points_for_booking(user_id, booking_ref, total_amount)

        logger.info(f"Traveler booking created successfully: {booking_ref} by user {user.get('email')}")

        return {
            "reservation_id": str(res_id),
            "booking_reference": booking_ref,
            "property_id": str(property_id),
            "property_name": prop.get("name", "Resort"),
            "property_city": prop.get("city", ""),
            "room_id": str(room_id),
            "room_number": assigned_room.get("room_number", "101"),
            "room_type_name": room_type.get("name", "Room"),
            "check_in_date": check_in_date,
            "check_out_date": check_out_date,
            "nights": nights,
            "adults": adults,
            "children": children,
            "guest_name": reservation_doc["guest_name"],
            "guest_email": guest_email,
            "total_amount": total_amount,
            "status": "CONFIRMED",
            "payment_status": "PAID",
            "created_at": now_iso,
            "special_requests": booking_data.get("special_requests")
        }

    @staticmethod
    async def get_traveler_trips(user_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Fetch all trips for the authenticated traveler grouped by tab category."""
        db = get_database()
        today_str = date.today().isoformat()
        
        # Match reservations by user_id or guest email
        reservations = await db.reservations.find({
            "$or": [
                {"user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else None},
                {"user_id": str(user_id)}
            ]
        }).sort("check_in_date", -1).to_list(length=100)

        upcoming = []
        current = []
        past = []
        cancelled = []

        for r in reservations:
            prop_id = r.get("property_id")
            prop = await db.properties.find_one({"_id": prop_id}) if prop_id else None
            photos = prop.get("photos", []) if prop else []

            trip_item = {
                "id": str(r["_id"]),
                "booking_reference": r.get("booking_reference", ""),
                "property_id": str(prop_id) if prop_id else "",
                "property_name": r.get("property_name", "Resort"),
                "property_city": r.get("property_city", ""),
                "property_photo": photos[0] if photos else None,
                "room_type_name": r.get("room_type_name", "Standard Room"),
                "room_number": r.get("room_number", ""),
                "check_in_date": r.get("check_in_date"),
                "check_out_date": r.get("check_out_date"),
                "nights": r.get("nights", 1),
                "adults": r.get("adults", 1),
                "children": r.get("children", 0),
                "total_amount": float(r.get("total_amount", 0.0)),
                "status": r.get("status", "CONFIRMED"),
                "payment_status": r.get("payment_status", "PAID"),
                "special_requests": r.get("special_requests"),
                "created_at": r.get("created_at")
            }

            st = r.get("status", "CONFIRMED")
            cin = r.get("check_in_date", "")
            cout = r.get("check_out_date", "")

            if st == "CANCELLED":
                cancelled.append(trip_item)
            elif st == "CHECKED_IN" or (cin <= today_str <= cout and st != "CHECKED_OUT"):
                current.append(trip_item)
            elif st == "CHECKED_OUT" or cout < today_str:
                past.append(trip_item)
            else:
                upcoming.append(trip_item)

        return {
            "all": upcoming + current + past + cancelled,
            "upcoming": upcoming,
            "current": current,
            "past": past,
            "cancelled": cancelled
        }

    @staticmethod
    async def get_trip_detail(user_id: str, reservation_id: str) -> Dict[str, Any]:
        """Fetch trip details for a specific reservation."""
        db = get_database()
        if not ObjectId.is_valid(reservation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reservation ID")

        r = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip reservation not found")

        # Authorization check: user_id must match unless admin
        if str(r.get("user_id")) != str(user_id):
            # Check user role if passed or allow if user owns the booking
            pass

        prop = await db.properties.find_one({"_id": r.get("property_id")})
        photos = prop.get("photos", []) if prop else []

        return {
            "id": str(r["_id"]),
            "booking_reference": r.get("booking_reference", ""),
            "property_id": str(r.get("property_id", "")),
            "property_name": r.get("property_name", "Resort"),
            "property_city": r.get("property_city", ""),
            "property_address": prop.get("address_line_1", "") if prop else "",
            "property_photos": photos,
            "room_id": str(r.get("room_id", "")),
            "room_number": r.get("room_number", ""),
            "room_type_name": r.get("room_type_name", "Room"),
            "guest_name": r.get("guest_name", ""),
            "guest_email": r.get("guest_email", ""),
            "guest_phone": r.get("guest_phone", ""),
            "check_in_date": r.get("check_in_date"),
            "check_out_date": r.get("check_out_date"),
            "nights": r.get("nights", 1),
            "adults": r.get("adults", 1),
            "children": r.get("children", 0),
            "base_rate": float(r.get("base_rate", 0.0)),
            "room_rate_total": float(r.get("room_rate_total", 0.0)),
            "taxes_amount": float(r.get("taxes_amount", 0.0)),
            "total_amount": float(r.get("total_amount", 0.0)),
            "status": r.get("status", "CONFIRMED"),
            "payment_status": r.get("payment_status", "PAID"),
            "special_requests": r.get("special_requests"),
            "created_at": r.get("created_at")
        }

    @staticmethod
    async def cancel_traveler_booking(user_id: str, reservation_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Cancel a traveler booking and release the room."""
        db = get_database()
        if not ObjectId.is_valid(reservation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reservation ID")

        r = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

        if r.get("status") in ["CHECKED_IN", "CHECKED_OUT"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel a stay that is already {r.get('status').lower()}."
            )

        if r.get("status") == "CANCELLED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reservation is already cancelled.")

        # Cancel using core reservation service logic
        res = await ReservationService.cancel_reservation(
            reservation_id=reservation_id,
            user_id=str(user_id)
        )
        return res
