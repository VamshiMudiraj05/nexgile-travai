from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query, status

from app.core.security import get_current_user, require_role
from app.schemas.property import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
    PaginatedPropertyResponse,
    ImageMetadata,
    PropertyOnboardRequest,
)
from app.schemas.user import UserResponse, UserRole
from app.services.property_service import property_service
from app.services.cloudinary_service import cloudinary_service

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.post(
    "/onboard",
    status_code=status.HTTP_201_CREATED,
    summary="Unified Property, Room Types & Rooms Onboarding (Admin only)"
)
async def onboard_property(
    onboard_in: PropertyOnboardRequest,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await property_service.onboard_property(onboard_in, current_user.id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new property (with optional room types and rooms) (Admin only)"
)
async def create_property(
    prop_in: PropertyOnboardRequest,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    if prop_in.room_types and len(prop_in.room_types) > 0:
        return await property_service.onboard_property(prop_in, current_user.id)
    return await property_service.create_property(PropertyCreate(**prop_in.model_dump(exclude={"room_types"})), current_user.id)



@router.get(
    "",
    response_model=PaginatedPropertyResponse,
    summary="Get paginated list of properties"
)
async def get_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    return await property_service.get_properties(
        page=page,
        limit=limit,
        search=search,
        city=city,
        status_filter=status
    )


@router.get(
    "/{property_id}",
    response_model=PropertyResponse,
    summary="Get property details by ID"
)
async def get_property(
    property_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await property_service.get_property_by_id(property_id)


@router.put(
    "/{property_id}",
    response_model=PropertyResponse,
    summary="Update property details (Admin only)"
)
async def update_property(
    property_id: str,
    prop_in: PropertyUpdate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await property_service.update_property(property_id, prop_in)


@router.delete(
    "/{property_id}",
    summary="Delete property and its inventory (Admin only)"
)
async def delete_property(
    property_id: str,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await property_service.delete_property(property_id)


@router.post(
    "/upload-image",
    summary="Upload image asset (Cloudinary or local data storage)"
)
async def upload_standalone_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    upload_result = await cloudinary_service.upload_image(file, subfolder="properties")
    return upload_result


@router.post(
    "/{property_id}/images",
    response_model=PropertyResponse,
    summary="Upload and attach an image to property"
)
async def upload_property_image(
    property_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    upload_result = await cloudinary_service.upload_image(file, subfolder="properties")
    image_meta = ImageMetadata(**upload_result)
    return await property_service.add_property_image(property_id, image_meta)


@router.delete(
    "/{property_id}/images",
    response_model=PropertyResponse,
    summary="Delete an image from property"
)
async def delete_property_image(
    property_id: str,
    public_id: str = Query(..., description="Cloudinary image public ID"),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await property_service.delete_property_image(property_id, public_id)
