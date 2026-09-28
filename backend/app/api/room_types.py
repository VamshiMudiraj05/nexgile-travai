from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Query, status

from app.core.security import get_current_user, require_role
from app.schemas.property import ImageMetadata
from app.schemas.room_type import RoomTypeCreate, RoomTypeUpdate, RoomTypeResponse
from app.schemas.user import UserResponse, UserRole
from app.services.room_type_service import room_type_service
from app.services.cloudinary_service import cloudinary_service

router = APIRouter(tags=["Room Types"])


@router.post(
    "/properties/{property_id}/room-types",
    response_model=RoomTypeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new room type for a property (Admin only)"
)
async def create_room_type(
    property_id: str,
    rt_in: RoomTypeCreate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await room_type_service.create_room_type(property_id, rt_in)


@router.get(
    "/properties/{property_id}/room-types",
    response_model=List[RoomTypeResponse],
    summary="Get all room types for a property"
)
async def get_room_types_by_property(
    property_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await room_type_service.get_room_types_by_property(property_id)


@router.get(
    "/room-types/{room_type_id}",
    response_model=RoomTypeResponse,
    summary="Get room type details by ID"
)
async def get_room_type(
    room_type_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await room_type_service.get_room_type_by_id(room_type_id)


@router.put(
    "/room-types/{room_type_id}",
    response_model=RoomTypeResponse,
    summary="Update room type details (Admin only)"
)
async def update_room_type(
    room_type_id: str,
    rt_in: RoomTypeUpdate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await room_type_service.update_room_type(room_type_id, rt_in)


@router.delete(
    "/room-types/{room_type_id}",
    summary="Delete room type (Admin only)"
)
async def delete_room_type(
    room_type_id: str,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await room_type_service.delete_room_type(room_type_id)


@router.post(
    "/room-types/{room_type_id}/images",
    response_model=RoomTypeResponse,
    summary="Upload and attach an image to room type"
)
async def upload_room_type_image(
    room_type_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    upload_result = await cloudinary_service.upload_image(file, subfolder="room-types")
    image_meta = ImageMetadata(**upload_result)
    return await room_type_service.add_room_type_image(room_type_id, image_meta)


@router.delete(
    "/room-types/{room_type_id}/images",
    response_model=RoomTypeResponse,
    summary="Delete an image from room type"
)
async def delete_room_type_image(
    room_type_id: str,
    public_id: str = Query(..., description="Cloudinary image public ID"),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await room_type_service.delete_room_type_image(room_type_id, public_id)
