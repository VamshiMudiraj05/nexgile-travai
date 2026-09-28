from datetime import datetime, timezone, date
import random
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.logging import logger
from app.database.mongodb import get_database
from app.models.reservation import reservation_helper
from app.schemas.reservation import (
    ReservationCreate,
    ReservationUpdate,
    ReservationResponse,
    PaginatedReservationResponse,
    ReservationStatus,
    AvailabilityCheckRequest,
    AvailabilityResponse,
)
from app.schemas.room import RoomStatus


class ReservationService:
    @staticmethod
    def generate_booking_reference() -> str:
        """Generate human-readable booking reference: NGX-YYYYMMDD-XXXXX."""
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        rand_suffix = f"{random.randint(10000, 99999)}"
        return f"NGX-{today_str}-{rand_suffix}"

    @staticmethod
    async def check_availability(req: AvailabilityCheckRequest) -> AvailabilityResponse:
        """Check room availability for given date range and property."""
        db = get_database()
        
        # Room query
        room_query: Dict[str, Any] = {
            "property_id": req.property_id,
            "status": {"$nin": [RoomStatus.MAINTENANCE.value, RoomStatus.OUT_OF_ORDER.value]}
        }
        if req.room_type_id:
            room_query["room_type_id"] = req.room_type_id
            
        all_rooms = await db.rooms.find(room_query).to_list(length=500)
        
        # Find overlapping active reservations
        # Overlap condition: res.check_in_date < req.check_out_date AND res.check_out_date > req.check_in_date
        c_in_str = req.check_in_date.isoformat() if isinstance(req.check_in_date, date) else str(req.check_in_date)
        c_out_str = req.check_out_date.isoformat() if isinstance(req.check_out_date, date) else str(req.check_out_date)
        
        overlapping_res = await db.reservations.find({
            "property_id": req.property_id,
            "status": {"$in": [ReservationStatus.CONFIRMED.value, ReservationStatus.CHECKED_IN.value]},
            "check_in_date": {"$lt": c_out_str},
            "check_out_date": {"$gt": c_in_str},
        }).to_list(length=1000)
        
        booked_room_ids = {str(r.get("room_id")) for r in overlapping_res if r.get("room_id")}
        
        available_rooms: List[dict] = []
        for room in all_rooms:
            r_id = str(room["_id"])
            if r_id not in booked_room_ids:
                # Fetch room type details
                rt_doc = await db.room_types.find_one({"_id": ObjectId(room["room_type_id"])})
                available_rooms.append({
                    "room_id": r_id,
                    "room_number": room["room_number"],
                    "floor": room["floor"],
                    "room_type_id": room["room_type_id"],
                    "room_type_name": rt_doc.get("name") if rt_doc else "Standard",
                    "base_price": rt_doc.get("base_price", 0.0) if rt_doc else 0.0,
                    "bed_type": rt_doc.get("bed_type", "KING") if rt_doc else "KING",
                    "max_occupancy": rt_doc.get("max_occupancy", 2) if rt_doc else 2,
                })
                
        return AvailabilityResponse(
            available_rooms=available_rooms,
            total_available=len(available_rooms),
            property_id=req.property_id,
            check_in_date=req.check_in_date,
            check_out_date=req.check_out_date,
        )

    @staticmethod
    async def create_reservation(res_in: ReservationCreate, user_id: str) -> ReservationResponse:
        db = get_database()
        
        # Verify property
        prop = await db.properties.find_one({"_id": ObjectId(res_in.property_id)})
        if not prop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
            
        # Verify guest
        guest = await db.guests.find_one({"_id": ObjectId(res_in.guest_id)})
        if not guest:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest profile not found")
            
        # Verify room
        room = await db.rooms.find_one({"_id": ObjectId(res_in.room_id)})
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
            
        if str(room.get("property_id")) != res_in.property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room does not belong to specified property")
            
        if str(room.get("room_type_id")) != res_in.room_type_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room type mismatch for selected room")

        # Check room status (maintenance / out of order)
        if room.get("status") in [RoomStatus.MAINTENANCE.value, RoomStatus.OUT_OF_ORDER.value]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Room {room.get('room_number')} is currently under {room.get('status')} and cannot be booked."
            )

        # Check overlapping active reservations
        c_in_str = res_in.check_in_date.isoformat()
        c_out_str = res_in.check_out_date.isoformat()
        
        overlap = await db.reservations.find_one({
            "room_id": res_in.room_id,
            "status": {"$in": [ReservationStatus.CONFIRMED.value, ReservationStatus.CHECKED_IN.value]},
            "check_in_date": {"$lt": c_out_str},
            "check_out_date": {"$gt": c_in_str},
        })
        if overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Room {room.get('room_number')} is not available for the selected dates ({c_in_str} to {c_out_str})."
            )

        now = datetime.now(timezone.utc)
        doc = res_in.model_dump()
        doc["check_in_date"] = c_in_str
        doc["check_out_date"] = c_out_str
        doc["booking_reference"] = ReservationService.generate_booking_reference()
        doc["created_at"] = now
        doc["updated_at"] = now
        doc["created_by"] = user_id

        res = await db.reservations.insert_one(doc)
        doc["_id"] = res.inserted_id
        
        # If reservation is confirmed, sync room status to RESERVED if currently AVAILABLE
        if res_in.status == ReservationStatus.CONFIRMED and room.get("status") == RoomStatus.AVAILABLE.value:
            await db.rooms.update_one(
                {"_id": ObjectId(res_in.room_id)},
                {"$set": {"status": RoomStatus.RESERVED.value, "updated_at": now}}
            )

        logger.info(f"Reservation created: {doc['booking_reference']} for room {room.get('room_number')}")
        
        rt_doc = await db.room_types.find_one({"_id": ObjectId(res_in.room_type_id)})
        guest_name = f"{guest.get('first_name', '')} {guest.get('last_name', '')}".strip()
        
        return ReservationResponse(**reservation_helper(
            doc,
            guest_name=guest_name,
            guest_email=guest.get("email"),
            guest_phone=guest.get("phone"),
            property_name=prop.get("name"),
            room_type_name=rt_doc.get("name") if rt_doc else None,
            room_number=room.get("room_number"),
        ))

    @staticmethod
    async def get_reservations(
        property_id: Optional[str] = None,
        date_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        guest_id: Optional[str] = None,
        room_id: Optional[str] = None,
        booking_reference: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedReservationResponse:
        db = get_database()
        query: Dict[str, Any] = {}

        if property_id:
            query["property_id"] = property_id
        if status_filter:
            query["status"] = status_filter
        if guest_id:
            query["guest_id"] = guest_id
        if room_id:
            query["room_id"] = room_id
        if booking_reference:
            query["booking_reference"] = {"$regex": booking_reference, "$options": "i"}
        if date_filter:
            query["$or"] = [
                {"check_in_date": date_filter},
                {"check_out_date": date_filter},
                {"$and": [{"check_in_date": {"$lte": date_filter}}, {"check_out_date": {"$gte": date_filter}}]}
            ]
        if search:
            query["$or"] = [
                {"booking_reference": {"$regex": search, "$options": "i"}},
            ]

        total = await db.reservations.count_documents(query)
        total_pages = max(1, (total + limit - 1) // limit)
        skip = (page - 1) * limit

        cursor = db.reservations.find(query).sort("created_at", -1).skip(skip).limit(limit)
        reservations = await cursor.to_list(length=limit)

        items: List[ReservationResponse] = []
        for r in reservations:
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

            items.append(ReservationResponse(**reservation_helper(
                r,
                guest_name=g_name,
                guest_email=g_email,
                guest_phone=g_phone,
                property_name=p_name,
                room_type_name=rt_name,
                room_number=r_num,
            )))

        return PaginatedReservationResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_reservation_by_id(reservation_id: str) -> ReservationResponse:
        db = get_database()
        if not ObjectId.is_valid(reservation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reservation ID format")

        r = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

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

        return ReservationResponse(**reservation_helper(
            r,
            guest_name=g_name,
            guest_email=g_email,
            guest_phone=g_phone,
            property_name=p_name,
            room_type_name=rt_name,
            room_number=r_num,
        ))

    @staticmethod
    async def confirm_reservation(reservation_id: str, user_id: str) -> ReservationResponse:
        db = get_database()
        res = await ReservationService.get_reservation_by_id(reservation_id)
        if res.status == ReservationStatus.CONFIRMED:
            return res
            
        now = datetime.now(timezone.utc)
        await db.reservations.update_one(
            {"_id": ObjectId(reservation_id)},
            {"$set": {"status": ReservationStatus.CONFIRMED.value, "updated_at": now}}
        )
        # Update room to RESERVED if currently AVAILABLE
        await db.rooms.update_one(
            {"_id": ObjectId(res.room_id), "status": RoomStatus.AVAILABLE.value},
            {"$set": {"status": RoomStatus.RESERVED.value, "updated_at": now}}
        )
        logger.info(f"Reservation {res.booking_reference} confirmed by {user_id}")
        return await ReservationService.get_reservation_by_id(reservation_id)

    @staticmethod
    async def cancel_reservation(reservation_id: str, user_id: str) -> ReservationResponse:
        db = get_database()
        res = await ReservationService.get_reservation_by_id(reservation_id)
        if res.status in [ReservationStatus.CHECKED_IN, ReservationStatus.CHECKED_OUT]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel reservation in state '{res.status}'."
            )
            
        now = datetime.now(timezone.utc)
        await db.reservations.update_one(
            {"_id": ObjectId(reservation_id)},
            {"$set": {"status": ReservationStatus.CANCELLED.value, "updated_at": now}}
        )
        # Revert room to AVAILABLE if it was RESERVED
        await db.rooms.update_one(
            {"_id": ObjectId(res.room_id), "status": RoomStatus.RESERVED.value},
            {"$set": {"status": RoomStatus.AVAILABLE.value, "updated_at": now}}
        )
        logger.info(f"Reservation {res.booking_reference} cancelled by {user_id}")
        return await ReservationService.get_reservation_by_id(reservation_id)

    @staticmethod
    async def check_in_guest(reservation_id: str, user_id: str) -> ReservationResponse:
        """Check in guest: CONFIRMED -> CHECKED_IN and Room -> OCCUPIED."""
        db = get_database()
        res = await ReservationService.get_reservation_by_id(reservation_id)
        
        if res.status != ReservationStatus.CONFIRMED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot check in reservation with status '{res.status}'. Reservation must be CONFIRMED."
            )

        now = datetime.now(timezone.utc)

        # 1. Update reservation status
        await db.reservations.update_one(
            {"_id": ObjectId(reservation_id)},
            {"$set": {
                "status": ReservationStatus.CHECKED_IN.value,
                "checked_in_at": now,
                "checked_in_by": user_id,
                "updated_at": now,
            }}
        )

        # 2. Update room status to OCCUPIED
        room = await db.rooms.find_one({"_id": ObjectId(res.room_id)})
        prev_status = room.get("status", RoomStatus.AVAILABLE.value) if room else RoomStatus.AVAILABLE.value
        
        await db.rooms.update_one(
            {"_id": ObjectId(res.room_id)},
            {"$set": {
                "status": RoomStatus.OCCUPIED.value,
                "updated_at": now,
            }}
        )

        # 3. Record room status history
        await db.room_status_history.insert_one({
            "room_id": res.room_id,
            "previous_status": prev_status,
            "new_status": RoomStatus.OCCUPIED.value,
            "changed_by": user_id,
            "changed_at": now,
            "reason": f"Guest check-in for booking {res.booking_reference}",
        })

        logger.info(f"Guest checked in for booking {res.booking_reference}. Room {res.room_number} -> OCCUPIED")
        return await ReservationService.get_reservation_by_id(reservation_id)

    @staticmethod
    async def check_out_guest(reservation_id: str, user_id: str) -> ReservationResponse:
        """Check out guest: CHECKED_IN -> CHECKED_OUT and Room -> CLEANING."""
        db = get_database()
        res = await ReservationService.get_reservation_by_id(reservation_id)

        if res.status != ReservationStatus.CHECKED_IN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot check out reservation with status '{res.status}'. Reservation must be CHECKED_IN."
            )

        now = datetime.now(timezone.utc)

        # 1. Update reservation status
        await db.reservations.update_one(
            {"_id": ObjectId(reservation_id)},
            {"$set": {
                "status": ReservationStatus.CHECKED_OUT.value,
                "checked_out_at": now,
                "checked_out_by": user_id,
                "updated_at": now,
            }}
        )

        # 2. Move room status to CLEANING (not immediately AVAILABLE)
        room = await db.rooms.find_one({"_id": ObjectId(res.room_id)})
        prev_status = room.get("status", RoomStatus.OCCUPIED.value) if room else RoomStatus.OCCUPIED.value

        await db.rooms.update_one(
            {"_id": ObjectId(res.room_id)},
            {"$set": {
                "status": RoomStatus.CLEANING.value,
                "housekeeping_status": "DIRTY",
                "updated_at": now,
            }}
        )

        # 3. Record room status history
        await db.room_status_history.insert_one({
            "room_id": res.room_id,
            "previous_status": prev_status,
            "new_status": RoomStatus.CLEANING.value,
            "changed_by": user_id,
            "changed_at": now,
            "reason": f"Guest check-out for booking {res.booking_reference}",
        })

        logger.info(f"Guest checked out for booking {res.booking_reference}. Room {res.room_number} -> CLEANING")
        return await ReservationService.get_reservation_by_id(reservation_id)


reservation_service = ReservationService()
