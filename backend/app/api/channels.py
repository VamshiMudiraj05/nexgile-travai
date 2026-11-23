from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from app.core.security import get_current_user, require_role
from app.schemas.user import UserResponse, UserRole
from app.schemas.channel import (
    ChannelCreate,
    ChannelUpdate,
    ChannelResponse,
    ChannelMappingCreate,
    ChannelMappingResponse,
    ChannelAllotmentSetRequest,
    ChannelAllotmentResponse,
    SyncTriggerResponse,
    SyncLogResponse,
    RateParityReport,
    ChannelPerformanceSummary,
)
from app.services.channel_service import ChannelService

router = APIRouter(prefix="/channels", tags=["Distribution & Channel Management"])


@router.get(
    "",
    response_model=List[ChannelResponse],
    summary="List Distribution Channels & GDS Connectors",
)
async def list_channels(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve connected OTAs, GDS networks, and metasearch partners."""
    return await ChannelService.list_channels()


@router.post(
    "",
    response_model=ChannelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Connect New Distribution Channel",
)
async def create_channel(
    payload: ChannelCreate = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Establish a new certified channel connection."""
    return await ChannelService.create_channel(payload.model_dump())


@router.put(
    "/{channel_id}",
    response_model=ChannelResponse,
    summary="Update Channel Settings & Commission",
)
async def update_channel(
    channel_id: str = Path(..., description="Channel ID"),
    payload: ChannelUpdate = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Update connection status, commission rate, or API parameters."""
    return await ChannelService.update_channel(
        channel_id=channel_id,
        payload=payload.model_dump(exclude_unset=True),
    )


@router.get(
    "/mappings",
    response_model=List[ChannelMappingResponse],
    summary="List Channel Room & Rate Plan Mappings",
)
async def list_mappings(
    property_id: Optional[str] = Query(None, description="Optional property ID filter"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve mapped PMS inventory codes against OTA room codes."""
    return await ChannelService.list_mappings(property_id=property_id)


@router.post(
    "/mappings",
    response_model=ChannelMappingResponse,
    summary="Map Room Type & Rate Plan to Channel",
)
async def create_or_update_mapping(
    payload: ChannelMappingCreate = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Map PMS room type and rate plan to an OTA/GDS room code with stop-sell control."""
    return await ChannelService.create_or_update_mapping(payload.model_dump())


@router.get(
    "/allotments",
    response_model=List[ChannelAllotmentResponse],
    summary="Get Channel Allotments Matrix",
)
async def get_allotments(
    property_id: str = Query(..., description="Property ID"),
    channel_code: Optional[str] = Query(None, description="Optional channel code filter"),
    date: Optional[str] = Query(None, description="Optional date filter (YYYY-MM-DD)"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve allocated room pools and stop-sell flags across channels."""
    return await ChannelService.get_allotments(
        property_id=property_id,
        channel_code=channel_code,
        date_str=date,
    )


@router.post(
    "/allotments",
    response_model=ChannelAllotmentResponse,
    summary="Allocate Inventory or Toggle Stop-Sell",
)
async def set_allotment(
    payload: ChannelAllotmentSetRequest = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Set dedicated room count for an OTA or enable stop-sell."""
    return await ChannelService.set_allotment(payload.model_dump())


@router.post(
    "/sync-ari",
    response_model=SyncTriggerResponse,
    summary="Trigger Real-Time ARI Broadcast",
)
async def trigger_ari_sync(
    property_id: Optional[str] = Query(None, description="Optional property ID"),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER, UserRole.FRONT_DESK])),
):
    """Broadcast real-time Availability, Rates, and Inventory updates to all connected channels."""
    return await ChannelService.trigger_ari_sync(property_id=property_id)


@router.get(
    "/sync-logs",
    response_model=List[SyncLogResponse],
    summary="Retrieve ARI Sync Transaction Audit Logs",
)
async def get_sync_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user),
):
    """Audit real-time sync transactions and retry logs."""
    return await ChannelService.get_sync_logs(limit=limit)


@router.get(
    "/rate-parity",
    response_model=RateParityReport,
    summary="Audit Live Rate Parity Across OTAs",
)
async def audit_rate_parity(
    property_id: Optional[str] = Query(None, description="Optional property ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Compare OTA rates against Direct Website rates and flag rate-parity violations."""
    return await ChannelService.audit_rate_parity(property_id=property_id)


@router.get(
    "/performance",
    response_model=ChannelPerformanceSummary,
    summary="Get Channel Performance & Commission Analytics",
)
async def get_channel_performance(
    property_id: Optional[str] = Query(None, description="Optional property ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Analyze revenue share, commission expenses paid, and net yields by distribution partner."""
    return await ChannelService.get_channel_performance(property_id=property_id)
