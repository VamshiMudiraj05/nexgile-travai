import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import hash_password


async def seed_database():
    print(f"Connecting to MongoDB at: {settings.MONGODB_URI}")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DATABASE]
    
    # 1. Clear existing seed data if requested
    print("Initializing Nexgile-TravAI Phase 2 Seed Data...")
    now = datetime.now(timezone.utc)
    today = now.date()

    # 2. Seed Admin and Front Desk Users
    users_col = db.users
    admin_user = await users_col.find_one({"email": "admin@nexgile.com"})
    if not admin_user:
        admin_doc = {
            "name": "System Administrator",
            "email": "admin@nexgile.com",
            "password_hash": hash_password("AdminPassword123!"),
            "role": "ADMIN",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        res = await users_col.insert_one(admin_doc)
        admin_id = str(res.inserted_id)
        print("Created Admin User: admin@nexgile.com / AdminPassword123!")
    else:
        admin_id = str(admin_user["_id"])

    # 3. Seed Properties
    props_col = db.properties
    p1 = await props_col.find_one({"property_code": "GNP-001"})
    if not p1:
        p1_doc = {
            "name": "The Grand Nexgile Palace & Spa",
            "property_code": "GNP-001",
            "property_type": "RESORT",
            "description": "A luxury 5-star beachfront resort in Goa offering panoramic sea views, private plunge pools, world-class spa treatments, and signature fine dining.",
            "address": "Candolim Beach Road, North Goa",
            "city": "Goa",
            "state": "Goa",
            "country": "India",
            "postal_code": "403515",
            "latitude": 15.5173,
            "longitude": 73.7634,
            "phone": "+91 832 248 9000",
            "email": "concierge.goa@nexgile.com",
            "website": "https://grandpalace.nexgile.com",
            "star_rating": 5,
            "amenities": ["Free WiFi", "Infinity Pool", "Ayurvedic Spa", "Beachfront Access", "Fitness Center", "Valet Parking", "Multi-Cuisine Restaurant", "Cocktail Lounge"],
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                    "public_id": "pgmadeeazy/properties/grand_nexgile_palace",
                    "resource_type": "image"
                },
                {
                    "url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
                    "public_id": "pgmadeeazy/properties/grand_nexgile_pool",
                    "resource_type": "image"
                }
            ],
            "check_in_time": "14:00",
            "check_out_time": "11:00",
            "currency": "INR",
            "timezone": "Asia/Kolkata",
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now,
            "created_by": admin_id,
        }
        res = await props_col.insert_one(p1_doc)
        p1_id = str(res.inserted_id)
        print("Created Property: The Grand Nexgile Palace & Spa (GNP-001)")
    else:
        p1_id = str(p1["_id"])

    # 4. Seed Room Types
    rt_col = db.room_types
    rt1 = await rt_col.find_one({"property_id": p1_id, "code": "DLX-OCN"})
    if not rt1:
        rt1_doc = {
            "property_id": p1_id,
            "name": "Deluxe Ocean View",
            "code": "DLX-OCN",
            "description": "Spacious room overlooking the Arabian Sea with private balcony, king bed, and marble bathtub.",
            "max_occupancy": 3,
            "adults_capacity": 2,
            "children_capacity": 1,
            "bed_type": "KING",
            "bed_count": 1,
            "base_price": 7500.0,
            "amenities": ["Ocean View", "Private Balcony", "Smart TV", "Mini Bar", "Espresso Machine", "Rain Shower"],
            "size": "450 sq ft",
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
                    "public_id": "pgmadeeazy/room-types/deluxe_ocean",
                    "resource_type": "image"
                }
            ],
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now,
        }
        res = await rt_col.insert_one(rt1_doc)
        rt1_id = str(res.inserted_id)
        print("Created Room Type: Deluxe Ocean View (DLX-OCN)")
    else:
        rt1_id = str(rt1["_id"])

    rt2 = await rt_col.find_one({"property_id": p1_id, "code": "EXE-STE"})
    if not rt2:
        rt2_doc = {
            "property_id": p1_id,
            "name": "Executive Royal Suite",
            "code": "EXE-STE",
            "description": "Ultra-luxury suite featuring private terrace plunge pool, separate living area, and dedicated butler service.",
            "max_occupancy": 4,
            "adults_capacity": 3,
            "children_capacity": 2,
            "bed_type": "KING",
            "bed_count": 2,
            "base_price": 14500.0,
            "amenities": ["Plunge Pool", "Terrace", "Butler Service", "Living Room", "Walk-in Wardrobe", "Jacuzzi"],
            "size": "850 sq ft",
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
                    "public_id": "pgmadeeazy/room-types/executive_suite",
                    "resource_type": "image"
                }
            ],
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now,
        }
        res = await rt_col.insert_one(rt2_doc)
        rt2_id = str(res.inserted_id)
        print("Created Room Type: Executive Royal Suite (EXE-STE)")
    else:
        rt2_id = str(rt2["_id"])

    # 5. Seed Rooms
    rooms_col = db.rooms
    room_configs = [
        {"num": "101", "floor": 1, "rt": rt1_id, "status": "OCCUPIED"},
        {"num": "102", "floor": 1, "rt": rt1_id, "status": "AVAILABLE"},
        {"num": "103", "floor": 1, "rt": rt1_id, "status": "CLEANING"},
        {"num": "104", "floor": 1, "rt": rt1_id, "status": "AVAILABLE"},
        {"num": "201", "floor": 2, "rt": rt2_id, "status": "RESERVED"},
        {"num": "202", "floor": 2, "rt": rt2_id, "status": "AVAILABLE"},
        {"num": "203", "floor": 2, "rt": rt2_id, "status": "MAINTENANCE"},
    ]

    room_ids = {}
    for r in room_configs:
        existing_r = await rooms_col.find_one({"property_id": p1_id, "room_number": r["num"]})
        if not existing_r:
            doc = {
                "property_id": p1_id,
                "room_type_id": r["rt"],
                "room_number": r["num"],
                "floor": r["floor"],
                "status": r["status"],
                "housekeeping_status": "DIRTY" if r["status"] == "CLEANING" else "CLEAN",
                "maintenance_status": "UNDER_REPAIR" if r["status"] == "MAINTENANCE" else "NONE",
                "notes": "Poolside access" if r["floor"] == 1 else "Panoramic vista",
                "created_at": now,
                "updated_at": now,
            }
            res = await rooms_col.insert_one(doc)
            room_ids[r["num"]] = str(res.inserted_id)
        else:
            room_ids[r["num"]] = str(existing_r["_id"])
    print(f"Created/Verified {len(room_configs)} rooms.")

    # 6. Seed Guests
    guests_col = db.guests
    guest_data = [
        {
            "first_name": "Alexander",
            "last_name": "Wright",
            "email": "alex.wright@globaltravel.com",
            "phone": "+91 9876543210",
            "nationality": "British",
            "preferences": "High floor, extra feather pillows, sparkling water on arrival.",
            "notes": "VIP corporate traveler",
        },
        {
            "first_name": "Priya",
            "last_name": "Sharma",
            "email": "priya.sharma@techventure.in",
            "phone": "+91 9876543211",
            "nationality": "Indian",
            "preferences": "Vegetarian breakfast, late check-out requested.",
            "notes": "Celebrating wedding anniversary",
        },
    ]

    guest_ids = {}
    for g in guest_data:
        existing_g = await guests_col.find_one({"email": g["email"]})
        if not existing_g:
            g_doc = {
                **g,
                "date_of_birth": "1988-06-15",
                "gender": "Other",
                "country": "India",
                "city": "Mumbai",
                "identity_type": "PASSPORT",
                "identity_number": "P12345678",
                "created_at": now,
                "updated_at": now,
            }
            res = await guests_col.insert_one(g_doc)
            guest_ids[g["email"]] = str(res.inserted_id)
        else:
            guest_ids[g["email"]] = str(existing_g["_id"])
    print(f"Created/Verified {len(guest_data)} guest profiles.")

    # 7. Seed Sample Reservations
    res_col = db.reservations
    sample_reservations = [
        {
            "booking_reference": f"NGX-{today.strftime('%Y%m%d')}-10101",
            "property_id": p1_id,
            "guest_id": guest_ids["alex.wright@globaltravel.com"],
            "room_id": room_ids["101"],
            "room_type_id": rt1_id,
            "check_in_date": today.isoformat(),
            "check_out_date": (today + timedelta(days=3)).isoformat(),
            "number_of_adults": 2,
            "number_of_children": 0,
            "number_of_rooms": 1,
            "rate_per_night": 7500.0,
            "number_of_nights": 3,
            "subtotal": 22500.0,
            "taxes": 2700.0,
            "discounts": 0.0,
            "total_amount": 25200.0,
            "special_requests": "Airport transfer requested at 2:00 PM.",
            "source": "DIRECT",
            "status": "CHECKED_IN",
            "checked_in_at": now,
            "checked_in_by": admin_id,
            "created_at": now,
            "updated_at": now,
            "created_by": admin_id,
        },
        {
            "booking_reference": f"NGX-{today.strftime('%Y%m%d')}-20202",
            "property_id": p1_id,
            "guest_id": guest_ids["priya.sharma@techventure.in"],
            "room_id": room_ids["201"],
            "room_type_id": rt2_id,
            "check_in_date": today.isoformat(),
            "check_out_date": (today + timedelta(days=2)).isoformat(),
            "number_of_adults": 2,
            "number_of_children": 1,
            "number_of_rooms": 1,
            "rate_per_night": 14500.0,
            "number_of_nights": 2,
            "subtotal": 29000.0,
            "taxes": 3480.0,
            "discounts": 1000.0,
            "total_amount": 31480.0,
            "special_requests": "Anniversary cake and flower arrangement in room.",
            "source": "WEBSITE",
            "status": "CONFIRMED",
            "created_at": now,
            "updated_at": now,
            "created_by": admin_id,
        }
    ]

    for r in sample_reservations:
        existing_res = await res_col.find_one({"booking_reference": r["booking_reference"]})
        if not existing_res:
            await res_col.insert_one(r)
            print(f"Created Reservation: {r['booking_reference']} (Status: {r['status']})")

    print("\nDatabase seeding completed successfully!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
