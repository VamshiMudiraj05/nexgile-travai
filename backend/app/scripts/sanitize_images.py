import asyncio
from bson import ObjectId
from app.database.mongodb import connect_to_mongo, get_database, close_mongo_connection

DEFAULT_PROP_IMAGES = [
    {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "public_id": "default_prop_1", "resource_type": "image"},
    {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", "public_id": "default_prop_2", "resource_type": "image"}
]
DEFAULT_RT_IMAGES = [
    {"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", "public_id": "default_room_1", "resource_type": "image"}
]

async def sanitize():
    await connect_to_mongo()
    db = get_database()
    
    props = await db.properties.find().to_list(100)
    for p in props:
        clean_imgs = []
        for img in p.get("images", []) or []:
            if isinstance(img, dict) and img.get("url") and not str(img["url"]).startswith("blob:"):
                clean_imgs.append(img)
            elif isinstance(img, str) and not img.startswith("blob:"):
                clean_imgs.append({"url": img, "public_id": "img", "resource_type": "image"})
        if not clean_imgs:
            clean_imgs = DEFAULT_PROP_IMAGES
        await db.properties.update_one({"_id": p["_id"]}, {"$set": {"images": clean_imgs}})
        pname = p.get("name")
        print(f"Updated property {pname}: {len(clean_imgs)} images")

    rts = await db.room_types.find().to_list(100)
    for rt in rts:
        clean_imgs = []
        for img in rt.get("images", []) or []:
            if isinstance(img, dict) and img.get("url") and not str(img["url"]).startswith("blob:"):
                clean_imgs.append(img)
            elif isinstance(img, str) and not img.startswith("blob:"):
                clean_imgs.append({"url": img, "public_id": "img", "resource_type": "image"})
        if not clean_imgs:
            clean_imgs = DEFAULT_RT_IMAGES
        await db.room_types.update_one({"_id": rt["_id"]}, {"$set": {"images": clean_imgs}})
        rtname = rt.get("name")
        print(f"Updated room_type {rtname}: {len(clean_imgs)} images")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(sanitize())
