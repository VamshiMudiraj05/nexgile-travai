from datetime import datetime
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.mongodb import get_database
from app.core.logging import logger
from fastapi import HTTPException, status


class ServiceRequestService:
    @staticmethod
    def _doc_to_dict(doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to JSON-friendly dict."""
        return {
            "id": str(doc["_id"]),
            "user_id": str(doc.get("user_id", "")),
            "guest_name": doc.get("guest_name"),
            "reservation_id": str(doc["reservation_id"]) if doc.get("reservation_id") else None,
            "property_id": str(doc["property_id"]) if doc.get("property_id") else None,
            "property_name": doc.get("property_name"),
            "room_number": doc.get("room_number"),
            "category": doc.get("category", "CONCIERGE"),
            "item": doc.get("item", "General Request"),
            "details": doc.get("details", ""),
            "status": doc.get("status", "OPEN"),
            "created_at": doc.get("created_at", datetime.utcnow().isoformat()),
            "updated_at": doc.get("updated_at", datetime.utcnow().isoformat()),
        }

    @staticmethod
    async def create_service_request(user: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new guest service request tied to an active reservation or property."""
        db = get_database()
        now_iso = datetime.utcnow().isoformat()

        reservation_id = payload.get("reservation_id")
        property_id = payload.get("property_id")
        property_name = None
        room_number = payload.get("room_number")

        # If reservation_id provided, look up stay details
        if reservation_id and ObjectId.is_valid(reservation_id):
            res_doc = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
            if res_doc:
                property_id = str(res_doc.get("property_id", ""))
                property_name = res_doc.get("property_name")
                if not room_number:
                    room_number = res_doc.get("room_number")

        # If no reservation_id provided, attempt to find user's current or upcoming reservation
        elif not property_id:
            user_id = str(user.get("_id") or user.get("id"))
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            active_res = await db.reservations.find_one({
                "$or": [
                    {"user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else None},
                    {"user_id": user_id},
                    {"guest_email": user.get("email")}
                ],
                "status": {"$in": ["CONFIRMED", "CHECKED_IN"]}
            }, sort=[("check_in_date", 1)])

            if active_res:
                reservation_id = str(active_res["_id"])
                property_id = str(active_res.get("property_id", ""))
                property_name = active_res.get("property_name")
                room_number = active_res.get("room_number")

        # Resolve property name if we have property_id
        if property_id and not property_name and ObjectId.is_valid(property_id):
            prop = await db.properties.find_one({"_id": ObjectId(property_id)})
            if prop:
                property_name = prop.get("name")

        doc = {
            "user_id": ObjectId(user.get("_id") or user.get("id")) if ObjectId.is_valid(str(user.get("_id") or user.get("id"))) else str(user.get("_id") or user.get("id")),
            "guest_name": user.get("name", "Resident Guest"),
            "reservation_id": ObjectId(reservation_id) if reservation_id and ObjectId.is_valid(reservation_id) else reservation_id,
            "property_id": ObjectId(property_id) if property_id and ObjectId.is_valid(property_id) else property_id,
            "property_name": property_name or "Luxury Estate",
            "room_number": room_number or "Suite",
            "category": payload.get("category", "CONCIERGE").upper(),
            "item": payload.get("item", "Special Request"),
            "details": payload.get("details", ""),
            "status": "OPEN",
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        res = await db.service_requests.insert_one(doc)
        doc["_id"] = res.inserted_id
        logger.info(f"Service request created: {doc['item']} for user {user.get('email')}")
        return ServiceRequestService._doc_to_dict(doc)

    @staticmethod
    async def list_service_requests(
        user_id: Optional[str] = None,
        reservation_id: Optional[str] = None,
        property_id: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List service requests filtered by user, reservation, or property."""
        db = get_database()
        query: Dict[str, Any] = {}

        if user_id:
            query["$or"] = [
                {"user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else None},
                {"user_id": user_id}
            ]

        if reservation_id:
            query["reservation_id"] = ObjectId(reservation_id) if ObjectId.is_valid(reservation_id) else reservation_id

        if property_id:
            query["property_id"] = ObjectId(property_id) if ObjectId.is_valid(property_id) else property_id

        if status_filter:
            query["status"] = status_filter.upper()

        cursor = db.service_requests.find(query).sort("created_at", -1)
        docs = await cursor.to_list(length=100)
        return [ServiceRequestService._doc_to_dict(d) for d in docs]

    @staticmethod
    async def get_service_request(request_id: str) -> Optional[Dict[str, Any]]:
        """Get single service request by ID."""
        db = get_database()
        if not ObjectId.is_valid(request_id):
            return None
        doc = await db.service_requests.find_one({"_id": ObjectId(request_id)})
        return ServiceRequestService._doc_to_dict(doc) if doc else None
