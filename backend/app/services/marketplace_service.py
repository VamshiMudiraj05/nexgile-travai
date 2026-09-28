from datetime import datetime, date
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.mongodb import get_database
from app.core.logging import logger
from fastapi import HTTPException, status

DEFAULT_PROPERTY_PHOTOS = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80"
]

DEFAULT_ROOM_PHOTOS = [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"
]


VARIED_PROPERTY_GALLERY = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", # Luxury Coast
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",  # Resort Pool
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80", # Downtown Palace
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",  # Infinity Pool Villa
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80", # Royal Heritage
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80"   # Beach Resort
]

class MarketplaceService:
    @staticmethod
    def _extract_photos(item: Dict[str, Any], is_room: bool = False) -> List[str]:
        """Extract photo URLs and provide high-quality fallbacks for expired blob URLs."""
        photos = []
        
        # 1. From photos field
        if "photos" in item and isinstance(item["photos"], list):
            for p in item["photos"]:
                if isinstance(p, str) and p and not p.startswith("blob:"):
                    photos.append(p)
                elif isinstance(p, dict) and p.get("url") and not str(p.get("url", "")).startswith("blob:"):
                    photos.append(p["url"])
                    
        # 2. From images field (Cloudinary image metadata / data URIs / URLs)
        if "images" in item and isinstance(item["images"], list):
            for img in item["images"]:
                if isinstance(img, dict) and img.get("url") and not str(img.get("url", "")).startswith("blob:"):
                    photos.append(img["url"])
                elif isinstance(img, str) and img and not img.startswith("blob:"):
                    photos.append(img)

        # 3. Fallback to distinct premium photos if empty or only local blobs were found
        if not photos:
            if is_room:
                photos = DEFAULT_ROOM_PHOTOS
            else:
                seed = sum(ord(c) for c in str(item.get("name", "") or item.get("_id", "A")))
                start_idx = seed % len(VARIED_PROPERTY_GALLERY)
                photos = VARIED_PROPERTY_GALLERY[start_idx:] + VARIED_PROPERTY_GALLERY[:start_idx]

        return list(dict.fromkeys(photos))

    @staticmethod
    async def search_properties(
        city: Optional[str] = None,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 1,
        children: int = 0,
        rooms: int = 1,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        star_rating: Optional[float] = None,
        amenities: Optional[str] = None,
        sort_by: Optional[str] = "price_asc"
    ) -> Dict[str, Any]:
        """Search properties with real-time room availability verification."""
        db = get_database()
        
        cin_date = datetime.strptime(check_in, "%Y-%m-%d").date() if check_in else date.today()
        cout_date = datetime.strptime(check_out, "%Y-%m-%d").date() if check_out else (__import__('datetime').date.fromordinal(cin_date.toordinal() + 1))
        
        cin_str = cin_date.isoformat()
        cout_str = cout_date.isoformat()
        nights = max((cout_date - cin_date).days, 1)

        # Match active properties
        prop_query: Dict[str, Any] = {"status": "ACTIVE"}
        if city and city.strip():
            prop_query["city"] = {"$regex": city.strip(), "$options": "i"}
        if star_rating is not None and star_rating > 0:
            prop_query["star_rating"] = {"$gte": star_rating}
        if amenities:
            amenity_list = [a.strip() for a in amenities.split(",") if a.strip()]
            if amenity_list:
                prop_query["amenities"] = {"$all": amenity_list}

        properties = await db.properties.find(prop_query).to_list(length=100)

        # Find conflicting reservations during requested dates
        conflict_res = await db.reservations.find({
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]},
            "check_in_date": {"$lt": cout_str},
            "check_out_date": {"$gt": cin_str}
        }).to_list(length=1000)
        
        booked_room_ids = {str(r["room_id"]) for r in conflict_res if "room_id" in r}

        results: List[Dict[str, Any]] = []

        for prop in properties:
            prop_id = prop["_id"]
            
            # Fetch room types for this property (support both ObjectId and string property_id)
            room_types = await db.room_types.find({
                "property_id": {"$in": [prop_id, str(prop_id)]},
                "is_active": {"$ne": False}
            }).to_list(length=50)

            available_rt_items = []
            min_starting_price = float("inf")

            for rt in room_types:
                rt_id = rt["_id"]
                base_rate = float(rt.get("base_rate", 200.0))

                rooms_cursor = db.rooms.find({
                    "property_id": {"$in": [prop_id, str(prop_id)]},
                    "room_type_id": {"$in": [rt_id, str(rt_id)]},
                    "status": {"$in": ["AVAILABLE", "CLEANING"]}
                })
                all_candidate_rooms = await rooms_cursor.to_list(length=200)
                
                free_rooms = [r for r in all_candidate_rooms if str(r["_id"]) not in booked_room_ids]
                free_count = len(free_rooms)

                stay_price = round(base_rate * nights, 2)
                if (min_price is None or base_rate >= min_price) and (max_price is None or base_rate <= max_price):
                    min_starting_price = min(min_starting_price, base_rate)
                    available_rt_items.append({
                        "id": str(rt["_id"]),
                        "property_id": str(prop_id),
                        "name": rt.get("name", "Standard Room"),
                        "code": rt.get("code", "STD"),
                        "description": rt.get("description", ""),
                        "base_rate": base_rate,
                        "max_occupancy": rt.get("max_occupancy", 2),
                        "bed_type": rt.get("bed_type", "King Bed"),
                        "amenities": rt.get("amenities", ["Air Conditioning", "WiFi", "TV"]),
                        "photos": MarketplaceService._extract_photos(rt, is_room=True),
                        "available_rooms_count": free_count,
                        "total_stay_price": stay_price
                    })

            starting_price = min_starting_price if min_starting_price != float("inf") else 0.0
            photos = MarketplaceService._extract_photos(prop, is_room=False)

            results.append({
                "id": str(prop["_id"]),
                "property_code": prop.get("property_code", "PROP"),
                "name": prop.get("name", "Resort & Hotel"),
                "property_type": prop.get("property_type", "HOTEL"),
                "star_rating": float(prop.get("star_rating", 4.5)),
                "city": prop.get("city", ""),
                "state": prop.get("state", ""),
                "country": prop.get("country", ""),
                "address_line_1": prop.get("address_line_1", prop.get("address", "")),
                "description": prop.get("description", ""),
                "amenities": prop.get("amenities", []),
                "photos": photos,
                "starting_price": starting_price,
                "available_room_types_count": len(available_rt_items),
                "room_types": available_rt_items
            })

        # Sorting
        if sort_by == "price_asc":
            results.sort(key=lambda x: x["starting_price"])
        elif sort_by == "price_desc":
            results.sort(key=lambda x: x["starting_price"], reverse=True)
        elif sort_by == "rating":
            results.sort(key=lambda x: x["star_rating"], reverse=True)

        return {
            "properties": results,
            "total_found": len(results),
            "check_in": cin_str,
            "check_out": cout_str,
            "nights": nights,
            "adults": adults,
            "children": children,
            "rooms": rooms
        }

    @staticmethod
    async def get_property_marketplace_details(
        property_id: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 1
    ) -> Dict[str, Any]:
        """Fetch detailed property profile and real-time room availability for traveler view."""
        db = get_database()
        if not ObjectId.is_valid(property_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid property ID")

        prop = await db.properties.find_one({"_id": ObjectId(property_id)})
        if not prop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

        cin_date = datetime.strptime(check_in, "%Y-%m-%d").date() if check_in else date.today()
        cout_date = datetime.strptime(check_out, "%Y-%m-%d").date() if check_out else (__import__('datetime').date.fromordinal(cin_date.toordinal() + 1))
        cin_str = cin_date.isoformat()
        cout_str = cout_date.isoformat()
        nights = max((cout_date - cin_date).days, 1)

        # Check date conflicts
        conflict_res = await db.reservations.find({
            "status": {"$in": ["CONFIRMED", "CHECKED_IN"]},
            "check_in_date": {"$lt": cout_str},
            "check_out_date": {"$gt": cin_str}
        }).to_list(length=1000)
        booked_room_ids = {str(r["room_id"]) for r in conflict_res if "room_id" in r}

        # Query room types matching both ObjectId and string property_id
        room_types = await db.room_types.find({
            "property_id": {"$in": [ObjectId(property_id), str(property_id)]},
            "is_active": {"$ne": False}
        }).to_list(length=50)

        room_type_items = []
        for rt in room_types:
            rt_id = rt["_id"]
            base_rate = float(rt.get("base_rate", 200.0))

            candidate_rooms = await db.rooms.find({
                "property_id": {"$in": [ObjectId(property_id), str(property_id)]},
                "room_type_id": {"$in": [rt_id, str(rt_id)]},
                "status": {"$in": ["AVAILABLE", "CLEANING"]}
            }).to_list(length=100)

            free_rooms = [r for r in candidate_rooms if str(r["_id"]) not in booked_room_ids]
            
            room_type_items.append({
                "id": str(rt["_id"]),
                "property_id": str(property_id),
                "name": rt.get("name", "Room Type"),
                "code": rt.get("code", "RT"),
                "description": rt.get("description", ""),
                "base_rate": base_rate,
                "max_occupancy": rt.get("max_occupancy", 2),
                "bed_type": rt.get("bed_type", "King Bed"),
                "amenities": rt.get("amenities", ["Air Conditioning", "WiFi", "TV", "Coffee Maker"]),
                "photos": MarketplaceService._extract_photos(rt, is_room=True),
                "available_rooms_count": len(free_rooms),
                "total_stay_price": round(base_rate * nights, 2)
            })

        starting_price = min((rt["base_rate"] for rt in room_type_items), default=0.0)
        photos = MarketplaceService._extract_photos(prop, is_room=False)

        return {
            "id": str(prop["_id"]),
            "property_code": prop.get("property_code", "PROP"),
            "name": prop.get("name", "Resort"),
            "property_type": prop.get("property_type", "HOTEL"),
            "star_rating": float(prop.get("star_rating", 4.5)),
            "city": prop.get("city", ""),
            "state": prop.get("state", ""),
            "country": prop.get("country", ""),
            "address_line_1": prop.get("address_line_1", prop.get("address", "")),
            "description": prop.get("description", ""),
            "amenities": prop.get("amenities", []),
            "photos": photos,
            "starting_price": starting_price,
            "available_room_types_count": len(room_type_items),
            "room_types": room_type_items
        }
