# CarbonLens — Full Stack (Node.js + MongoDB + React)

CarbonLens is a personal carbon footprint tracker. Users upload a bill image (Electricity / Petrol / Diesel / LPG), the backend runs OCR, extracts consumption, calculates CO₂ emissions, and awards Green Coins + badges.

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally (or MongoDB Atlas connection string)

## 1) Backend setup

Path: `c:\Users\Paras kore\Desktop\full stack\carbonlens-backend`

1. Create an environment file:

   - Copy `carbonlens-backend/.env.example` → `carbonlens-backend/.env`
   - Update `MONGO_URI` and `JWT_SECRET`

2. Install and run:

```bash
cd "c:\Users\Paras kore\Desktop\full stack\carbonlens-backend"
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

## 2) Frontend setup

Path: `c:\Users\Paras kore\Desktop\full stack\carbonlens-frontend`

1. Create an environment file:

   - Copy `carbonlens-frontend/.env.example` → `carbonlens-frontend/.env`
   - If you keep the backend on port 5000, no change is required.

2. Install and run:

```bash
cd "c:\Users\Paras kore\Desktop\full stack\carbonlens-frontend"
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API Endpoints

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`

Bills:
- `POST /api/bills/upload` (multipart field name: `bill`)
- `GET /api/bills/history`
- `GET /api/bills/:id`

Dashboard:
- `GET /api/dashboard/summary`
- `GET /api/dashboard/trend`
- `GET /api/dashboard/breakdown`
- `GET /api/dashboard/leaderboard`

## Postman

Import `CarbonLens.postman_collection.json` from the project root.

