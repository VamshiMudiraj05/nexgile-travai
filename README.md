# Nexgile-TravAI — Travel & Hospitality Management Platform
## Phase 1 (Foundation) & Phase 2 (Property Management System - PMS)

Nexgile-TravAI is a next-generation, production-ready enterprise Travel & Hospitality Management Platform. This repository contains the full implementation of **Phase 1 (Foundation)** and **Phase 2 (Cloud Property Management System - PMS)**, establishing a clean, decoupled architecture between the React Single Page Application (SPA) and the Python FastAPI REST API layer backed by MongoDB.

---

## 1. Project Overview

Nexgile-TravAI provides an end-to-end hotel operations and property management system:
- **Decoupled Client/Server Model**: React SPA communicates strictly via REST API over HTTP/JSON with JWT authentication.
- **Asynchronous Python Backend**: FastAPI with Pydantic validation, structured logging, centralized error handling, and CORS configuration.
- **MongoDB Async Layer**: High-throughput database connectivity using Motor with compound and unique indexes.
- **JWT & Role-Based Authorization (RBAC)**: Stateless cryptographic bearer tokens with password hashing via bcrypt and dependency-injected route security for 7 enterprise roles.
- **Cloud Property Management System (PMS)**:
  - **Properties**: Multi-property management with amenities, address, contact, check-in/out policies, and Cloudinary image gallery integration.
  - **Room Types**: Room categories, base rates, extra adult/child surcharges, max occupancy, and real-time room count synchronization.
  - **Rooms & Room State Machine**: Room inventory with strict lifecycle status transitions (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING`, `MAINTENANCE`, `OUT_OF_ORDER`) and immutable audit trail logging in `room_status_history`.
  - **Guest Directory**: Comprehensive guest CRM profiles, contact information, identity documents, VIP flags, and stay history.
  - **Reservations & Booking Engine**: Double-booking prevention, date overlap validation, human-readable reservation references (`NGX-YYYYMMDD-XXXXX`), automated pricing computation, and interactive timeline calendar.
  - **Front Desk Check-in / Check-out**: Streamlined check-in (`CONFIRMED` -> `CHECKED_IN`, Room -> `OCCUPIED`) and check-out (`CHECKED_IN` -> `CHECKED_OUT`, Room -> `CLEANING`).
  - **Real-Time PMS Analytics Dashboard**: Live KPI metrics (total rooms, occupancy rate, available, occupied, cleaning, maintenance, active reservations, today's arrivals & departures).

---

## 2. Architecture

```
+-------------------------------------------------------------------+
|                        React Client (SPA)                         |
|  - React 19 + JavaScript (JSX) + Vite + Tailwind CSS v4           |
|  - PMS Pages: Dashboard, Properties, Room Types, Rooms, Guests,   |
|               Reservations, Reservation Calendar, Check-In/Out    |
|  - AuthContext (JWT State & LocalStorage)                         |
+---------------------------------+---------------------------------+
                                  |
                   HTTP / REST (Axios Interceptors)
                    Authorization: Bearer <JWT>
                                  |
                                  v
+-------------------------------------------------------------------+
|                     FastAPI Backend (/api/v1)                     |
|  - API Routing:                                                   |
|    /auth, /health, /properties, /room-types, /rooms,              |
|    /guests, /reservations, /dashboard                             |
|  - Security: JWT HS256, Bcrypt Hashing, RBAC Dependencies         |
|  - Services Layer: Property, RoomType, Room, Guest, Reservation,  |
|                    Dashboard, Cloudinary Media Integration        |
|  - Database Manager: Motor (Async PyMongo Client)                 |
+---------------------------------+---------------------------------+
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        v                                                   v
+-----------------------------------+   +---------------------------+
|         MongoDB Database          |   |      Cloudinary Cloud     |
|  - users, properties, room_types  |   |  - Property & Room Images |
|  - rooms, room_status_history     |   |  - Secure Upload API      |
|  - guests, reservations           |   +---------------------------+
+-----------------------------------+
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 (Pure JavaScript only — `.jsx`/`.js`)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **HTTP Client**: Axios with request & response interceptors
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Validation**: Pydantic v2 & Pydantic Settings
- **ASGI Server**: Uvicorn
- **Password Hashing**: Bcrypt
- **Token Security**: PyJWT (HS256)
- **Media Storage**: Cloudinary Python SDK with backend MIME & 10MB size validation

### Database
- **Engine**: MongoDB (Local or MongoDB Atlas)
- **Driver**: Motor (Official Async Python MongoDB Driver)

---

## 4. Project Structure

```
nexgile-travai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmationModal.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ImageUploader.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── layouts/
│   │   │   └── AdminLayout.jsx
│   │   ├── pages/
│   │   │   ├── guests/
│   │   │   │   ├── GuestDetail.jsx
│   │   │   │   ├── GuestForm.jsx
│   │   │   │   └── GuestList.jsx
│   │   │   ├── properties/
│   │   │   │   ├── PropertyDetail.jsx
│   │   │   │   ├── PropertyForm.jsx
│   │   │   │   └── PropertyList.jsx
│   │   │   ├── reservations/
│   │   │   │   ├── ReservationCalendar.jsx
│   │   │   │   ├── ReservationDetail.jsx
│   │   │   │   ├── ReservationForm.jsx
│   │   │   │   └── ReservationList.jsx
│   │   │   ├── room-types/
│   │   │   │   ├── RoomTypeList.jsx
│   │   │   │   └── RoomTypeModal.jsx
│   │   │   ├── rooms/
│   │   │   │   ├── RoomList.jsx
│   │   │   │   ├── RoomModal.jsx
│   │   │   │   └── RoomStatusModal.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── PlaceholderModule.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── dashboardService.js
│   │   │   ├── guestService.js
│   │   │   ├── propertyService.js
│   │   │   ├── reservationService.js
│   │   │   ├── roomService.js
│   │   │   └── roomTypeService.js
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── guests.py
│   │   │   ├── health.py
│   │   │   ├── properties.py
│   │   │   ├── reservations.py
│   │   │   ├── room_types.py
│   │   │   └── rooms.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── logging.py
│   │   │   └── security.py
│   │   ├── database/
│   │   │   └── mongodb.py
│   │   ├── models/
│   │   │   ├── dashboard.py
│   │   │   ├── guest.py
│   │   │   ├── property.py
│   │   │   ├── reservation.py
│   │   │   ├── room.py
│   │   │   ├── room_type.py
│   │   │   └── user.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── guest.py
│   │   │   ├── property.py
│   │   │   ├── reservation.py
│   │   │   ├── room.py
│   │   │   ├── room_type.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── cloudinary_service.py
│   │   │   ├── dashboard_service.py
│   │   │   ├── guest_service.py
│   │   │   ├── property_service.py
│   │   │   ├── reservation_service.py
│   │   │   ├── room_service.py
│   │   │   └── room_type_service.py
│   │   └── main.py
│   ├── scripts/
│   │   └── seed.py
│   ├── tests/
│   │   ├── test_api.py
│   │   └── test_pms.py
│   ├── requirements.txt
│   └── .env
│
├── .gitignore
└── README.md
```

---

## 5. Environment Configuration

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Nexgile
MONGODB_DATABASE=nexgile_travai
JWT_SECRET=nexgile_travai_jwt_secret_key_change_in_production_2026
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Cloudinary Media Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 6. Running the Application & Seeding Demo Data

### 1. Backend Setup & Startup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed the database with demo resort, rooms, guests & reservations
python scripts/seed.py

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The backend server will run at `http://localhost:8000`.
- Interactive Swagger UI: `http://localhost:8000/api/docs`
- ReDoc API Documentation: `http://localhost:8000/api/redoc`

### 2. Frontend Setup & Startup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 3. Running Automated Tests

```bash
cd backend
source .venv/bin/activate
pytest -v
```

---

## 7. PMS Room Status State Machine & Rules

Room statuses strictly adhere to the following transition rules:
- `AVAILABLE` ➔ `RESERVED`, `OCCUPIED`, `MAINTENANCE`, `OUT_OF_ORDER`
- `RESERVED` ➔ `OCCUPIED` (Check-In), `AVAILABLE` (Cancellation)
- `OCCUPIED` ➔ `CLEANING` (Check-Out), `MAINTENANCE`
- `CLEANING` ➔ `AVAILABLE` (Housekeeping Cleaned), `MAINTENANCE`, `OUT_OF_ORDER`
- `MAINTENANCE` ➔ `CLEANING`, `AVAILABLE`, `OUT_OF_ORDER`
- `OUT_OF_ORDER` ➔ `MAINTENANCE`, `CLEANING`, `AVAILABLE`

Every state change automatically appends an entry to the `room_status_history` collection recording:
- `room_id`, `property_id`, `previous_status`, `new_status`, `changed_by`, `reason`, `notes`, `created_at`.

---

## 8. API Endpoints Specification

### Authentication
- `POST /api/v1/auth/register` — Register a new user
- `POST /api/v1/auth/login` — Authenticate and receive JWT bearer token
- `GET /api/v1/auth/me` — Retrieve current authenticated profile

### Properties
- `GET /api/v1/properties` — List properties with pagination & search
- `POST /api/v1/properties` — Create property
- `GET /api/v1/properties/{id}` — Get property details
- `PUT /api/v1/properties/{id}` — Update property
- `DELETE /api/v1/properties/{id}` — Delete property
- `POST /api/v1/properties/{id}/images` — Upload property images to Cloudinary
- `DELETE /api/v1/properties/{id}/images/{public_id}` — Remove image

### Room Types
- `GET /api/v1/room-types` — List room types (filter by property)
- `POST /api/v1/room-types` — Create room type
- `GET /api/v1/room-types/{id}` — Get room type details
- `PUT /api/v1/room-types/{id}` — Update room type
- `DELETE /api/v1/room-types/{id}` — Delete room type (prevented if rooms exist)

### Rooms
- `GET /api/v1/rooms` — List rooms (filter by property, room type, status, floor)
- `POST /api/v1/rooms` — Create room
- `GET /api/v1/rooms/{id}` — Get room details
- `PUT /api/v1/rooms/{id}` — Update room details
- `PATCH /api/v1/rooms/{id}/status` — Transition room status with audit logging
- `GET /api/v1/rooms/{id}/history` — Get room status history audit trail
- `DELETE /api/v1/rooms/{id}` — Delete room

### Guests
- `GET /api/v1/guests` — List guests with search (name, email, phone, ID) & pagination
- `POST /api/v1/guests` — Create guest profile
- `GET /api/v1/guests/{id}` — Get guest profile & stay history
- `PUT /api/v1/guests/{id}` — Update guest details
- `DELETE /api/v1/guests/{id}` — Delete guest profile

### Reservations
- `GET /api/v1/reservations` — List reservations with filters & pagination
- `POST /api/v1/reservations` — Create reservation (validates room availability & dates)
- `GET /api/v1/reservations/{id}` — Get reservation details
- `PUT /api/v1/reservations/{id}` — Update reservation
- `PATCH /api/v1/reservations/{id}/check-in` — Check-in guest (Room becomes `OCCUPIED`)
- `PATCH /api/v1/reservations/{id}/check-out` — Check-out guest (Room becomes `CLEANING`)
- `PATCH /api/v1/reservations/{id}/cancel` — Cancel reservation (Room released)
- `GET /api/v1/reservations/calendar/view` — Timeline calendar matrix view

### PMS Dashboard
- `GET /api/v1/dashboard/stats` — Real-time MongoDB aggregated PMS KPI stats
