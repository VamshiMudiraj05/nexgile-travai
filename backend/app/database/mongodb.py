from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo
from app.core.config import settings
from app.core.logging import logger


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


db_manager = Database()


async def connect_to_mongo():
    """Connect to MongoDB and ensure indexes are created for all collections."""
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
        )
        db_manager.db = db_manager.client[settings.MONGODB_DATABASE]
        
        # Verify connection
        await db_manager.client.admin.command("ping")
        logger.info(f"Successfully connected to MongoDB database: '{settings.MONGODB_DATABASE}'")
        
        db = db_manager.db

        # 1. users: unique email
        await db.users.create_index([("email", pymongo.ASCENDING)], unique=True, name="unique_user_email")
        
        # 2. properties: unique property_code, status, city
        await db.properties.create_index([("property_code", pymongo.ASCENDING)], unique=True, name="unique_property_code")
        await db.properties.create_index([("city", pymongo.ASCENDING)], name="idx_property_city")
        await db.properties.create_index([("status", pymongo.ASCENDING)], name="idx_property_status")
        
        # 3. room_types: compound unique (property_id + code), property_id
        await db.room_types.create_index(
            [("property_id", pymongo.ASCENDING), ("code", pymongo.ASCENDING)],
            unique=True,
            name="unique_property_room_type_code"
        )
        await db.room_types.create_index([("property_id", pymongo.ASCENDING)], name="idx_room_type_property")
        
        # 4. rooms: compound unique (property_id + room_number), property_id, room_type_id, status
        await db.rooms.create_index(
            [("property_id", pymongo.ASCENDING), ("room_number", pymongo.ASCENDING)],
            unique=True,
            name="unique_property_room_number"
        )
        await db.rooms.create_index([("property_id", pymongo.ASCENDING)], name="idx_room_property")
        await db.rooms.create_index([("room_type_id", pymongo.ASCENDING)], name="idx_room_room_type")
        await db.rooms.create_index([("status", pymongo.ASCENDING)], name="idx_room_status")
        
        # 5. guests: email, phone
        await db.guests.create_index([("email", pymongo.ASCENDING)], name="idx_guest_email")
        await db.guests.create_index([("phone", pymongo.ASCENDING)], name="idx_guest_phone")
        
        # 6. reservations: unique booking_reference, property_id, guest_id, room_id, dates, status
        await db.reservations.create_index([("booking_reference", pymongo.ASCENDING)], unique=True, name="unique_booking_ref")
        await db.reservations.create_index([("property_id", pymongo.ASCENDING)], name="idx_res_property")
        await db.reservations.create_index([("guest_id", pymongo.ASCENDING)], name="idx_res_guest")
        await db.reservations.create_index([("room_id", pymongo.ASCENDING)], name="idx_res_room")
        await db.reservations.create_index(
            [("check_in_date", pymongo.ASCENDING), ("check_out_date", pymongo.ASCENDING)],
            name="idx_res_dates"
        )
        await db.reservations.create_index([("status", pymongo.ASCENDING)], name="idx_res_status")
        
        # 7. room_status_history: room_id, changed_at
        await db.room_status_history.create_index(
            [("room_id", pymongo.ASCENDING), ("changed_at", pymongo.DESCENDING)],
            name="idx_history_room_date"
        )

        # 8. loyalty_accounts: unique user_id
        await db.loyalty_accounts.create_index([("user_id", pymongo.ASCENDING)], unique=True, name="unique_loyalty_user")

        # 9. loyalty_transactions: user_id, created_at
        await db.loyalty_transactions.create_index(
            [("user_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
            name="idx_loyalty_tx_user_date"
        )

        # 10. rate_recommendation_history: room_type_id, applied_at
        await db.rate_recommendation_history.create_index(
            [("room_type_id", pymongo.ASCENDING), ("applied_at", pymongo.DESCENDING)],
            name="idx_rate_rec_room_date"
        )

        # 11. traveler_profiles: unique user_id
        await db.traveler_profiles.create_index([("user_id", pymongo.ASCENDING)], unique=True, name="unique_traveler_profile_user")

        logger.info("Ensured all Phase 2, 4, and 5 collection indexes on MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB or create indexes: {str(e)}")


async def close_mongo_connection():
    """Close MongoDB connection gracefully."""
    if db_manager.client:
        logger.info("Closing MongoDB connection...")
        db_manager.client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Get the active MongoDB database instance."""
    if db_manager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db_manager.db
