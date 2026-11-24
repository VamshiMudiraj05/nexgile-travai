import asyncio
import re
from motor.motor_asyncio import AsyncIOMotorClient

def get_realistic_rate(name: str, current_rate: float) -> float:
    n = name.lower()
    
    # 1. Royal / Luxury Villa
    if "royal villa" in n or "kohinoor" in n or "luxury villa" in n:
        return 28000.0
    
    # 2. Private Villa / Beach Villa / Pool Villa
    if "villa" in n:
        return 18500.0
        
    # 3. Luxury Suite / Palace Suite / Grand Suite / Presidential
    if "luxury suite" in n or "presidential" in n or "palace suite" in n or "premier lake view" in n or "maharaja" in n:
        return 14500.0
        
    # 4. Executive Suite / Royal Suite / Tower Suite / Heritage Suite
    if "executive" in n or "suite" in n:
        return 8500.0
        
    # 5. Two-Bedroom Apartment
    if "two-bedroom" in n or "2-bedroom" in n or "2bhk" in n:
        return 7500.0
        
    # 6. Premium Room / Heritage Room / Club Room / Ocean View
    if "premium" in n or "heritage" in n or "club" in n or "ocean view" in n or "garden view" in n:
        return 5200.0
        
    # 7. One-Bedroom Apartment
    if "one-bedroom" in n or "1-bedroom" in n or "1bhk" in n:
        return 4800.0
        
    # 8. Deluxe King / Deluxe Queen / Deluxe Room
    if "deluxe" in n or "king" in n or "queen" in n:
        return 3800.0
        
    # 9. Studio Apartment
    if "studio" in n or "apartment" in n:
        return 3200.0
        
    # 10. Standard / Classic / Superior Room
    if "standard" in n or "classic" in n or "superior" in n:
        return 2200.0
        
    # If currently unrealistically low (< ₹1,500, e.g. 169)
    if current_rate < 1500:
        return 3200.0
        
    # If excessively high (> ₹50,000)
    if current_rate > 50000:
        return 28000.0
        
    return current_rate

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.nexgile_travai
    
    room_types = await db.room_types.find().to_list(1000)
    print(f"Normalizing rates for {len(room_types)} room types...")
    
    updated_count = 0
    for rt in room_types:
        name = rt.get("name", "Standard Room")
        curr_rate = float(rt.get("base_rate", rt.get("base_price", 200.0)))
        new_rate = get_realistic_rate(name, curr_rate)
        
        await db.room_types.update_one(
            {"_id": rt["_id"]},
            {"$set": {"base_rate": new_rate, "base_price": new_rate}}
        )
        updated_count += 1
        print(f"  ✓ {name}: ₹{curr_rate:,.0f} -> ₹{new_rate:,.0f}")
        
    print(f"\nSuccessfully updated {updated_count} room types with realistic Indian nightly rates!")
    
    # Also update any mock reservations that had unrealistic rates
    res_list = await db.reservations.find().to_list(1000)
    for r in res_list:
        total = float(r.get("total_amount", 0.0))
        nights = max(int(r.get("nights", 1)), 1)
        rate_per_night = total / nights if nights > 0 else total
        if rate_per_night < 1500 or rate_per_night > 60000:
            new_rpn = 4200.0
            new_total = round(new_rpn * nights * 1.12, 2)
            await db.reservations.update_one(
                {"_id": r["_id"]},
                {"$set": {"rate_per_night": new_rpn, "total_amount": new_total}}
            )

if __name__ == "__main__":
    asyncio.run(main())
