import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.services.marketplace_service import MarketplaceService


async def verify():
    await connect_to_mongo()
    db = get_database()
    
    props = await db.properties.find({}).to_list(length=100)
    room_types = await db.room_types.find({}).to_list(length=200)
    rooms = await db.rooms.find({}).to_list(length=500)
    guests = await db.guests.find({}).to_list(length=100)
    res = await db.reservations.find({}).to_list(length=100)
    
    print(f"=== DATABASE COUNTS ===")
    print(f"Properties:   {len(props)}")
    print(f"Room Types:   {len(room_types)}")
    print(f"Rooms:        {len(rooms)}")
    print(f"Guests:       {len(guests)}")
    print(f"Reservations: {len(res)}")
    
    print("\n=== MARKETPLACE SEARCH TEST ===")
    search_data = await MarketplaceService.search_properties()
    search_results = search_data.get("properties", [])
    print(f"Marketplace Search Result Count: {len(search_results)}")
    for i, p in enumerate(search_results, 1):
        print(f" {i}. {p['name']} ({p['city']}) - Starting at INR {p['starting_price']} ({p.get('available_room_types_count', 0)} room types)")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(verify())
