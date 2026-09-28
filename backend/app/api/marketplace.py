from typing import Optional
from fastapi import APIRouter, Query, Path, HTTPException, status
from app.schemas.marketplace import MarketplaceSearchResponse, MarketplacePropertyItem
from app.services.marketplace_service import MarketplaceService

router = APIRouter(prefix="/marketplace", tags=["Traveler Marketplace & Search"])


@router.get(
    "/search",
    response_model=MarketplaceSearchResponse,
    summary="Search hotels & properties with live room availability",
)
async def search_properties(
    city: Optional[str] = Query(None, description="City or destination"),
    check_in: Optional[str] = Query(None, description="Check-in date (YYYY-MM-DD)"),
    check_out: Optional[str] = Query(None, description="Check-out date (YYYY-MM-DD)"),
    adults: int = Query(1, ge=1, description="Number of adults"),
    children: int = Query(0, ge=0, description="Number of children"),
    rooms: int = Query(1, ge=1, description="Number of rooms"),
    min_price: Optional[float] = Query(None, description="Minimum price per night"),
    max_price: Optional[float] = Query(None, description="Maximum price per night"),
    star_rating: Optional[float] = Query(None, description="Minimum star rating"),
    amenities: Optional[str] = Query(None, description="Comma-separated amenities"),
    sort_by: Optional[str] = Query("price_asc", description="Sort by: price_asc, price_desc, rating"),
):
    """Search active properties, verify real-time room availability, and calculate stay pricing."""
    return await MarketplaceService.search_properties(
        city=city,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        children=children,
        rooms=rooms,
        min_price=min_price,
        max_price=max_price,
        star_rating=star_rating,
        amenities=amenities,
        sort_by=sort_by,
    )


@router.get(
    "/properties/{property_id}",
    response_model=MarketplacePropertyItem,
    summary="Get Property & Room Details for Traveler View",
)
async def get_property_details(
    property_id: str = Path(..., description="Property ID"),
    check_in: Optional[str] = Query(None, description="Check-in date"),
    check_out: Optional[str] = Query(None, description="Check-out date"),
    adults: int = Query(1, ge=1, description="Number of adults"),
):
    """Retrieve detailed property photos, amenities, and available room types."""
    return await MarketplaceService.get_property_marketplace_details(
        property_id=property_id,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
    )
