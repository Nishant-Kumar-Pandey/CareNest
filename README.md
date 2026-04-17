# Elderly Nursing & Healthcare Assistance Platform

A full-stack healthcare platform connecting elderly patients with professional caregivers.

## 🏗 Architecture: 3-Tier REST

```
Frontend (Next.js 14)     →   Backend (Express + Node.js)   →   MongoDB + Redis
     localhost:3000               localhost:5000               Mongoose + ioredis
```

## 🎨 Design System
- **Colors:** Terracotta `#C4694E` + Sage Green `#4D8452` on Warm Cream `#FDF8F3`
- **Fonts:** Lora (serif headings) + Inter (body)
- **Style:** Trustworthy, warm, accessible for elderly families

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm run install:all
# or manually:
cd server && npm install
cd client && npm install
```

### 2. Configure environment
Edit `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/elderly-care
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### 3. Seed the database (optional)
```bash
npm run seed
```
Demo credentials after seeding:
| Role      | Email                | Password     |
|-----------|----------------------|--------------|
| Patient   | eleanor@demo.com     | Password123! |
| Caregiver | sarah@care.com       | Password123! |
| Admin     | admin@care.com       | Admin123!    |

### 4. Start both servers
```bash
npm start
# OR separately:
npm run dev:server   # → http://localhost:5000
npm run dev:client   # → http://localhost:3000
```

> **Note:** The frontend works fully with mock data even without MongoDB/Redis running.

---

## 📄 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, services, caregivers, testimonials |
| `/caregivers` | Browse & filter all caregivers |
| `/book` | 3-step booking wizard |
| `/dashboard` | Patient dashboard — bookings, care notes, reviews |
| `/auth` | Login / Register |

---

## 🗃 Data Model (7 Entities)

```
User ──── Caregiver (1:1)
     └─── Patient   (1:1)

Booking ──── Patient
        ├─── Caregiver  
        ├─── Service
        ├─── CareNote[] (1:many)
        └─── Review     (1:1)
```

## 🔌 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/caregivers          (filterable, cached in Redis)
GET    /api/caregivers/:id
PUT    /api/caregivers/:id

GET    /api/services
GET    /api/services/:slug

GET    /api/bookings            (role-aware)
POST   /api/bookings
PATCH  /api/bookings/:id/status

GET    /api/bookings/:id/notes
POST   /api/bookings/:id/notes  (caregiver only)

POST   /api/bookings/:id/review (patient only)
GET    /api/reviews/caregiver/:id
```
