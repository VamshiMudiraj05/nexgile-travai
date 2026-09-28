from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.logging import logger
from app.database.mongodb import get_database
from app.models.guest import guest_helper
from app.schemas.guest import GuestCreate, GuestUpdate, GuestResponse, PaginatedGuestResponse


class GuestService:
    @staticmethod
    async def create_guest(guest_in: GuestCreate) -> GuestResponse:
        db = get_database()
        now = datetime.now(timezone.utc)
        doc = guest_in.model_dump()
        doc["email"] = guest_in.email.lower().strip()
        doc["phone"] = guest_in.phone.strip()
        doc["created_at"] = now
        doc["updated_at"] = now

        res = await db.guests.insert_one(doc)
        doc["_id"] = res.inserted_id
        logger.info(f"Guest profile created: {guest_in.first_name} {guest_in.last_name} ({doc['email']})")
        return GuestResponse(**guest_helper(doc, total_bookings=0))

    @staticmethod
    async def get_guests(
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> PaginatedGuestResponse:
        db = get_database()
        query: Dict[str, Any] = {}

        if search:
            query["$or"] = [
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
            ]

        total = await db.guests.count_documents(query)
        total_pages = max(1, (total + limit - 1) // limit)
        skip = (page - 1) * limit

        cursor = db.guests.find(query).sort("created_at", -1).skip(skip).limit(limit)
        guests = await cursor.to_list(length=limit)

        items: List[GuestResponse] = []
        for guest in guests:
            g_id = str(guest["_id"])
            total_bookings = await db.reservations.count_documents({"guest_id": g_id})
            items.append(GuestResponse(**guest_helper(guest, total_bookings=total_bookings)))

        return PaginatedGuestResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_guest_by_id(guest_id: str) -> GuestResponse:
        db = get_database()
        if not ObjectId.is_valid(guest_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid guest ID format")

        guest = await db.guests.find_one({"_id": ObjectId(guest_id)})
        if not guest:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")

        total_bookings = await db.reservations.count_documents({"guest_id": guest_id})
        return GuestResponse(**guest_helper(guest, total_bookings=total_bookings))

    @staticmethod
    async def update_guest(guest_id: str, guest_in: GuestUpdate) -> GuestResponse:
        db = get_database()
        if not ObjectId.is_valid(guest_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid guest ID format")

        update_data = {k: v for k, v in guest_in.model_dump().items() if v is not None}
        if not update_data:
            return await GuestService.get_guest_by_id(guest_id)

        if "email" in update_data:
            update_data["email"] = update_data["email"].lower().strip()
        if "phone" in update_data:
            update_data["phone"] = update_data["phone"].strip()

        update_data["updated_at"] = datetime.now(timezone.utc)

        await db.guests.update_one({"_id": ObjectId(guest_id)}, {"$set": update_data})
        return await GuestService.get_guest_by_id(guest_id)

    @staticmethod
    async def delete_guest(guest_id: str) -> Dict[str, Any]:
        db = get_database()
        if not ObjectId.is_valid(guest_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid guest ID format")

        # Check active reservations
        active_res = await db.reservations.count_documents({
            "guest_id": guest_id,
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
        })
        if active_res > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete guest with {active_res} active or confirmed reservations."
            )

        res = await db.guests.delete_one({"_id": ObjectId(guest_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")

        logger.info(f"Guest {guest_id} deleted.")
        return {"status": "success", "message": "Guest profile deleted successfully."}


guest_service = GuestService()
