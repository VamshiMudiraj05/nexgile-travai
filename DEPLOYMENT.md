# NEXGILE-TRAVAI — Production Deployment Guide

This guide details step-by-step instructions to deploy the **Nexgile-TravAI** platform to production environments.

---

## 1. System Architecture Overview

```
                          ┌────────────────────────┐
                          │   Client Web Browser   │
                          └───────────┬────────────┘
                                      │
                         HTTPS (Port 443 / Port 80)
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │                                                   │
            ▼                                                   ▼
┌────────────────────────┐                         ┌────────────────────────┐
│  Frontend (Vite/React) │                         │  Backend API (FastAPI) │
│  - Static Nginx / CDN  │  ───── API Calls ─────> │  - Uvicorn / Gunicorn  │
│  - Port: 80 / 5173     │    (JSON over HTTP/S)   │  - Port: 8000          │
└────────────────────────┘                         └───────────┬────────────┘
                                                               │
                                                   MongoDB Driver (Port 27017)
                                                               │
                                                               ▼
                                                   ┌────────────────────────┐
                                                   │ MongoDB / Atlas Server │
                                                   └────────────────────────┘
```

---

## 2. Environment Variables Checklist

### Backend Environment Variables (`backend/.env` or Cloud Secrets)
| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DATABASE` | Target database name | `nexgile_travai` |
| `JWT_SECRET` | Cryptographic secret for signing JWTs | A 64-character random string (e.g. `openssl rand -hex 32`) |
| `JWT_ALGORITHM` | JWT hashing algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token validity duration | `60` |
| `CORS_ORIGINS` | Comma-separated allowed frontend domains | `https://your-frontend-domain.com,https://nexgile-travai.vercel.app` |
| `PAYPAL_CLIENT_ID` | PayPal sandbox/live client ID | `<client_id>` |
| `PAYPAL_CLIENT_SECRET` | PayPal secret key | `<client_secret>` |
| `PAYPAL_MODE` | PayPal operational mode | `sandbox` or `live` |

### Frontend Environment Variables (`frontend/.env` or Vercel/Netlify Environment)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Full URL to the backend `/api/v1` endpoint | `https://api.your-domain.com/api/v1` |

---

## 3. Option A: Full-Stack Docker Compose (Recommended for VPS / AWS EC2)

The repository includes a ready-to-run [`docker-compose.yml`](./docker-compose.yml) orchestrating MongoDB, the FastAPI backend, and Nginx-powered frontend.

### Step 1: Clone the Repository
```bash
git clone https://github.com/VamshiMudiraj05/nexgile-travai.git
cd nexgile-travai
```

### Step 2: Configure Environment
Create your production `.env` files:
```bash
# In backend/
cp backend/.env.example backend/.env
# Update MONGODB_URI, JWT_SECRET, and CORS_ORIGINS in backend/.env

# In frontend/
cp frontend/.env.example frontend/.env
# Set VITE_API_BASE_URL=https://api.your-domain.com/api/v1 (or http://your-ip:8000/api/v1)
```

### Step 3: Build & Launch Containers
```bash
docker compose up -d --build
```

### Step 4: Verify Service Health
```bash
# Check running containers
docker compose ps

# Check backend health
curl http://localhost:8000/api/v1/health

# Check frontend
curl -I http://localhost:5173
```

---

## 4. Option B: Cloud PaaS (Frontend on Vercel + Backend on Render / Railway)

### 4.1 Backend on Render or Railway
1. **Repository Link**: Connect `https://github.com/VamshiMudiraj05/nexgile-travai` in your Render/Railway dashboard.
2. **Root Directory**: `backend`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables**: Add `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`, `PAYPAL_*`.
6. Once deployed, note your public backend URL: `https://nexgile-travai-backend.onrender.com`.

### 4.2 Frontend on Vercel
1. In Vercel, click **Add New Project** and select `nexgile-travai`.
2. **Root Directory**: Select `frontend`.
3. **Framework Preset**: Vite.
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://nexgile-travai-backend.onrender.com/api/v1`
7. Click **Deploy**. Vercel will automatically read [`frontend/vercel.json`](./frontend/vercel.json) to handle client-side routing.

---

## 5. Option C: Managed MongoDB Atlas Setup

1. Create a free M0 or production M10+ cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** &rarr; **Add IP Address** &rarr; Add your server IP or `0.0.0.0/0` (allow from anywhere with password auth).
3. Go to **Database Access** &rarr; Create an application user with Read/Write privileges to database `nexgile_travai`.
4. Copy the SRV connection URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/nexgile_travai?retryWrites=true&w=majority
   ```
5. Supply this connection string as `MONGODB_URI` in your backend configuration.

---

## 6. Seed Data & Initialization (Optional)

To seed initial properties, room types, rooms, and sample reservations:

```bash
# Inside the backend environment
cd backend
python scripts/seed.py
```

---

## 7. Production Verification Checklist

- [ ] Backend endpoint responds with HTTP 200: `curl -I https://api.your-domain.com/api/v1/health`
- [ ] Frontend loads with custom fonts (`Cormorant Garamond`, `Cinzel`, `Plus Jakarta Sans`)
- [ ] Direct refresh on subpages (e.g. `/marketplace`, `/dashboard`, `/my-trips`) does not yield a 404 (handled via `vercel.json` / `nginx.conf`)
- [ ] CORS is restricted to your production frontend domain in `backend/.env`
- [ ] JWT Secret has been replaced with a secure key
