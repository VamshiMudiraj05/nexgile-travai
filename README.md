# Nexgile-TravAI — Autonomous Enterprise Travel & Hospitality Platform

> **Production-Grade Hospitality & Multimodal Travel Management System**  
> Complete implementation spanning **Phase 1 (Foundation & Security)**, **Phase 2 (Cloud PMS)**, **Phase 3 (Real-Time Event Bus & AI Concierge)**, **Phase 4 (Revenue & Channel Intelligence, Document Generator)**, and **Phase 5 (Live Telemetry, Dual Payments, Multi-Currency & PWA)** with dark luxury styling and Indian localization.

---

## 1. Executive Summary & Architecture

Nexgile-TravAI is a decoupled, cloud-native enterprise platform tailored for luxury hotel estates, boutique resorts, and multimodal travel management. Built on a pure JavaScript **React 19 SPA** frontend paired with a high-concurrency **FastAPI (Python 3.9+)** backend backed by asynchronous **MongoDB (Motor)**, the platform delivers zero-latency operations across 7 specialized enterprise roles.

```
+--------------------------------------------------------------------------------------------------+
|                                    React 19 Client (SPA & PWA)                                   |
|  - Dark Luxury UI (#0B0C1E, #13152C, #DFB76C Gold, Cinzel & Cormorant Typography)               |
|  - Progressive Web App: Service Worker Precaching, Offline Vault & Homescreen Install            |
|  - Real-Time WebSocket Event Bus & Server-Sent Events (SSE) AI Concierge Streaming              |
|  - Multi-Currency Conversion Engine (INR, USD, EUR, GBP, AED, SGD, JPY)                          |
|  - Dual Payment Gateways: Seamless Razorpay & PayPal Checkout Integration                        |
|  - Client-Side Luxury PDF Engine: Official Tax Invoices & Digital Boarding Passes                |
|  - Portals: Admin, Front Desk, Revenue Manager, Finance, Housekeeping, Maintenance, Traveler     |
+-------------------------------------------------+------------------------------------------------+
                                                  |
                                   HTTP/REST (Axios Interceptors)
                                     Authorization: Bearer <JWT>
                                  WebSocket (/ws/hotel/{property_id})
                                                  |
                                                  v
+--------------------------------------------------------------------------------------------------+
|                                      FastAPI Backend (/api/v1)                                   |
|  - Stateless HS256 JWT Authentication, Bcrypt Password Hashing, Dependency-Injected RBAC         |
|  - Core PMS: Properties, Room Types, Rooms, State Machine, Guests CRM, Double-Booking Prevention |
|  - Revenue Engine: ADR, RevPAR, Dynamic Pricing, Rate Plans, Statistical Forecasting (7/30 Days) |
|  - Multimodal Marketplace: Hotel Stays, Airline Flights, Cab Fleets, Tours & VIP Experiences   |
|  - AI Agent: LLM Streaming Concierge with Prompt Injection Defense & Operational Copilot        |
|  - Telemetry: Live Open-Meteo Weather Data & Aviationstack Real-Time Flight Inventory            |
+-------------------------------------------------+------------------------------------------------+
                                                  |
              +-----------------------------------+-----------------------------------+
              |                                   |                                   |
              v                                   v                                   v
+---------------------------+       +---------------------------+       +---------------------------+
|      MongoDB Database     |       |      Cloudinary Cloud     |       |   External API Services   |
| - users, properties, rooms|       | - Property & Suite Media  |       | - Razorpay & PayPal Gateways
| - reservations, folios    |       | - Guest Identification    |       | - Open-Meteo Weather API  |
| - rate_plans, loyalty     |       | - Fast CDN Delivery       |       | - Aviationstack Flights   |
| - room_status_history     |       +---------------------------+       +---------------------------+
+---------------------------+
```

---

## 2. Core Modules & Implementation Highlights

### 🛡️ Phase 1 — Foundation, Security & Multi-Role RBAC
- **Stateless JWT Security**: HS256 token signing with cryptographic bcrypt password hashing and token expiration guards.
- **7 Enterprise Roles**:
  1. `ADMIN` — Full platform governance, tenant configuration, and master system settings.
  2. `FRONT_DESK` — Room arrival/departure dispatch, folio settlement, guest verification, and key assignment.
  3. `REVENUE_MANAGER` — Dynamic pricing models, yield recommendations, rate plan restrictions, and channel distribution.
  4. `FINANCE` — Folio audits, corporate credit limits, bill-to-company transactions, and revenue forecasting.
  5. `HOUSEKEEPING` — Live cleaning board, room inspection checklists, and sanitation state transitions.
  6. `MAINTENANCE` — Work order dispatch, out-of-order room logging, and preventive equipment maintenance.
  7. `TRAVELER` — VIP booking flow, multimodal itinerary, loyalty vault, and real-time AI concierge.
- **Role Routing Guards & Stale Token Prevention**: Automatic cross-role redirection prevents cached role mismatch when switching between staff and traveler personas.

### 🏨 Phase 2 — Cloud Property Management System (PMS)
- **Property & Room Type Inventory**: Multi-property management supporting villas, suites, and premium apartments with amenities, location geocoding, check-in policies, and Cloudinary image galleries.
- **Strict Room State Machine**:
  - `AVAILABLE` ➔ `RESERVED`, `OCCUPIED`, `MAINTENANCE`, `OUT_OF_ORDER`
  - `RESERVED` ➔ `OCCUPIED` (Check-In), `AVAILABLE` (Cancellation)
  - `OCCUPIED` ➔ `CLEANING` (Check-Out), `MAINTENANCE`
  - `CLEANING` ➔ `AVAILABLE` (Housekeeping Cleaned), `MAINTENANCE`, `OUT_OF_ORDER`
  - `MAINTENANCE` ➔ `CLEANING`, `AVAILABLE`, `OUT_OF_ORDER`
  - `OUT_OF_ORDER` ➔ `MAINTENANCE`, `CLEANING`, `AVAILABLE`
- **Immutable Status Audit Trail**: Every status transition logs `room_id`, `property_id`, `previous_status`, `new_status`, `changed_by`, `reason`, and timestamps to `room_status_history`.
- **Guest CRM & VIP Flags**: Comprehensive guest directory tracking identities, contact cards, preferences, and historical folios.
- **Double-Booking Engine**: Date-overlap collision prevention with atomic booking creation and human-readable references (`NGX-YYYYMMDD-XXXXX`).
- **Interactive Calendar Matrix**: Timeline matrix view visualizing real-time room occupancy and guest stays.

### ⚡ Phase 3 — Real-Time WebSocket Event Bus & AI Concierge
- **Hotel WebSocket Event Bus (`/ws/hotel/{property_id}`)**:
  - Broadcasts live status transitions (`ROOM_STATUS_UPDATED`, `NEW_RESERVATION`, `CHECK_IN`, `CHECK_OUT`) instantly updating front desk and housekeeping dashboards without page refresh.
- **Server-Sent Events (SSE) AI Concierge (`/api/v1/ai/concierge/stream`)**:
  - Token-by-token streaming hospitality assistant for guests with markdown rendering, quick suggestion chips, and automated stay assistance.
  - Multi-tier system prompt injection defense protecting system secrets and operational limits.
- **Role-Adaptive AI Copilot ("Ask Nexgile")**:
  - Contextual floating assistant providing role-specific operational answers across Admin, Front Desk, Revenue, Finance, Housekeeping, and Traveler portals.
- **Omnichannel Dispatch Hub**:
  - Centralized messaging interface managing SMS, WhatsApp, and email guest communications with read receipts.

### 📈 Phase 4 — Revenue Intelligence, Channels & Document Generator
- **Revenue Analytics**: Real-time ADR (Average Daily Rate), RevPAR (Revenue Per Available Room), Occupancy percentage, and revenue breakdowns by property and accommodation type.
- **Rate Recommendations Engine**: Statistical and ML-driven yield recommendations with balanced `Apply Rate` and `Dismiss` controls.
- **Rate Plans & Restrictions**: Minimum Length of Stay (MLOS), non-refundable discounts, corporate partner packages, and cancellation penalties.
- **Multi-Channel Distribution**: Balanced tracking across Direct Website, Nexgile Marketplace, Corporate Travel, and Global OTAs/GDS.
- **Statistical Forecasting**: 7-Day and 30-Day predictive models projecting expected occupancy, volume velocity, and revenue.
- **Corporate Travel & Expense Management**: Corporate company accounts, credit limits, bill-to-company transactions, and employee travel claim workflows.
- **Client-Side Luxury PDF Engine (`pdfService.js`)**:
  - Generates downloadable, print-ready official GST Tax Invoices and Airline Boarding Passes with branded gold typography and QR codes.

### 🌐 Phase 5 — Live Telemetry, Multi-Currency, Dual Gateways & PWA
- **Live Aviation & Weather Telemetry**:
  - Live destination weather telemetry powered by Open-Meteo displaying temperature, conditions, and wind metrics.
  - Real-time flight search and inventory tracking integration with Aviationstack.
- **Global Multi-Currency Conversion Engine**:
  - Supports 7 international currencies (`INR`, `USD`, `EUR`, `GBP`, `AED`, `SGD`, `JPY`) with dynamic real-time conversion rates and unified formatting.
- **Dual Payment Gateways**:
  - **Razorpay**: Integrated popup checkout supporting UPI, Net Banking, and Indian credit/debit cards with automated signature verification.
  - **PayPal**: International card and PayPal wallet processing with sandbox/production fallback.
- **Multimodal Marketplace**:
  - Unified booking experience covering Hotel Stays, Airline Flights (Economy, Business, First), Cab/Taxi Fleets (Sedan, Luxury SUV, Premium EV), and Tours & VIP Experiences.
- **Progressive Web App (PWA) & Offline Vault**:
  - Service worker precaching (85 static assets), offline fallback vault, and mobile-friendly homescreen install manifest (`manifest.webmanifest`).
- **Production Performance Tuning**:
  - GZip compression, Rollup code splitting, vendor chunk segregation, and CDN caching headers reducing deployed initial bundle sizes.

---

## 3. Recent Enhancements & UI Refinements

1. **Reusable Luxury Dropdown Component**:
   - Replaced fragmented select elements across the Visitor Dashboard (Top Navigation Currency Selector, Airline Cabin Class, Taxi Category, Tours Dropdown) and Rate Recommendations with the custom animated dropdown component (`GooeyMenu.jsx` / custom luxury menu).
2. **Indian Localization & Realistic Pricing**:
   - Localized all static sample destinations and travel routes to realistic Indian hubs: Hyderabad (HYD), Mumbai (BOM), Delhi (DEL), Bengaluru (BLR), Chennai (MAA), Kolkata (CCU), Agra, and Jaipur.
   - Normalized accommodation nightly rates across all properties to realistic market ranges (Standard: ₹1,500–₹3,000, Deluxe: ₹2,500–₹5,000, Suites: ₹6,000–₹20,000, Luxury Villas: ₹10,000–₹50,000+), eliminating unrealistic legacy test prices.
3. **Responsive Donut Chart & Legend Optimization**:
   - Optimized `SvgDonutChart.jsx` and `BookingAnalytics.jsx` so circular donut charts and channel contribution legend pills adapt fluidly across mobile, tablet, and desktop viewports without overflowing card borders.
4. **Unified Staff BI Access**:
   - Extended role authorization on analytics endpoints (`/analytics/forecast`, `/analytics/revenue`, `/analytics/occupancy`) to `STAFF_ROLES`, ensuring Finance, Front Desk, and Management users access forecasts and reports without `403 Forbidden` errors.
5. **Hotel Card Alignment**:
   - Perfected Flexbox spacing between room prices and the "Book Stay" action button on hotel cards to eliminate overlapping at any screen width.

---

## 4. Technology Stack

### Frontend
- **Framework**: React 19 (Pure JavaScript `.jsx`/`.js`)
- **Build Tool**: Vite 8.2+
- **Styling**: Tailwind CSS v4 with custom luxury dark theme
- **Icons**: Lucide React
- **Animations**: Framer Motion & CSS Canvas Confetti
- **Document Generation**: jsPDF & html2canvas
- **PWA**: vite-plugin-pwa & Workbox

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Validation**: Pydantic v2 & Pydantic Settings
- **ASGI Server**: Uvicorn
- **Security**: PyJWT (HS256) & Passlib (Bcrypt)
- **HTTP Client**: HTTPX (Async)
- **Database Driver**: Motor (Async PyMongo Client)

### Database & Cloud Services
- **Database**: MongoDB 7.0+ (Local or Atlas)
- **Media**: Cloudinary SDK (Image upload, auto-format, CDN delivery)
- **Payment Gateways**: Razorpay SDK & PayPal REST APIs
- **Telemetry APIs**: Open-Meteo & Aviationstack

---

## 5. Repository Structure

```
nexgile-travai/
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmationModal.jsx
│   │   │   ├── CurrencySelector.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── FolioModal.jsx
│   │   │   ├── ImageUploader.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── StarRating.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── SvgAreaChart.jsx
│   │   │   ├── SvgBarChart.jsx
│   │   │   ├── SvgDonutChart.jsx
│   │   │   ├── WeatherPill.jsx
│   │   │   ├── calendar.jsx
│   │   │   ├── dynamic-island.jsx
│   │   │   ├── gooey-menu.jsx
│   │   │   ├── meteors.jsx
│   │   │   ├── rainbow-button.jsx
│   │   │   └── wallet-balance.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useHotelWebSocket.js
│   │   ├── layouts/
│   │   │   └── AdminLayout.jsx
│   │   ├── pages/
│   │   │   ├── analytics/
│   │   │   │   ├── BookingAnalytics.jsx
│   │   │   │   ├── ForecastAnalytics.jsx
│   │   │   │   ├── OccupancyAnalytics.jsx
│   │   │   │   └── RevenueAnalytics.jsx
│   │   │   ├── channels/
│   │   │   │   └── ChannelManager.jsx
│   │   │   ├── concierge/
│   │   │   │   └── OmnichannelDispatchHub.jsx
│   │   │   ├── corporate/
│   │   │   │   ├── CorporateAccounts.jsx
│   │   │   │   └── CorporateExpenseManager.jsx
│   │   │   ├── finance/
│   │   │   │   └── FinanceOverview.jsx
│   │   │   ├── frontdesk/
│   │   │   │   └── FrontDeskDashboard.jsx
│   │   │   ├── guests/
│   │   │   │   ├── GuestDetail.jsx
│   │   │   │   ├── GuestForm.jsx
│   │   │   │   └── GuestList.jsx
│   │   │   ├── housekeeping/
│   │   │   │   └── HousekeepingBoard.jsx
│   │   │   ├── maintenance/
│   │   │   │   └── MaintenanceBoard.jsx
│   │   │   ├── marketplace/
│   │   │   │   ├── BookingFlow.jsx
│   │   │   │   ├── Marketplace.jsx
│   │   │   │   ├── MultimodalMarketplace.jsx
│   │   │   │   └── PropertyDetail.jsx
│   │   │   ├── properties/
│   │   │   │   ├── PropertyDetail.jsx
│   │   │   │   ├── PropertyForm.jsx
│   │   │   │   └── PropertyList.jsx
│   │   │   ├── reservations/
│   │   │   │   ├── ReservationCalendar.jsx
│   │   │   │   ├── ReservationDetail.jsx
│   │   │   │   ├── ReservationForm.jsx
│   │   │   │   └── ReservationList.jsx
│   │   │   ├── revenue/
│   │   │   │   ├── RatePlanManager.jsx
│   │   │   │   └── RateRecommendations.jsx
│   │   │   ├── room-types/
│   │   │   │   ├── RoomTypeList.jsx
│   │   │   │   └── RoomTypeModal.jsx
│   │   │   ├── rooms/
│   │   │   │   ├── RoomList.jsx
│   │   │   │   ├── RoomModal.jsx
│   │   │   │   └── RoomStatusModal.jsx
│   │   │   ├── traveler/
│   │   │   │   ├── Concierge.jsx
│   │   │   │   ├── Loyalty.jsx
│   │   │   │   ├── MobileSuperAppHub.jsx
│   │   │   │   ├── MyTrips.jsx
│   │   │   │   ├── TravelerDashboard.jsx
│   │   │   │   ├── TravelerProfile.jsx
│   │   │   │   └── TripDetail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── services/
│   │   │   ├── analyticsService.js
│   │   │   ├── api.js
│   │   │   ├── channelService.js
│   │   │   ├── conciergeService.js
│   │   │   ├── corporateExpenseService.js
│   │   │   ├── corporateService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── folioService.js
│   │   │   ├── guestService.js
│   │   │   ├── loyaltyService.js
│   │   │   ├── marketplaceService.js
│   │   │   ├── multimodalService.js
│   │   │   ├── omnichannelService.js
│   │   │   ├── paymentService.js
│   │   │   ├── pdfService.js
│   │   │   ├── propertyService.js
│   │   │   ├── ratePlanService.js
│   │   │   ├── reservationService.js
│   │   │   ├── revenueService.js
│   │   │   ├── roomService.js
│   │   │   ├── roomTypeService.js
│   │   │   ├── superappService.js
│   │   │   ├── travelerService.js
│   │   │   └── weatherService.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── roleRouting.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analytics.py
│   │   │   ├── auth.py
│   │   │   ├── channels.py
│   │   │   ├── concierge.py
│   │   │   ├── corporate.py
│   │   │   ├── dashboard.py
│   │   │   ├── folios.py
│   │   │   ├── guests.py
│   │   │   ├── health.py
│   │   │   ├── loyalty.py
│   │   │   ├── marketplace.py
│   │   │   ├── multimodal.py
│   │   │   ├── omnichannel.py
│   │   │   ├── payments.py
│   │   │   ├── properties.py
│   │   │   ├── rate_plans.py
│   │   │   ├── reservations.py
│   │   │   ├── revenue.py
│   │   │   ├── room_types.py
│   │   │   ├── rooms.py
│   │   │   ├── service_requests.py
│   │   │   ├── superapp.py
│   │   │   ├── traveler.py
│   │   │   ├── weather.py
│   │   │   └── websockets.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── logging.py
│   │   │   └── security.py
│   │   ├── database/
│   │   │   └── mongodb.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── scripts/
│   │   ├── seed.py
│   │   ├── normalize_pricing.py
│   │   └── distribute_channels.py
│   ├── tests/
│   │   ├── test_api.py
│   │   ├── test_pms.py
│   │   └── test_phase4_phase5.py
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## 6. Environment Configuration

### Backend (`backend/.env`)
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Nexgile
MONGODB_DATABASE=nexgile_travai

# Authentication & Security
JWT_SECRET=nexgile_travai_jwt_secret_key_change_in_production_2026
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://yourdomain.com

# Media Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateways
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Live Flight Inventory (Aviationstack)
AVIATIONSTACK_API_KEY=your_aviationstack_api_key
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_BASE_URL=ws://localhost:8000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

---

## 7. Installation, Seeding & Execution

### 1. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# Create & activate Python virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt

# Seed the database with demo hotels, rooms, users, reservations & folios
python scripts/seed.py

# (Optional) Run Indian pricing normalizer and channel distributor
python scripts/normalize_pricing.py
python scripts/distribute_channels.py

# Launch the FastAPI application
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger)**: `http://localhost:8000/api/docs`
- **ReDoc Technical Specification**: `http://localhost:8000/api/redoc`

### 2. Frontend Setup & Run

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite local development server
npm run dev

# Or compile for production & preview PWA build
npm run build
npm run preview
```

- **Application URL**: `http://localhost:5173`

### 3. Automated Test Suite

```bash
cd backend
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pytest backend/tests/ -v
```
*(All 74 test cases validate auth, PMS operations, room state transitions, revenue calculations, and forecasting).*

---

## 8. Primary API Endpoint Reference

| Domain | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user account |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token |
| **Auth** | `GET` | `/api/v1/auth/me` | Fetch active user profile and role |
| **Properties** | `GET` | `/api/v1/properties` | List properties with filters and pagination |
| **Properties** | `POST` | `/api/v1/properties/{id}/images` | Upload property images to Cloudinary |
| **Rooms** | `GET` | `/api/v1/rooms` | Query rooms by property, status, and floor |
| **Rooms** | `PATCH` | `/api/v1/rooms/{id}/status` | Trigger room state transition with audit log |
| **Reservations** | `POST` | `/api/v1/reservations` | Create reservation with overlap protection |
| **Reservations** | `PATCH` | `/api/v1/reservations/{id}/check-in` | Execute guest check-in (Room ➔ OCCUPIED) |
| **Reservations** | `PATCH` | `/api/v1/reservations/{id}/check-out` | Execute guest check-out (Room ➔ CLEANING) |
| **Reservations** | `GET` | `/api/v1/reservations/calendar/view` | Matrix calendar occupancy view |
| **Analytics** | `GET` | `/api/v1/dashboard/overview` | High-level PMS KPI metrics & arrivals |
| **Analytics** | `GET` | `/api/v1/analytics/revenue` | ADR, RevPAR, and property revenue breakdown |
| **Analytics** | `GET` | `/api/v1/analytics/occupancy` | Real-time and historical occupancy trends |
| **Analytics** | `GET` | `/api/v1/analytics/bookings` | Multi-channel origin distribution |
| **Analytics** | `GET` | `/api/v1/analytics/forecast` | 7-day and 30-day statistical demand forecasts |
| **Revenue** | `GET` | `/api/v1/revenue/recommendations` | Yield recommendations with strategy controls |
| **Revenue** | `GET` | `/api/v1/revenue/rate-plans` | Rate plans, stay restrictions, and discounts |
| **AI Concierge** | `POST` | `/api/v1/ai/concierge/stream` | Server-Sent Events (SSE) AI assistant stream |
| **Omnichannel** | `POST` | `/api/v1/omnichannel/dispatch` | Send guest SMS/WhatsApp/Email notifications |
| **Marketplace** | `GET` | `/api/v1/multimodal/search` | Search multimodal flights, cabs, and hotels |
| **Payments** | `POST` | `/api/v1/payments/razorpay/create-order` | Generate Razorpay order for online payment |
| **Payments** | `POST` | `/api/v1/payments/razorpay/verify` | Verify cryptographic Razorpay signature |
| **Corporate** | `GET` | `/api/v1/corporate/accounts` | Manage corporate accounts & credit terms |
| **Weather** | `GET` | `/api/v1/weather/{city}` | Live destination weather telemetry |
| **WebSockets** | `WS` | `/ws/hotel/{property_id}` | Live hotel operational event broadcast |

---

## 9. License & Contribution

This repository is maintained for the **Nexgile-TravAI** platform. All proprietary rights reserved.
