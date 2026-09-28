from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.logging import logger
from app.database.mongodb import get_database
from app.models.room import room_helper
from app.schemas.room import (
    RoomCreate,
    RoomUpdate,
    RoomStatusUpdate,
    RoomResponse,
    PaginatedRoomResponse,
    RoomStatus,
    VALID_ROOM_STATUS_TRANSITIONS,
)


class RoomService:
    @staticmethod
    async def create_room(property_id: str, room_in: RoomCreate) -> RoomResponse:
        db = get_database()
        if not ObjectId.is_valid(property_id) or not ObjectId.is_valid(room_in.room_type_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")

        # Verify property exists
        prop = await db.properties.find_one({"_id": ObjectId(property_id)})
        if not prop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

        # Verify room type exists and belongs to property
        rt = await db.room_types.find_one({"_id": ObjectId(room_in.room_type_id), "property_id": property_id})
        if not rt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found for this property")

        now = datetime.now(timezone.utc)
        doc = room_in.model_dump()
        doc["property_id"] = property_id
        doc["room_number"] = room_in.room_number.strip().upper()
        doc["created_at"] = now
        doc["updated_at"] = now

        try:
            res = await db.rooms.insert_one(doc)
            doc["_id"] = res.inserted_id
            logger.info(f"Room created: #{doc['room_number']} in property {property_id}")
            return RoomResponse(**room_helper(
                doc,
                property_name=prop.get("name"),
                room_type_name=rt.get("name")
            ))
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Room number '{room_in.room_number}' already exists in this property."
            )

    @staticmethod
    async def get_rooms(
        property_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        room_type_id: Optional[str] = None,
        floor: Optional[int] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> PaginatedRoomResponse:
        db = get_database()
        query: Dict[str, Any] = {}

        if property_id:
            query["property_id"] = property_id
        if status_filter:
            query["status"] = status_filter
        if room_type_id:
            query["room_type_id"] = room_type_id
        if floor is not None:
            query["floor"] = floor
        if search:
            query["room_number"] = {"$regex": search, "$options": "i"}

        total = await db.rooms.count_documents(query)
        total_pages = max(1, (total + limit - 1) // limit)
        skip = (page - 1) * limit

        cursor = db.rooms.find(query).sort([("floor", 1), ("room_number", 1)]).skip(skip).limit(limit)
        rooms = await cursor.to_list(length=limit)

        items: List[RoomResponse] = []
        for room in rooms:
            p_id = room.get("property_id")
            rt_id = room.get("room_type_id")
            r_id = str(room["_id"])

            prop_name = None
            rt_name = None
            if ObjectId.is_valid(p_id):
                prop_doc = await db.properties.find_one({"_id": ObjectId(p_id)}, {"name": 1})
                if prop_doc:
                    prop_name = prop_doc.get("name")

            if ObjectId.is_valid(rt_id):
                rt_doc = await db.room_types.find_one({"_id": ObjectId(rt_id)}, {"name": 1})
                if rt_doc:
                    rt_name = rt_doc.get("name")

            # Check active reservation
            current_guest_name = None
            current_reservation_id = None
            active_res = await db.reservations.find_one({
                "room_id": r_id,
                "status": {"$in": ["CHECKED_IN", "CONFIRMED"]}
            })
            if active_res:
                current_reservation_id = str(active_res["_id"])
                guest_id = active_res.get("guest_id")
                if ObjectId.is_valid(guest_id):
                    guest_doc = await db.guests.find_one({"_id": ObjectId(guest_id)})
                    if guest_doc:
                        current_guest_name = f"{guest_doc.get('first_name', '')} {guest_doc.get('last_name', '')}".strip()

            items.append(RoomResponse(**room_helper(
                room,
                property_name=prop_name,
                room_type_name=rt_name,
                current_guest_name=current_guest_name,
                current_reservation_id=current_reservation_id,
            )))

        return PaginatedRoomResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_room_by_id(room_id: str) -> RoomResponse:
        db = get_database()
        if not ObjectId.is_valid(room_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room ID format")

        room = await db.rooms.find_one({"_id": ObjectId(room_id)})
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

        prop_name = None
        rt_name = None
        if ObjectId.is_valid(room.get("property_id")):
            prop_doc = await db.properties.find_one({"_id": ObjectId(room["property_id"])}, {"name": 1})
            if prop_doc:
                prop_name = prop_doc.get("name")

        if ObjectId.is_valid(room.get("room_type_id")):
            rt_doc = await db.room_types.find_one({"_id": ObjectId(room["room_type_id"])}, {"name": 1})
            if rt_doc:
                rt_name = rt_doc.get("name")

        current_guest_name = None
        current_reservation_id = None
        active_res = await db.reservations.find_one({
            "room_id": room_id,
            "status": {"$in": ["CHECKED_IN", "CONFIRMED"]}
        })
        if active_res:
            current_reservation_id = str(active_res["_id"])
            guest_id = active_res.get("guest_id")
            if ObjectId.is_valid(guest_id):
                guest_doc = await db.guests.find_one({"_id": ObjectId(guest_id)})
                if guest_doc:
                    current_guest_name = f"{guest_doc.get('first_name', '')} {guest_doc.get('last_name', '')}".strip()

        return RoomResponse(**room_helper(
            room,
            property_name=prop_name,
            room_type_name=rt_name,
            current_guest_name=current_guest_name,
            current_reservation_id=current_reservation_id,
        ))

    @staticmethod
    async def update_room(room_id: str, room_in: RoomUpdate) -> RoomResponse:
        db = get_database()
        if not ObjectId.is_valid(room_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room ID format")

        update_data = {k: v for k, v in room_in.model_dump().items() if v is not None}
        if not update_data:
            return await RoomService.get_room_by_id(room_id)

        if "room_number" in update_data:
            update_data["room_number"] = update_data["room_number"].strip().upper()

        update_data["updated_at"] = datetime.now(timezone.utc)

        try:
            await db.rooms.update_one({"_id": ObjectId(room_id)}, {"$set": update_data})
            return await RoomService.get_room_by_id(room_id)
        except DuplicateKeyError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Room number already in use for this property.")

    @staticmethod
    async def update_room_status(room_id: str, status_in: RoomStatusUpdate, user_id: str) -> RoomResponse:
        """Validate state machine transition and record audit history."""
        db = get_database()
        if not ObjectId.is_valid(room_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room ID format")

        room = await db.rooms.find_one({"_id": ObjectId(room_id)})
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

        current_status = RoomStatus(room.get("status", RoomStatus.AVAILABLE))
        new_status = status_in.status

        # If already same status, return
        if current_status == new_status:
            return await RoomService.get_room_by_id(room_id)

        # Validate transition
        allowed = VALID_ROOM_STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid room status transition from '{current_status.value}' to '{new_status.value}'."
            )

        now = datetime.now(timezone.utc)

        # Record history
        history_doc = {
            "room_id": room_id,
            "previous_status": current_status.value,
            "new_status": new_status.value,
            "changed_by": user_id,
            "changed_at": now,
            "reason": status_in.reason or f"Status changed to {new_status.value}",
        }
        await db.room_status_history.insert_one(history_doc)

        # Update room
        await db.rooms.update_one(
            {"_id": ObjectId(room_id)},
            {"$set": {
                "status": new_status.value,
                "updated_at": now
            }}
        )

        logger.info(f"Room {room.get('room_number')} status changed: {current_status.value} -> {new_status.value} by {user_id}")
        return await RoomService.get_room_by_id(room_id)

    @staticmethod
    async def delete_room(room_id: str) -> Dict[str, Any]:
        db = get_database()
        if not ObjectId.is_valid(room_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room ID format")

        # Check for active reservations
        active_res = await db.reservations.count_documents({
            "room_id": room_id,
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
        })
        if active_res > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete room with {active_res} active or confirmed reservations."
            )

        res = await db.rooms.delete_one({"_id": ObjectId(room_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

        logger.info(f"Room {room_id} deleted.")
        return {"status": "success", "message": "Room deleted successfully."}


room_service = RoomService()
