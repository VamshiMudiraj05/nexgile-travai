import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import hash_password

HOTELS_DATA = [
    {
        "name": "The Oberoi Udaivilas Palace & Sanctuaries",
        "property_code": "IND-UDR-001",
        "property_type": "RESORT",
        "description": "Rising majestically on the banks of Lake Pichola, this legendary Mewari palace features domed cupolas, whispering fountains, private swimming pools, and majestic peacocks roaming lush terraced gardens.",
        "address": "Haridas Ji Ki Magri, Lake Pichola",
        "city": "Udaipur",
        "state": "Rajasthan",
        "country": "India",
        "postal_code": "313001",
        "latitude": 24.5772,
        "longitude": 73.6708,
        "phone": "+91 294 243 3300",
        "email": "concierge.udaipur@nexgile.com",
        "website": "https://udaivilas.nexgile.com",
        "star_rating": 5,
        "amenities": ["Lake View", "Private Plunge Pool", "Ayurvedic Spa", "Royal Boat Arrival", "Mewar Fine Dining", "Butler Service", "Valet Parking", "Free High-Speed WiFi"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-udr-001_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-udr-001_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-udr-001_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-udr-001_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Premier Lake View Suite",
                "code": "UDR-PLV",
                "description": "Luxurious chambers overlooking Lake Pichola with private terrace, semi-private pool access, and marble lotus bathtub.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 14500.0,
                "base_rate": 14500.0,
                "amenities": ["Lake Pichola View", "Terrace", "Espresso Machine", "Marble Bath", "Smart TV"],
                "size": "650 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "udr_room1"}]
            },
            {
                "name": "Kohinoor Royal Villa with Pool",
                "code": "UDR-KOH",
                "description": "Private standalone palace sanctuary with full-length private pool, master dining salon, and 24-hour dedicated royal butler.",
                "max_occupancy": 4,
                "adults_capacity": 4,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 28000.0,
                "base_rate": 28000.0,
                "amenities": ["Private Infinity Pool", "Private Courtyard", "Butler Service", "Jacuzzi", "Dining Room"],
                "size": "2600 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "udr_room2"}]
            }
        ]
    },
    {
        "name": "Rambagh Palace Heritage Estate",
        "code": "IND-JAI-002",
        "property_type": "PALACE",
        "description": "Former residence of the Maharaja of Jaipur, featuring opulent Rajput architecture, marbled corridors, manicured Mughal gardens, and peacocks strolling across regal lawns.",
        "address": "Bhawani Singh Road, C-Scheme",
        "city": "Jaipur",
        "state": "Rajasthan",
        "country": "India",
        "postal_code": "302005",
        "latitude": 26.8979,
        "longitude": 75.8083,
        "phone": "+91 141 238 5700",
        "email": "concierge.jaipur@nexgile.com",
        "website": "https://rambagh.nexgile.com",
        "star_rating": 5,
        "amenities": ["Peacock Gardens", "Jiva Grand Spa", "Heritage Polo Lounge", "Suvarna Mahal Thali", "Indoor & Outdoor Pools", "Vintage Car Transfers", "Valet Parking"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jai-002_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jai-002_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jai-002_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jai-002_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Palace Garden Room",
                "code": "JAI-PGR",
                "description": "Historic chambers with period furnishings, silk brocades, four-poster bed, and views of sprawling royal gardens.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 22000.0,
                "base_rate": 22000.0,
                "amenities": ["Garden View", "Four-Poster Bed", "Marble Bath", "High Tea In-Room"],
                "size": "550 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "jai_room1"}]
            },
            {
                "name": "Maharani Royal Suite",
                "code": "JAI-MRS",
                "description": "Once the personal suite of Maharani Gayatri Devi, featuring crystal chandeliers, heritage mirror-work, and a private royal terrace.",
                "max_occupancy": 4,
                "adults_capacity": 2,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 48000.0,
                "base_rate": 48000.0,
                "amenities": ["Royal Terrace", "Crystal Chandeliers", "Butler Service", "Heritage Antiques"],
                "size": "1800 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "jai_room2"}]
            }
        ]
    },
    {
        "name": "Taj Exotica Resort & Ayurvedic Pavilion",
        "code": "IND-GOA-003",
        "property_type": "RESORT",
        "description": "Sprawled across 56 acres of lush Mediterranean-style gardens along pristine Benaulim Beach in South Goa, offering tranquil sea-breeze villas and authentic Ayurvedic healing.",
        "address": "Calwaddo, Benaulim Beach",
        "city": "Goa",
        "state": "Goa",
        "country": "India",
        "postal_code": "403716",
        "latitude": 15.2505,
        "longitude": 73.9189,
        "phone": "+91 832 668 3333",
        "email": "concierge.goa@nexgile.com",
        "website": "https://tajexotica.nexgile.com",
        "star_rating": 5,
        "amenities": ["Beachfront Access", "Mediterranean Dining", "Ayurvedic Wellness Sanctuary", "Golf Course", "Infinity Ocean Pool", "Sunset Cocktail Bar", "Water Sports"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-goa-003_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-goa-003_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-goa-003_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-goa-003_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Luxury Ocean Front Villa",
                "code": "GOA-LOV",
                "description": "Secluded Goan-Portuguese villa directly facing the Arabian Sea with private garden hammock and outdoor rain shower.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 18500.0,
                "base_rate": 18500.0,
                "amenities": ["Direct Beach Access", "Private Verandah", "Outdoor Rain Shower", "Ocean View"],
                "size": "700 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "goa_room1"}]
            },
            {
                "name": "Presidential Sunset Suite",
                "code": "GOA-PSS",
                "description": "Grand panoramic oceanfront residence with private plunge pool, sundowner terrace, and personal chef on call.",
                "max_occupancy": 4,
                "adults_capacity": 4,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 36000.0,
                "base_rate": 36000.0,
                "amenities": ["Private Plunge Pool", "Sunset Deck", "Chef On Call", "Jacuzzi"],
                "size": "1500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "goa_room2"}]
            }
        ]
    },
    {
        "name": "The Taj Mahal Palace & Tower Colaba",
        "code": "IND-MUM-004",
        "property_type": "HOTEL",
        "description": "India's most iconic harbor landmark since 1903, overlooking the Gateway of India and the Arabian Sea with legendary hospitality, fine dining, and priceless art.",
        "address": "Apollo Bunder, Gateway of India, Colaba",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "postal_code": "400001",
        "latitude": 18.9217,
        "longitude": 72.8332,
        "phone": "+91 22 6665 3366",
        "email": "concierge.mumbai@nexgile.com",
        "website": "https://tajpalacemumbai.nexgile.com",
        "star_rating": 5,
        "amenities": ["Harbor View", "Sea Lounge Afternoon Tea", "Wasabi Japanese Dining", "Heritage Wing Butler", "Luxury Yacht Charter", "Spa & Salon", "Valet Parking"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-mum-004_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-mum-004_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-mum-004_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-mum-004_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Grand Luxury Sea View Room",
                "code": "MUM-GLS",
                "description": "Heritage Wing room with panoramic views of the Gateway of India and harbor, adorned with authentic Indian antiquities.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 24000.0,
                "base_rate": 24000.0,
                "amenities": ["Gateway of India View", "Heritage Furniture", "Deep Soaking Tub", "Butler Service"],
                "size": "500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "mum_room1"}]
            },
            {
                "name": "Tata Presidential Suite",
                "code": "MUM-TPS",
                "description": "Legendary top-floor suite featuring Makrana marble, gold leaf ceilings, private boardroom, and bulletproof glass with harbor vista.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 65000.0,
                "base_rate": 65000.0,
                "amenities": ["360 Harbor View", "Private Boardroom", "Personal Butler", "Private Gym"],
                "size": "3000 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "mum_room2"}]
            }
        ]
    },
    {
        "name": "The Imperial New Delhi Janpath",
        "code": "IND-DEL-005",
        "property_type": "HOTEL",
        "description": "An oasis of tranquility built in 1936, combining Victorian, Old Colonial, and Art Deco heritage with sprawling royal palm gardens in the heart of Delhi.",
        "address": "Janpath Lane, Connaught Place",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "postal_code": "110001",
        "latitude": 28.6231,
        "longitude": 77.2185,
        "phone": "+91 11 2334 1234",
        "email": "concierge.delhi@nexgile.com",
        "website": "https://imperialdelhi.nexgile.com",
        "star_rating": 5,
        "amenities": ["Colonial Art Gallery", "1911 Royal Verandah", "The Spice Route Dining", "Holistic Wellness Spa", "Heated Swimming Pool", "Diplomatic Concierge", "High-Speed WiFi"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-del-005_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-del-005_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-del-005_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-del-005_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Heritage Deco Room",
                "code": "DEL-HDR",
                "description": "High-ceilinged colonial room with Burmese teak woodwork, Italian marble bath, and vintage art pieces.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 16500.0,
                "base_rate": 16500.0,
                "amenities": ["Teak Furniture", "High Ceilings", "Italian Marble Bath", "Garden View"],
                "size": "500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "del_room1"}]
            },
            {
                "name": "Lord Curzon Imperial Suite",
                "code": "DEL-LCS",
                "description": "Stately diplomatic apartment with private reception parlor, antique dining room, and personalized sommelier service.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 38000.0,
                "base_rate": 38000.0,
                "amenities": ["Reception Parlor", "Private Dining", "Sommelier Service", "Curzon Art Collection"],
                "size": "1600 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "del_room2"}]
            }
        ]
    },
    {
        "name": "The Leela Palace Royal Chola Estate",
        "code": "IND-BLR-006",
        "property_type": "HOTEL",
        "description": "Architectural homage to the royal dynasties of Southern India, nestled amidst 7 acres of cascading waterfalls, grand copper domes, and serene lotus lagoons.",
        "address": "Old Airport Road, Kodihalli",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "postal_code": "560008",
        "latitude": 12.9606,
        "longitude": 77.6484,
        "phone": "+91 80 2521 1234",
        "email": "concierge.bengaluru@nexgile.com",
        "website": "https://leelabangalore.nexgile.com",
        "star_rating": 5,
        "amenities": ["Royal Club Privileges", "Lush Tropical Gardens", "Jamavar Royal Indian Dining", "The Library Bar", "Outdoor Lagoon Pool", "Espresso Lounge", "Helipad Access"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-blr-006_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-blr-006_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-blr-006_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-blr-006_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Royal Premier Room",
                "code": "BLR-RPR",
                "description": "Spacious sanctuary featuring private balcony overlooking the palace gardens, gold-trimmed upholstery, and walk-in closet.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 15000.0,
                "base_rate": 15000.0,
                "amenities": ["Lagoon View", "Private Balcony", "Walk-in Wardrobe", "Smart Workspace"],
                "size": "550 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "blr_room1"}]
            },
            {
                "name": "Maharaja Royal Suite",
                "code": "BLR-MRS",
                "description": "Exquisite royal suite with gold-plated bathroom fittings, private spa treatment room, and dedicated 24-hour butler.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 34000.0,
                "base_rate": 34000.0,
                "amenities": ["Gold Fittings", "In-Room Spa", "Butler Service", "Terrace Garden"],
                "size": "1500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "blr_room2"}]
            }
        ]
    },
    {
        "name": "Kumarakom Lake Resort & Ayurvedic Retreat",
        "code": "IND-KER-007",
        "property_type": "RESORT",
        "description": "Nestled along the emerald shores of Vembanad Lake, featuring traditional 16th-century ancestral Kerala homes reconstructed piece by piece amidst meandering canals.",
        "address": "Vembanad Lake Shore, Kumarakom",
        "city": "Kumarakom",
        "state": "Kerala",
        "country": "India",
        "postal_code": "686563",
        "latitude": 9.6175,
        "longitude": 76.4278,
        "phone": "+91 481 252 4900",
        "email": "concierge.kerala@nexgile.com",
        "website": "https://kumarakomlakeresort.nexgile.com",
        "star_rating": 5,
        "amenities": ["Meandering Pool Villas", "Traditional Houseboat Cruises", "Ayurmana Ancient Healing", "Seafood Bar on Lake", "Kalaripayattu Demonstrations", "Sunset Canoe Safari"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-ker-007_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-ker-007_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-ker-007_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-ker-007_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Heritage Villa with Private Pool",
                "code": "KER-HVP",
                "description": "Authentic wood-carved Kerala courtyard villa with open-to-sky shower and private plunge pool amidst tropical flora.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 21000.0,
                "base_rate": 21000.0,
                "amenities": ["Private Pool", "Open-Sky Shower", "Canal View", "Teak Wood Carvings"],
                "size": "750 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "ker_room1"}]
            },
            {
                "name": "Luxury Floating Backwater Suite",
                "code": "KER-LFB",
                "description": "Private motorized luxury kettuvallam houseboat moored on Lake Vembanad with personal chef and river captain.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 32000.0,
                "base_rate": 32000.0,
                "amenities": ["Houseboat Navigation", "Personal Chef", "Sun Deck", "360 Lake Panorama"],
                "size": "1200 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ker_room2"}]
            }
        ]
    },
    {
        "name": "BrijRama Palace on Darbhanga Ghat",
        "code": "IND-VNS-008",
        "property_type": "PALACE",
        "description": "One of the oldest landmarks on the sacred Varanasi riverfront, built in 1812 with stone ramparts rising dramatically above the Ganges, accessed exclusively by private royal bajra boats.",
        "address": "Darbhanga Ghat, Dashashwamedh",
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "country": "India",
        "postal_code": "221001",
        "latitude": 25.3059,
        "longitude": 83.0108,
        "phone": "+91 542 245 4222",
        "email": "concierge.varanasi@nexgile.com",
        "website": "https://brijrama.nexgile.com",
        "star_rating": 5,
        "amenities": ["Ganges Ghat View", "Bajra Boat Ganga Aarti Access", "Live Classical Sitar Evenings", "Pure Vegetarian Royal Thali", "Riverfront Rooftop Dining", "Private Yoga Sessions"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-vns-008_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-vns-008_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-vns-008_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-vns-008_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Nadidhara Ganges View Room",
                "code": "VNS-NGR",
                "description": "Stone-walled heritage chamber with arched windows framing morning sunrise rituals over the holy river Ganges.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 19000.0,
                "base_rate": 19000.0,
                "amenities": ["Ganges Sunrise View", "Handcrafted Silk Throws", "Traditional Brass Fittings"],
                "size": "450 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "vns_room1"}]
            },
            {
                "name": "Maharaja Heritage Suite",
                "code": "VNS-MHS",
                "description": "Opulent master quarters once reserved for the royals of Darbhanga, with private sitar parlor and riverfront balcony.",
                "max_occupancy": 4,
                "adults_capacity": 2,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 35000.0,
                "base_rate": 35000.0,
                "amenities": ["Ghat Balcony", "Sitar Parlor", "Royal Thali In-Room", "Butler Service"],
                "size": "1100 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "vns_room2"}]
            }
        ]
    },
    {
        "name": "The Oberoi Amarvilas Taj Sanctuary",
        "code": "IND-AGR-009",
        "property_type": "RESORT",
        "description": "Located just 600 meters from the Taj Mahal, every single guest chamber offers uninterrupted, breathtaking views of the world's most romantic monument amidst Mughal fountains.",
        "address": "Taj East Gate Road",
        "city": "Agra",
        "state": "Uttar Pradesh",
        "country": "India",
        "postal_code": "282001",
        "latitude": 27.1685,
        "longitude": 78.0538,
        "phone": "+91 562 223 1515",
        "email": "concierge.agra@nexgile.com",
        "website": "https://amarvilas.nexgile.com",
        "star_rating": 5,
        "amenities": ["Unobstructed Taj Mahal Views", "Private Golf Buggy to Monument", "Mughal Terraced Lawns", "Esphahan Tandoor Dining", "Colonnaded Swimming Pool", "Royal Hammam"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-agr-009_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-agr-009_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-agr-009_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-agr-009_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Premier Room with Taj View",
                "code": "AGR-PRT",
                "description": "Opulent room featuring teak floors, hand-knotted Indian carpets, and private balcony directly framing the Taj Mahal.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 31000.0,
                "base_rate": 31000.0,
                "amenities": ["Direct Taj Mahal View", "Private Balcony", "Marble Bath", "High Tea In-Room"],
                "size": "500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "agr_room1"}]
            },
            {
                "name": "Kohinoor Taj View Suite",
                "code": "AGR-KTS",
                "description": "Monumental suite offering triple terrace vistas of the Taj, private dining salon, sauna, and dedicated personal butler.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 62000.0,
                "base_rate": 62000.0,
                "amenities": ["Triple Balcony Taj View", "Private Sauna", "Butler Service", "Grand Piano"],
                "size": "2700 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "agr_room2"}]
            }
        ]
    },
    {
        "name": "Wildflower Hall Mountain Spa Sanctuary",
        "code": "IND-SML-010",
        "property_type": "RESORT",
        "description": "Perched at 8,250 feet amidst 23 acres of virgin cedar and pine forests, this former summer residence of Lord Kitchener provides breathtaking vistas of snow-capped Himalayan peaks.",
        "address": "Charabra, Mashobra Valley",
        "city": "Shimla",
        "state": "Himachal Pradesh",
        "country": "India",
        "postal_code": "171012",
        "latitude": 31.1352,
        "longitude": 77.2458,
        "phone": "+91 177 264 8585",
        "email": "concierge.shimla@nexgile.com",
        "website": "https://wildflowerhall.nexgile.com",
        "star_rating": 5,
        "amenities": ["Himalayan Peak Vistas", "Open-Air Heated Whirlpool", "Pine Forest Nature Walks", "Cedar Wood Fireplaces", "Archery & Mountain Biking", "Alpine Spa Treatments"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-sml-010_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-sml-010_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-sml-010_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-sml-010_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Deluxe Valley View Room",
                "code": "SML-DVV",
                "description": "Warm alpine room with Burma teak flooring, marble bathroom with mountain vistas, and walk-in wardrobe.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 23500.0,
                "base_rate": 23500.0,
                "amenities": ["Himalayan Valley View", "Fireplace Heating", "Soaking Tub", "Teak Decor"],
                "size": "550 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "sml_room1"}]
            },
            {
                "name": "Lord Kitchener Mountain Suite",
                "code": "SML-LKS",
                "description": "Historic top-floor suite featuring grand working fireplace, private cedar-paneled dining room, and 180-degree Himalayan snow views.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 42000.0,
                "base_rate": 42000.0,
                "amenities": ["Working Fireplace", "Cedar Dining Room", "180 Snow Panorama", "Butler Service"],
                "size": "1400 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "sml_room2"}]
            }
        ]
    },
    {
        "name": "Ananda in the Himalayas Wellness Palace",
        "code": "IND-RSK-011",
        "property_type": "RESORT",
        "description": "World-renowned holistic wellness destination estate set on a 100-acre Maharaja's palace estate overlooking the spiritual town of Rishikesh and the holy Ganges River valley.",
        "address": "The Palace Estate, Narendra Nagar",
        "city": "Rishikesh",
        "state": "Uttarakhand",
        "country": "India",
        "postal_code": "249175",
        "latitude": 30.1558,
        "longitude": 78.2934,
        "phone": "+91 1378 227 500",
        "email": "concierge.rishikesh@nexgile.com",
        "website": "https://anandaspa.nexgile.com",
        "star_rating": 5,
        "amenities": ["Ayurvedic Detox Programs", "Vedanta Philosophy Sessions", "Hydrotherapy Sanctuary", "Mountain Golf Course", "Ganga Valley Meditation", "Organic Wellness Cuisine"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-rsk-011_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-rsk-011_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-rsk-011_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-rsk-011_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Palace Valley View Room",
                "code": "RSK-PVR",
                "description": "Serene room with private balcony overlooking the Ganges valley, minimalist Indian silk furnishings, and herbal amenities.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 27000.0,
                "base_rate": 27000.0,
                "amenities": ["Ganges Valley View", "Private Balcony", "Ayurvedic Amenities", "Meditation Mat"],
                "size": "500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "rsk_room1"}]
            },
            {
                "name": "Viceregal Tea Villa",
                "code": "RSK-VTV",
                "description": "Secluded private villa with lap pool, outdoor gazebo, private yoga pavilion, and personal wellness physician.",
                "max_occupancy": 4,
                "adults_capacity": 2,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 50000.0,
                "base_rate": 50000.0,
                "amenities": ["Private Lap Pool", "Yoga Pavilion", "Doctor Consultation", "Organic Kitchen"],
                "size": "1800 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "rsk_room2"}]
            }
        ]
    },
    {
        "name": "Taj Falaknuma Palace & Heritage Haven",
        "code": "IND-HYD-012",
        "property_type": "PALACE",
        "description": "Perched 2,000 feet above the City of Pearls, this scorpion-shaped Italian marble palace was the residence of the world-famous Nizam of Hyderabad, featuring Venetian chandeliers and Belgian stained glass.",
        "address": "Engine Bowli, Falaknuma",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "postal_code": "500053",
        "latitude": 17.3312,
        "longitude": 78.4674,
        "phone": "+91 40 6629 8585",
        "email": "concierge.hyderabad@nexgile.com",
        "website": "https://falaknuma.nexgile.com",
        "star_rating": 5,
        "amenities": ["Horse-Drawn Carriage Arrival", "Nizami 101-Seater Dining Hall", "Heritage Jade Room Tour", "Hookah Lounge", "Private Palace Historian", "Bespoke Royal Feasts"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-hyd-012_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-hyd-012_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-hyd-012_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-hyd-012_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Palace Luxury Heritage Room",
                "code": "HYD-PLH",
                "description": "Historic chambers restored with French tapestries, oak woodwork, marble fireplaces, and courtyard views.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 29000.0,
                "base_rate": 29000.0,
                "amenities": ["French Tapestries", "Marble Fireplace", "Palace Courtyard View", "Nizami High Tea"],
                "size": "550 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "hyd_room1"}]
            },
            {
                "name": "Nizam Grand Royal Suite",
                "code": "HYD-NGR",
                "description": "Once the private chambers of the Nizam of Hyderabad, with private swimming pool, personal library, and bespoke dinner for ten.",
                "max_occupancy": 4,
                "adults_capacity": 4,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 58000.0,
                "base_rate": 58000.0,
                "amenities": ["Private Pool", "Nizam Library Access", "Royal Butler", "Private Carriage Tour"],
                "size": "2500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "hyd_room2"}]
            }
        ]
    },
    {
        "name": "Umaid Bhawan Palace Estate",
        "code": "IND-JDH-013",
        "property_type": "PALACE",
        "description": "One of the world's largest royal residences, built with golden-yellow sandstone in Art Deco grandeur, home to the Jodhpur Royal Family with private underground Zodiac pool.",
        "address": "Circuit House Road, Cantt Area",
        "city": "Jodhpur",
        "state": "Rajasthan",
        "country": "India",
        "postal_code": "342006",
        "latitude": 26.2808,
        "longitude": 73.0475,
        "phone": "+91 291 251 0101",
        "email": "concierge.jodhpur@nexgile.com",
        "website": "https://umaidbhawan.nexgile.com",
        "star_rating": 5,
        "amenities": ["Art Deco Royal Architecture", "Subterranean Zodiac Pool", "Pillared Marble Verandahs", "Vintage Car Museum", "Risala Marwar Dining", "Royal Falconry Shows"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jdh-013_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jdh-013_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jdh-013_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jdh-013_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Palace Garden Heritage Room",
                "code": "JDH-PGH",
                "description": "Art Deco chambers with gilded mirrors, rich fabrics, circular bathtub, and garden terrace overlooking the Blue City.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 26000.0,
                "base_rate": 26000.0,
                "amenities": ["Art Deco Design", "Circular Bathtub", "Blue City View", "Garden Terrace"],
                "size": "550 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "jdh_room1"}]
            },
            {
                "name": "Maharaja Umaid Singh Royal Suite",
                "code": "JDH-MUS",
                "description": "Spectacular royal master residence with private dining salon, steam room, curated royal weapons collection, and private butler.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 52000.0,
                "base_rate": 52000.0,
                "amenities": ["Private Steam Room", "Dining Salon", "Art Deco Bar", "Royal Butler"],
                "size": "2200 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "jdh_room2"}]
            }
        ]
    },
    {
        "name": "Suryagarh Golden Fort Sanctuary",
        "code": "IND-JSL-014",
        "property_type": "RESORT",
        "description": "An imposing stone fortress carved out of golden Jaisalmer sandstone in the Great Thar Desert, preserving ancient desert lore, royal halwai sweets, and sundowner dune galas.",
        "address": "Kahala Phata, Sam Road",
        "city": "Jaisalmer",
        "state": "Rajasthan",
        "country": "India",
        "postal_code": "345001",
        "latitude": 26.9157,
        "longitude": 70.8351,
        "phone": "+91 7827 151 151",
        "email": "concierge.jaisalmer@nexgile.com",
        "website": "https://suryagarh.nexgile.com",
        "star_rating": 5,
        "amenities": ["Desert Camel Expeditions", "Chudail Trail Night Walks", "Dunes Gala Dinner under Stars", "Thar Salt Spa Therapy", "Courtyard Halwai Breakfast", "Folk Manganiyar Music"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jsl-014_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jsl-014_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jsl-014_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-jsl-014_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Fort Luxury Room",
                "code": "JSL-FLR",
                "description": "Hand-carved jali stone windows, rich block-printed tapestries, and serene views of the Thar Desert expanse.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 17500.0,
                "base_rate": 17500.0,
                "amenities": ["Jali Stone Screen", "Desert Vistas", "Traditional Soaking Tub", "Complimentary Halwai Sweets"],
                "size": "500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "jsl_room1"}]
            },
            {
                "name": "Jaisalmer Haveli Villa",
                "code": "JSL-JHV",
                "description": "Standalone golden sandstone haveli with private desert courtyard, sandstone plunge pool, and starlight terrace.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 35000.0,
                "base_rate": 35000.0,
                "amenities": ["Private Sandstone Pool", "Private Courtyard", "Starlight Roof Terrace", "Private Butler"],
                "size": "1500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "jsl_room2"}]
            }
        ]
    },
    {
        "name": "Suján The Sher Bagh Safari Camp",
        "code": "IND-RNT-015",
        "property_type": "RESORT",
        "description": "A pioneering luxury tented safari camp on the fringes of Ranthambore Tiger Reserve, evoking the romance of 1920s royal shikar expeditions with 5-star comfort.",
        "address": "Sherpur, Khilchipur, Sawai Madhopur",
        "city": "Ranthambore",
        "state": "Rajasthan",
        "country": "India",
        "postal_code": "322001",
        "latitude": 26.0173,
        "longitude": 76.4326,
        "phone": "+91 11 4617 2700",
        "email": "concierge.ranthambore@nexgile.com",
        "website": "https://sherbagh.nexgile.com",
        "star_rating": 5,
        "amenities": ["Private Tiger Safari Jeeps", "Luxury Canvas Tents", "Campfire Jungle Feasts", "Resident Naturalist Guides", "Wilderness Spa Pavilions", "Stargazing Deck"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-rnt-015_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-rnt-015_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-rnt-015_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-rnt-015_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Luxury Safari Tent",
                "code": "RNT-LST",
                "description": "Air-conditioned custom canvas tent with brass fittings, teak campaign chest, private verandah, and jungle views.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 38000.0,
                "base_rate": 38000.0,
                "amenities": ["Campaign Furniture", "Air Conditioning", "Verandah", "Binoculars & Field Guide"],
                "size": "600 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "rnt_room1"}]
            },
            {
                "name": "Royal Tiger Suite with Heated Pool",
                "code": "RNT-RTS",
                "description": "Ultra-private walled compound with heated plunge pool, tree-shaded deck, private naturalist, and exclusive safari vehicle.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 72000.0,
                "base_rate": 72000.0,
                "amenities": ["Heated Plunge Pool", "Dedicated Safari Vehicle", "Personal Butler", "Private Deck"],
                "size": "2100 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "rnt_room2"}]
            }
        ]
    },
    {
        "name": "The Oberoi Grand Heritage Estate",
        "code": "IND-CCU-016",
        "property_type": "HOTEL",
        "description": "Affectionately known as the 'Grande Dame of Chowringhee', this stately Victorian neoclassical hotel has stood as the centerpiece of Kolkata's cultural elite since 1887.",
        "address": "15 Jawaharlal Nehru Road, New Market Area",
        "city": "Kolkata",
        "state": "West Bengal",
        "country": "India",
        "postal_code": "700013",
        "latitude": 22.5604,
        "longitude": 88.3518,
        "phone": "+91 33 2249 2323",
        "email": "concierge.kolkata@nexgile.com",
        "website": "https://oberoigrand.nexgile.com",
        "star_rating": 5,
        "amenities": ["Grande Dame Colonial Verandah", "Baan Thai Authentic Cuisine", "Palm Tree Quadrangle Pool", "High Tea with Darjeeling First Flush", "Chowringhee Ballroom"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-ccu-016_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-ccu-016_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-ccu-016_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-ccu-016_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Luxury Colonial Room",
                "code": "CCU-LCR",
                "description": "High-ceilinged chamber with dark polished timber floors, antique clawfoot bathtub, and courtyard pool vistas.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 12500.0,
                "base_rate": 12500.0,
                "amenities": ["Timber Floors", "Clawfoot Tub", "Darjeeling Tea Caddy", "Courtyard View"],
                "size": "450 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "ccu_room1"}]
            },
            {
                "name": "Curzon Grand Presidential Suite",
                "code": "CCU-CPS",
                "description": "Stately colonial penthouse with four-poster rosewood bed, private boardroom, crystal chandeliers, and butler service.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 29000.0,
                "base_rate": 29000.0,
                "amenities": ["Rosewood Four-Poster Bed", "Boardroom", "Crystal Chandelier", "Butler Service"],
                "size": "1500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ccu_room2"}]
            }
        ]
    },
    {
        "name": "The Leela Palace Sea-Facing Haven",
        "code": "IND-MAA-017",
        "property_type": "HOTEL",
        "description": "Chennai's only modern sea-facing palace hotel, set on 4.8 acres where the Adyar River meets the Bay of Bengal, drawing inspiration from Chettinad royal architecture.",
        "address": "Adyar Seaface, M.R.C. Nagar",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "country": "India",
        "postal_code": "600028",
        "latitude": 13.0163,
        "longitude": 80.2764,
        "phone": "+91 44 3366 1234",
        "email": "concierge.chennai@nexgile.com",
        "website": "https://leelachennai.nexgile.com",
        "star_rating": 5,
        "amenities": ["Bay of Bengal Ocean Panorama", "Chettinad Heritage Architecture", "China XO Dining", "Infinity Oceanfront Pool", "ESPA Thermal Lounges", "24/7 Butler Service"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-maa-017_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-maa-017_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-maa-017_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-maa-017_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Grand Ocean View Room",
                "code": "MAA-GOV",
                "description": "Floor-to-ceiling glass windows framing endless waves of the Bay of Bengal, equipped with marble bath and motorized drapes.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 14000.0,
                "base_rate": 14000.0,
                "amenities": ["Bay of Bengal View", "Deep Soaking Tub", "Automated Drapes", "High-Speed WiFi"],
                "size": "550 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "maa_room1"}]
            },
            {
                "name": "Royal Sea Presidential Suite",
                "code": "MAA-RSP",
                "description": "Spectacular seaside corner suite with sweeping bay terrace, master whirlpool, walk-in humidor, and dedicated royal butler.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 32000.0,
                "base_rate": 32000.0,
                "amenities": ["Ocean Terrace", "Master Whirlpool", "Private Dining", "Butler Service"],
                "size": "1600 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "maa_room2"}]
            }
        ]
    },
    {
        "name": "Evolve Back Chikkana Halli Estate",
        "code": "IND-CRG-018",
        "property_type": "RESORT",
        "description": "Sprawled across 300 acres of fragrant coffee and spice plantations in Coorg's misty Western Ghats, featuring Kodava-style private pool villas surrounded by lush flora.",
        "address": "Karadigodu Post, Siddapur",
        "city": "Coorg",
        "state": "Karnataka",
        "country": "India",
        "postal_code": "571253",
        "latitude": 12.2825,
        "longitude": 75.8752,
        "phone": "+91 8274 258 400",
        "email": "concierge.coorg@nexgile.com",
        "website": "https://evolvebackcoorg.nexgile.com",
        "star_rating": 5,
        "amenities": ["300-Acre Coffee Plantation", "Private Plantation Pool Villas", "Treehouse Canopy Dining", "Vaidyasala Ayurvedic Care", "Bird Watching Trails", "Coffee Tasting Studio"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-crg-018_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-crg-018_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-crg-018_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-crg-018_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Lily Pool Cottage",
                "code": "CRG-LPC",
                "description": "Romantic plantation cottage overlooking a tranquil lily pond with private temperature-controlled plunge pool and courtyard.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 24000.0,
                "base_rate": 24000.0,
                "amenities": ["Lily Pool View", "Private Plunge Pool", "Courtyard", "Coffee Bean Roaster"],
                "size": "950 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "crg_room1"}]
            },
            {
                "name": "Heritage Plantation Pool Villa",
                "code": "CRG-HPP",
                "description": "Colonial planter's bungalow with large private swimming pool, separate living pavilion, and private estate naturalist.",
                "max_occupancy": 4,
                "adults_capacity": 4,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 41000.0,
                "base_rate": 41000.0,
                "amenities": ["Full Private Pool", "Living Pavilion", "Plantation Tour", "Butler Service"],
                "size": "2100 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "crg_room2"}]
            }
        ]
    },
    {
        "name": "The Lalit Grand Palace & Royal Chinar",
        "code": "IND-SXR-019",
        "property_type": "PALACE",
        "description": "Originally built in 1910 by Maharaja Pratap Singh of Kashmir, framed by the Zabarwan mountain range with ancient chinar trees overlooking the tranquil waters of Dal Lake.",
        "address": "Gupkar Road, Dal Lake View",
        "city": "Srinagar",
        "state": "Jammu & Kashmir",
        "country": "India",
        "postal_code": "190001",
        "latitude": 34.0837,
        "longitude": 74.8580,
        "phone": "+91 194 250 1001",
        "email": "concierge.srinagar@nexgile.com",
        "website": "https://lalitgrandpalace.nexgile.com",
        "star_rating": 5,
        "amenities": ["Centuries-Old Royal Chinar Trees", "Dal Lake Shikara Private Transfers", "Authentic Wazwan Feasts", "Indoor Heated Cedar Pool", "Maharajah Billiards Room", "Kashmiri Kahwa Lounge"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-sxr-019_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-sxr-019_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-sxr-019_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-sxr-019_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Royal Pine Heritage Room",
                "code": "SXR-RPH",
                "description": "Hand-carved walnut woodwork, Kashmiri khatamband wooden ceilings, and vistas of Dal Lake shimmering in the morning sun.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 20500.0,
                "base_rate": 20500.0,
                "amenities": ["Khatamband Ceiling", "Walnut Wood Decor", "Dal Lake Vistas", "Kahwa Service"],
                "size": "500 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "public_id": "sxr_room1"}]
            },
            {
                "name": "Gulab Singh Presidential Suite",
                "code": "SXR-GPS",
                "description": "Kashmiri royal master residence with working fireplace, hand-knotted silk pashmina carpets, and private dining salon.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 44000.0,
                "base_rate": 44000.0,
                "amenities": ["Kashmiri Pashmina Carpets", "Working Fireplace", "Private Dining", "Butler Service"],
                "size": "1650 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "public_id": "sxr_room2"}]
            }
        ]
    },
    {
        "name": "Palais de Mahé French Heritage Haven",
        "code": "IND-PDY-020",
        "property_type": "BOUTIQUE",
        "description": "Steeped in French colonial elegance in the heart of Pondicherry's picturesque White Town, just steps from the Bay of Bengal promenade with arched courtyards and bougainvillea.",
        "address": "Bussy Street, White Town",
        "city": "Pondicherry",
        "state": "Puducherry",
        "country": "India",
        "postal_code": "605001",
        "latitude": 11.9329,
        "longitude": 79.8338,
        "phone": "+91 413 230 0300",
        "email": "concierge.pondicherry@nexgile.com",
        "website": "https://palaisdemahe.nexgile.com",
        "star_rating": 5,
        "amenities": ["French Colonial Arches", "Central Courtyard Swimming Pool", "Les Alizés Rooftop Dining", "Boutique Ayurvedic Treatments", "Heritage Promenade Bicycles", "Café de Paris Cocktails"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-pdy-020_0", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-pdy-020_1", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-pdy-020_2", "resource_type": "image"},
            {"url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", "public_id": "ind-pdy-020_3", "resource_type": "image"},
        ],
        "room_types": [
            {
                "name": "Deluxe French Quarter Chamber",
                "code": "PDY-DFQ",
                "description": "High ceiling room with vibrant yellow-ochre colonial walls, French louvered doors, terracotta floors, and courtyard views.",
                "max_occupancy": 3,
                "adults_capacity": 2,
                "children_capacity": 1,
                "bed_type": "KING",
                "bed_count": 1,
                "base_price": 13500.0,
                "base_rate": 13500.0,
                "amenities": ["Terracotta Flooring", "French Louvered Windows", "Courtyard View", "Espresso Machine"],
                "size": "450 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80", "public_id": "pdy_room1"}]
            },
            {
                "name": "La Belle Époque Heritage Suite",
                "code": "PDY-LBE",
                "description": "Expansive top-floor French residence with private sun terrace, vintage clawfoot bathtub, and evening rooftop cocktail service.",
                "max_occupancy": 4,
                "adults_capacity": 3,
                "children_capacity": 2,
                "bed_type": "KING",
                "bed_count": 2,
                "base_price": 26000.0,
                "base_rate": 26000.0,
                "amenities": ["Private Sun Terrace", "Clawfoot Tub", "French Cocktails", "Butler Service"],
                "size": "1000 sq ft",
                "images": [{"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "public_id": "pdy_room2"}]
            }
        ]
    }
]

INDIAN_GUESTS = [
    {
        "first_name": "Arjun",
        "last_name": "Singhania",
        "email": "arjun.singhania@apexcapital.in",
        "phone": "+91 98201 12345",
        "nationality": "Indian",
        "city": "Mumbai",
        "preferences": "Quiet room, top floor, tender coconut water on arrival, gluten-free dining.",
        "notes": "Titanium Tier Club Member",
    },
    {
        "first_name": "Ananya",
        "last_name": "Deshmukh",
        "email": "ananya.deshmukh@tcs.com",
        "phone": "+91 98450 54321",
        "nationality": "Indian",
        "city": "Bengaluru",
        "preferences": "Late check-out 2:00 PM, extra feather pillows, fresh south Indian filter coffee.",
        "notes": "Corporate Travel Executive - TCS",
    },
    {
        "first_name": "Rohan",
        "last_name": "Mehta",
        "email": "rohan.mehta@relianceind.in",
        "phone": "+91 99300 98765",
        "nationality": "Indian",
        "city": "Ahmedabad",
        "preferences": "Vegetarian Jain cuisine, airport BMW transfer, newspaper: Economic Times.",
        "notes": "VIP Corporate Guest",
    },
    {
        "first_name": "Divya",
        "last_name": "Nair",
        "email": "divya.nair@infosys.com",
        "phone": "+91 98470 23456",
        "nationality": "Indian",
        "city": "Kochi",
        "preferences": "Ayurvedic massage package, morning yoga, non-smoking high floor.",
        "notes": "Celebrating Solo Wellness Retreat",
    },
    {
        "first_name": "Kabir",
        "last_name": "Kapoor",
        "email": "kabir.kapoor@delhiventures.in",
        "phone": "+91 98110 34567",
        "nationality": "Indian",
        "city": "New Delhi",
        "preferences": "Sunset view balcony, sparkling water, late arrival check-in.",
        "notes": "Founding Member, Nexgile Reserve",
    }
]


async def seed_20_hotels():
    print(f"Connecting to MongoDB at: {settings.MONGODB_URI}")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DATABASE]
    now = datetime.now(timezone.utc)
    today = now.date()

    # Get admin user ID
    admin_user = await db.users.find_one({"email": "admin@nexgile.com"})
    admin_id = str(admin_user["_id"]) if admin_user else "admin_system"

    print("=== SEEDING 20 PREMIER INDIAN HOTELS & RESORTS ===")
    
    total_properties_seeded = 0
    total_room_types_seeded = 0
    total_rooms_seeded = 0

    for h in HOTELS_DATA:
        # 1. Upsert Property
        existing_prop = await db.properties.find_one({"property_code": h["property_code"]})
        prop_doc = {
            "name": h["name"],
            "property_code": h["property_code"],
            "property_type": h["property_type"],
            "description": h["description"],
            "address": h["address"],
            "city": h["city"],
            "state": h["state"],
            "country": h["country"],
            "postal_code": h["postal_code"],
            "latitude": h["latitude"],
            "longitude": h["longitude"],
            "phone": h["phone"],
            "email": h["email"],
            "website": h["website"],
            "star_rating": h["star_rating"],
            "amenities": h["amenities"],
            "images": h["images"],
            "photos": [img["url"] for img in h["images"]],
            "check_in_time": "14:00",
            "check_out_time": "11:00",
            "currency": "INR",
            "timezone": "Asia/Kolkata",
            "status": "ACTIVE",
            "updated_at": now,
        }

        if not existing_prop:
            prop_doc["created_at"] = now
            prop_doc["created_by"] = admin_id
            res = await db.properties.insert_one(prop_doc)
            prop_id = str(res.inserted_id)
            total_properties_seeded += 1
            print(f" [+] Added Hotel: {h['name']} ({h['city']})")
        else:
            prop_id = str(existing_prop["_id"])
            await db.properties.update_one({"_id": existing_prop["_id"]}, {"$set": prop_doc})
            print(f" [✓] Updated Hotel: {h['name']} ({h['city']})")

        # 2. Seed Room Types for this property
        for rt in h["room_types"]:
            existing_rt = await db.room_types.find_one({"property_id": {"$in": [prop_id, str(prop_id)]}, "code": rt["code"]})
            rt_doc = {
                "property_id": prop_id,
                "name": rt["name"],
                "code": rt["code"],
                "description": rt["description"],
                "max_occupancy": rt["max_occupancy"],
                "adults_capacity": rt["adults_capacity"],
                "children_capacity": rt["children_capacity"],
                "bed_type": rt["bed_type"],
                "bed_count": rt["bed_count"],
                "base_price": rt["base_price"],
                "base_rate": rt["base_rate"],
                "amenities": rt["amenities"],
                "size": rt["size"],
                "images": rt["images"],
                "photos": [img["url"] for img in rt["images"]],
                "status": "ACTIVE",
                "is_active": True,
                "updated_at": now,
            }

            if not existing_rt:
                rt_doc["created_at"] = now
                rt_res = await db.room_types.insert_one(rt_doc)
                rt_id = str(rt_res.inserted_id)
                total_room_types_seeded += 1
            else:
                rt_id = str(existing_rt["_id"])
                await db.room_types.update_one({"_id": existing_rt["_id"]}, {"$set": rt_doc})

            # 3. Seed Rooms for this Room Type (create 4 available/active room units per type)
            base_floor = 1 if "Suite" not in rt["name"] else 2
            for room_seq in range(1, 5):
                room_num = f"{base_floor}0{room_seq}"
                existing_room = await db.rooms.find_one({"property_id": {"$in": [prop_id, str(prop_id)]}, "room_number": room_num})
                
                # Diverse realistic statuses
                room_status = "AVAILABLE" if room_seq <= 2 else ("OCCUPIED" if room_seq == 3 else "CLEANING")
                
                room_doc = {
                    "property_id": prop_id,
                    "room_type_id": rt_id,
                    "room_number": room_num,
                    "floor": base_floor,
                    "status": room_status,
                    "housekeeping_status": "DIRTY" if room_status == "CLEANING" else "CLEAN",
                    "maintenance_status": "NONE",
                    "notes": f"Scenic {h['city']} view",
                    "updated_at": now,
                }
                
                if not existing_room:
                    room_doc["created_at"] = now
                    await db.rooms.insert_one(room_doc)
                    total_rooms_seeded += 1
                else:
                    await db.rooms.update_one({"_id": existing_room["_id"]}, {"$set": room_doc})

    # 4. Seed Indian Guests
    print("\n=== SEEDING INDIAN GUEST PROFILES ===")
    for g in INDIAN_GUESTS:
        existing_g = await db.guests.find_one({"email": g["email"]})
        g_doc = {
            **g,
            "date_of_birth": "1985-08-15",
            "gender": "Male" if "Arjun" in g["first_name"] or "Rohan" in g["first_name"] or "Kabir" in g["first_name"] else "Female",
            "country": "India",
            "identity_type": "PASSPORT" if "Arjun" in g["first_name"] else "AADHAAR",
            "identity_number": "A12345678" if "Arjun" in g["first_name"] else "9876-5432-1098",
            "updated_at": now,
        }
        if not existing_g:
            g_doc["created_at"] = now
            await db.guests.insert_one(g_doc)
            print(f" [+] Added Guest: {g['first_name']} {g['last_name']} ({g['city']})")

    # 5. Seed Active Sample Reservations across Indian Hotels
    print("\n=== SEEDING SAMPLE RESERVATIONS & OCCUPANCY ===")
    all_props = await db.properties.find({"status": "ACTIVE"}).to_list(length=30)
    all_guests = await db.guests.find({}).to_list(length=20)

    res_count = 0
    for idx, prop in enumerate(all_props[:10]):
        prop_id = str(prop["_id"])
        room_types = await db.room_types.find({"property_id": {"$in": [prop_id, str(prop_id)]}}).to_list(length=5)
        if not room_types:
            continue
        
        rt = room_types[0]
        rt_id = str(rt["_id"])
        
        rooms = await db.rooms.find({"property_id": {"$in": [prop_id, str(prop_id)]}, "room_type_id": {"$in": [rt_id, str(rt_id)]}}).to_list(length=5)
        if not rooms:
            continue
            
        guest = all_guests[idx % len(all_guests)]
        guest_id = str(guest["_id"])
        room = rooms[0]
        room_id = str(room["_id"])

        ref = f"NGX-IND-{today.strftime('%Y%m%d')}-{100 + idx}"
        existing_res = await db.reservations.find_one({"booking_reference": ref})
        
        cin_d = today + timedelta(days=idx % 4)
        cout_d = cin_d + timedelta(days=2 + (idx % 3))
        nights = (cout_d - cin_d).days
        rate = float(rt.get("base_price", 15000.0))
        subtotal = round(rate * nights, 2)
        taxes = round(subtotal * 0.12, 2)
        total = round(subtotal + taxes, 2)

        res_doc = {
            "booking_reference": ref,
            "property_id": prop_id,
            "guest_id": guest_id,
            "room_id": room_id,
            "room_type_id": rt_id,
            "check_in_date": cin_d.isoformat(),
            "check_out_date": cout_d.isoformat(),
            "number_of_adults": 2,
            "number_of_children": 0,
            "number_of_rooms": 1,
            "rate_per_night": rate,
            "number_of_nights": nights,
            "subtotal": subtotal,
            "taxes": taxes,
            "discounts": 0.0,
            "total_amount": total,
            "special_requests": "Airport transfer requested; fresh fruits in suite on arrival.",
            "source": "DIRECT",
            "status": "CONFIRMED" if idx % 2 == 0 else "CHECKED_IN",
            "created_at": now,
            "updated_at": now,
            "created_by": admin_id,
        }

        if not existing_res:
            await db.reservations.insert_one(res_doc)
            res_count += 1

    print(f"\nSuccessfully seeded/verified {len(HOTELS_DATA)} Indian luxury hotels!")
    print(f"Total new properties: {total_properties_seeded}, room types: {total_room_types_seeded}, rooms: {total_rooms_seeded}")
    print(f"Total sample bookings seeded: {res_count}")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_20_hotels())

