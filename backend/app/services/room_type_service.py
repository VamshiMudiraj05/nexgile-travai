from datetime import datetime, timezone
from typing import List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.logging import logger
from app.database.mongodb import get_database
from app.models.room_type import room_type_helper
from app.schemas.property import ImageMetadata
from app.schemas.room_type import RoomTypeCreate, RoomTypeUpdate, RoomTypeResponse
from app.services.cloudinary_service import cloudinary_service


class RoomTypeService:
    @staticmethod
    async def create_room_type(property_id: str, rt_in: RoomTypeCreate) -> RoomTypeResponse:
        db = get_database()
        if not ObjectId.is_valid(property_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid property ID format")
            
        # Verify property exists
        property_doc = await db.properties.find_one({"_id": ObjectId(property_id)})
        if not property_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
            
        now = datetime.now(timezone.utc)
        doc = rt_in.model_dump()
        doc["property_id"] = property_id
        doc["code"] = rt_in.code.upper().strip()
        doc["created_at"] = now
        doc["updated_at"] = now
        
        try:
            res = await db.room_types.insert_one(doc)
            doc["_id"] = res.inserted_id
            logger.info(f"Room type created: {rt_in.name} ({doc['code']}) for property {property_id}")
            return RoomTypeResponse(**room_type_helper(doc, total_rooms=0))
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Room type code '{rt_in.code}' already exists for this property."
            )

    @staticmethod
    async def get_room_types_by_property(property_id: str) -> List[RoomTypeResponse]:
        db = get_database()
        cursor = db.room_types.find({"property_id": property_id}).sort("created_at", 1)
        room_types = await cursor.to_list(length=100)
        
        items: List[RoomTypeResponse] = []
        for rt in room_types:
            rt_id = str(rt["_id"])
            total_rooms = await db.rooms.count_documents({"room_type_id": rt_id})
            items.append(RoomTypeResponse(**room_type_helper(rt, total_rooms)))
        return items

    @staticmethod
    async def get_room_type_by_id(room_type_id: str) -> RoomTypeResponse:
        db = get_database()
        if not ObjectId.is_valid(room_type_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room type ID format")
            
        rt = await db.room_types.find_one({"_id": ObjectId(room_type_id)})
        if not rt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")
            
        total_rooms = await db.rooms.count_documents({"room_type_id": room_type_id})
        return RoomTypeResponse(**room_type_helper(rt, total_rooms))

    @staticmethod
    async def update_room_type(room_type_id: str, rt_in: RoomTypeUpdate) -> RoomTypeResponse:
        db = get_database()
        if not ObjectId.is_valid(room_type_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room type ID format")
            
        update_data = {k: v for k, v in rt_in.model_dump().items() if v is not None}
        if not update_data:
            return await RoomTypeService.get_room_type_by_id(room_type_id)
            
        if "code" in update_data:
            update_data["code"] = update_data["code"].upper().strip()
            
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        try:
            await db.room_types.update_one({"_id": ObjectId(room_type_id)}, {"$set": update_data})
            return await RoomTypeService.get_room_type_by_id(room_type_id)
        except DuplicateKeyError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Room type code already in use for this property.")

    @staticmethod
    async def delete_room_type(room_type_id: str) -> Dict[str, Any]:
        db = get_database()
        if not ObjectId.is_valid(room_type_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room type ID format")
            
        # Check if rooms exist for this room type
        assigned_rooms = await db.rooms.count_documents({"room_type_id": room_type_id})
        if assigned_rooms > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete room type with {assigned_rooms} assigned rooms."
            )
            
        res = await db.room_types.delete_one({"_id": ObjectId(room_type_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")
            
        logger.info(f"Room type {room_type_id} deleted.")
        return {"status": "success", "message": "Room type deleted successfully."}

    @staticmethod
    async def add_room_type_image(room_type_id: str, image: ImageMetadata) -> RoomTypeResponse:
        db = get_database()
        if not ObjectId.is_valid(room_type_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room type ID format")
            
        await db.room_types.update_one(
            {"_id": ObjectId(room_type_id)},
            {"$push": {"images": image.model_dump()}}
        )
        return await RoomTypeService.get_room_type_by_id(room_type_id)

    @staticmethod
    async def delete_room_type_image(room_type_id: str, public_id: str) -> RoomTypeResponse:
        db = get_database()
        if not ObjectId.is_valid(room_type_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid room type ID format")
            
        await cloudinary_service.delete_image(public_id)
        await db.room_types.update_one(
            {"_id": ObjectId(room_type_id)},
            {"$pull": {"images": {"public_id": public_id}}}
        )
        return await RoomTypeService.get_room_type_by_id(room_type_id)


room_type_service = RoomTypeService()
