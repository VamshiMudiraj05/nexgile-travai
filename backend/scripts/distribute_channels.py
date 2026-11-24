import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

CHANNELS_CYCLE = [
    "Direct Website",
    "Direct Website",
    "Nexgile Marketplace",
    "Nexgile Marketplace",
    "Corporate & Groups",
    "Direct Website",
    "Global OTAs / GDS",
    "Nexgile Marketplace",
    "Direct Website",
    "Corporate & Groups",
]

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.nexgile_travai
    
    reservations = await db.reservations.find().sort("created_at", 1).to_list(1000)
    print(f"Distributing {len(reservations)} reservations across acquisition channels...")
    
    channel_counts = {}
    for idx, r in enumerate(reservations):
        channel = CHANNELS_CYCLE[idx % len(CHANNELS_CYCLE)]
        await db.reservations.update_one(
            {"_id": r["_id"]},
            {"$set": {"booking_source": channel, "source": channel}}
        )
        channel_counts[channel] = channel_counts.get(channel, 0) + 1
        
    print("Channel distribution updated:")
    for ch, count in channel_counts.items():
        pct = (count / len(reservations)) * 100
        print(f"  ✓ {ch}: {count} bookings ({pct:.1f}%)")

if __name__ == "__main__":
    asyncio.run(main())
