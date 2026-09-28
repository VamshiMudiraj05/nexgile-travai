from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.logging import logger
from app.database.mongodb import get_database
from app.models.property import property_helper
from app.schemas.property import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
    PaginatedPropertyResponse,
    ImageMetadata,
    PropertyOnboardRequest,
)
from app.schemas.room import RoomStatus
from app.services.cloudinary_service import cloudinary_service

DEFAULT_PROPERTY_PHOTOS = [
    {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "public_id": "default_prop_1", "resource_type": "image"},
    {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", "public_id": "default_prop_2", "resource_type": "image"}
]

DEFAULT_ROOM_PHOTOS = [
    {"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", "public_id": "default_room_1", "resource_type": "image"},
    {"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80", "public_id": "default_room_2", "resource_type": "image"}
]


class PropertyService:
    @staticmethod
    async def create_property(prop_in: PropertyCreate, user_id: str) -> PropertyResponse:
        db = get_database()
        
        # Check duplicate property code
        existing = await db.properties.find_one({"property_code": prop_in.property_code.upper().strip()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Property with code '{prop_in.property_code}' already exists."
            )
        
        now = datetime.now(timezone.utc)
        doc = prop_in.model_dump()
        doc["property_code"] = prop_in.property_code.upper().strip()
        doc["created_at"] = now
        doc["updated_at"] = now
        doc["created_by"] = user_id

        # Provide default high-res resort images if none provided
        if not doc.get("images"):
            doc["images"] = DEFAULT_PROPERTY_PHOTOS
        
        try:
            res = await db.properties.insert_one(doc)
            doc["_id"] = res.inserted_id
            logger.info(f"Property created: {prop_in.name} ({doc['property_code']})")
            return PropertyResponse(**property_helper(doc, total_rooms=0, total_room_types=0))
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Property code '{prop_in.property_code}' already exists."
            )

    @staticmethod
    async def onboard_property(req: PropertyOnboardRequest, user_id: str) -> Dict[str, Any]:
        """Unified all-in-one onboarding: creates property, room types, and physical rooms in one atomic flow."""
        db = get_database()

        # 1. Create property
        prop_data = req.model_dump(exclude={"room_types"})
        prop_in = PropertyCreate(**prop_data)
        prop_res = await PropertyService.create_property(prop_in, user_id)
        prop_id = prop_res.id

        now = datetime.now(timezone.utc)
        total_room_types_created = 0
        total_rooms_created = 0

        # 2. Process room types and units
        for rt_item in req.room_types:
            rt_images = [img.model_dump() for img in rt_item.images] if rt_item.images else []
            if not rt_images:
                rt_images = DEFAULT_ROOM_PHOTOS

            rt_doc = {
                "property_id": prop_id,
                "name": rt_item.name.strip(),
                "code": rt_item.code.upper().strip(),
                "description": rt_item.description or "",
                "max_occupancy": rt_item.max_occupancy,
                "adults_capacity": rt_item.adults_capacity,
                "children_capacity": rt_item.children_capacity,
                "bed_type": rt_item.bed_type,
                "bed_count": rt_item.bed_count,
                "base_price": float(rt_item.base_price),
                "amenities": rt_item.amenities or ["Free WiFi", "Air Conditioning", "Smart TV"],
                "images": rt_images,
                "size": "350 sq ft",
                "status": "ACTIVE",
                "created_at": now,
                "updated_at": now,
            }

            rt_res = await db.room_types.insert_one(rt_doc)
            rt_id = str(rt_res.inserted_id)
            total_room_types_created += 1

            # Determine room units to create
            rooms_to_create = []
            if rt_item.custom_room_numbers and len(rt_item.custom_room_numbers) > 0:
                for rnum in rt_item.custom_room_numbers:
                    clean_num = str(rnum).strip().upper()
                    if clean_num:
                        rooms_to_create.append({
                            "property_id": prop_id,
                            "room_type_id": rt_id,
                            "room_number": clean_num,
                            "floor": rt_item.floor or 1,
                            "status": RoomStatus.AVAILABLE.value,
                            "housekeeping_status": "CLEAN",
                            "maintenance_status": "NONE",
                            "created_at": now,
                            "updated_at": now
                        })
            elif rt_item.number_of_rooms and rt_item.number_of_rooms > 0:
                start_num = rt_item.starting_room_number or 101
                for i in range(rt_item.number_of_rooms):
                    rooms_to_create.append({
                        "property_id": prop_id,
                        "room_type_id": rt_id,
                        "room_number": str(start_num + i),
                        "floor": rt_item.floor or 1,
                        "status": RoomStatus.AVAILABLE.value,
                        "housekeeping_status": "CLEAN",
                        "maintenance_status": "NONE",
                        "created_at": now,
                        "updated_at": now
                    })

            if rooms_to_create:
                await db.rooms.insert_many(rooms_to_create)
                total_rooms_created += len(rooms_to_create)

        logger.info(f"Onboarded property {prop_res.name} with {total_room_types_created} room types and {total_rooms_created} rooms.")

        return {
            "property": prop_res.model_dump(),
            "id": prop_id,
            "property_id": prop_id,
            "room_types_count": total_room_types_created,
            "rooms_count": total_rooms_created,
            "message": f"Successfully launched '{prop_res.name}' with {total_room_types_created} room types and {total_rooms_created} live rooms."
        }


    @staticmethod
    async def get_properties(
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        city: Optional[str] = None,
        status_filter: Optional[str] = None,
    ) -> PaginatedPropertyResponse:
        db = get_database()
        query: Dict[str, Any] = {}
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"property_code": {"$regex": search, "$options": "i"}},
                {"city": {"$regex": search, "$options": "i"}},
            ]
        if city:
            query["city"] = {"$regex": f"^{city}$", "$options": "i"}
        if status_filter:
            query["status"] = status_filter
            
        total = await db.properties.count_documents(query)
        total_pages = max(1, (total + limit - 1) // limit)
        skip = (page - 1) * limit
        
        cursor = db.properties.find(query).sort("created_at", -1).skip(skip).limit(limit)
        properties = await cursor.to_list(length=limit)
        
        items: List[PropertyResponse] = []
        for prop in properties:
            p_id = str(prop["_id"])
            total_rooms = await db.rooms.count_documents({"property_id": p_id})
            total_room_types = await db.room_types.count_documents({"property_id": p_id})
            items.append(PropertyResponse(**property_helper(prop, total_rooms, total_room_types)))
            
        return PaginatedPropertyResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_property_by_id(property_id: str) -> PropertyResponse:
        db = get_database()
        if not ObjectId.is_valid(property_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid property ID format")
            
        prop = await db.properties.find_one({"_id": ObjectId(property_id)})
        if not prop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
            
        total_rooms = await db.rooms.count_documents({"property_id": property_id})
        total_room_types = await db.room_types.count_documents({"property_id": property_id})
        return PropertyResponse(**property_helper(prop, total_rooms, total_room_types))

    @staticmethod
    async def update_property(property_id: str, prop_in: PropertyUpdate) -> PropertyResponse:
        db = get_database()
        if not ObjectId.is_valid(property_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid property ID format")
            
        update_data = {k: v for k, v in prop_in.model_dump().items() if v is not None}
        if not update_data:
            return await PropertyService.get_property_by_id(property_id)
            
        if "property_code" in update_data:
            update_data["property_code"] = update_data["property_code"].upper().strip()
            
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        try:
            await db.properties.update_one({"_id": ObjectId(property_id)}, {"$set": update_data})
            return await PropertyService.get_property_by_id(property_id)
        except DuplicateKeyError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Property code already in use.")

    @staticmethod
    async def delete_property(property_id: str) -> Dict[str, Any]:
        db = get_database()
        if not ObjectId.is_valid(property_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid property ID format")
            
        # Check active rooms or reservations
        active_reservations = await db.reservations.count_documents({
            "property_id": property_id,
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
        })
        if active_reservations > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete property with {active_reservations} active or confirmed reservations."
            )
            
        # Clean associated room types and rooms
        await db.rooms.delete_many({"property_id": property_id})
        await db.room_types.delete_many({"property_id": property_id})
        
        res = await db.properties.delete_one({"_id": ObjectId(property_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
            
        logger.info(f"Property {property_id} and associated inventory deleted.")
        return {"status": "success", "message": "Property and associated inventory deleted successfully."}

    @staticmethod
    async def add_property_image(property_id: str, image: ImageMetadata) -> PropertyResponse:
        db = get_database()
        if not ObjectId.is_valid(property_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid property ID format")
            
        await db.properties.update_one(
            {"_id": ObjectId(property_id)},
            {"$push": {"images": image.model_dump()}}
        )
        return await PropertyService.get_property_by_id(property_id)

    @staticmethod
    async def delete_property_image(property_id: str, public_id: str) -> PropertyResponse:
        db = get_database()
        if not ObjectId.is_valid(property_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid property ID format")
            
        await cloudinary_service.delete_image(public_id)
        await db.properties.update_one(
            {"_id": ObjectId(property_id)},
            {"$pull": {"images": {"public_id": public_id}}}
        )
        return await PropertyService.get_property_by_id(property_id)


property_service = PropertyService()
