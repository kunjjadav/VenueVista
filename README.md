# 🏙️ VenueVista — Restaurant Location Intelligence Platform

> Market analysis platform for restaurant location research. Evaluate market saturation, discover optimal locations using spatial clustering, and visualize competition with interactive heatmaps.

---

## ⚡ Quick Start

### Prerequisites
- Docker & Docker Compose
- Google Places API Key (Places API + Geocoding API enabled)

### 1. Clone & Configure

```bash
cd VenueVista
cp .env.example .env
# Edit .env with your API keys and credentials
```

### 2. Launch the Stack

```bash
docker compose up --build
```

This starts 5 services:
| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | [localhost:5173](http://localhost:5173) | React SPA (Vite dev server) |
| **Backend** | [localhost:8000](http://localhost:8000/api/) | Django REST API |
| **Admin** | [localhost:8000/admin/](http://localhost:8000/admin/) | Django Admin |
| **PostgreSQL** | 5432 | PostGIS database |
| **Redis** | 6379 | Celery broker |

### 3. Create a Superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

### 4. Import Your CSV Data

```bash
# Place your CSV in the data/ directory, then:
docker compose exec backend python manage.py import_csv --file /app/data/restaurants_with_inferred_cuisine.csv
```

---

## 🏗️ Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   React SPA  │────│  Django DRF  │────│  PostgreSQL  │
│  + Leaflet   │    │  + Celery    │    │  + PostGIS   │
│  + Redux     │    │  + Grid Bin  │    │              │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                    ┌──────┴───────┐
                    │    Redis     │
                    │  (Broker)    │
                    └──────────────┘
```

## 🔑 Key Features

- **Cache Layer**: Database-first geocoding — avoids redundant API calls
- **Grid Clustering**: Deterministic spatial binning with configurable cell size
- **Heatmap Rendering**: Leaflet with leaflet.heat for density visualization
- **Viability Scoring**: 0-100 score weighting foot traffic against competition density
- **JWT Auth**: Token-based auth with auto-refresh
- **CSV Import**: Load existing restaurant data directly

---

## 📁 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Get JWT tokens |
| POST | `/api/auth/token/refresh/` | Refresh token |
| GET | `/api/auth/profile/` | User profile |
| GET | `/api/restaurants/` | List restaurants (filterable) |
| POST | `/api/restaurants/search/` | Smart search |
| POST | `/api/clusters/analyze/` | Run spatial clustering |
| GET | `/api/clusters/{id}/` | Cluster detail |
| GET/POST | `/api/bookmarks/` | User bookmarks |
| GET | `/api/bookmarks/history/` | Search history |

---

## 🛠️ Tech Stack

**Backend**: Django 5.1 · DRF 3.15 · PostGIS 3.4 · Celery 5.4 · Redis 7 · Scikit-learn  
**Frontend**: React 19 · Vite 8 · Redux Toolkit · Leaflet · leaflet.heat · Framer Motion  
**Infra**: Docker Compose · PostgreSQL 16 · Gunicorn

---

## 📜 License

MIT © 2026
