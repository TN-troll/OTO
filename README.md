# Exclusive Car Ads Aggregator

A curated platform for luxury, exotic, and high-performance car advertisements from Dutch marketplaces (AutoTrack, AutoScout24, Marktplaats).

## Features

- 🚗 Aggregates luxury car ads from multiple Dutch marketplaces
- 🔊 Unique engine sound filtering (exhaust note, engine config, cylinders)
- 🔍 Smart search with abbreviation expansion (merc → Mercedes-Benz)
- 📊 Advanced filters: HP, displacement, price, year, transmission, fuel
- 🌐 Bilingual interface (Dutch / English)
- ⚡ Fast filtering with Redis caching
- 🔄 Auto-verification of listing freshness every 60 minutes

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Redis, BullMQ
- **Frontend**: React, Vite, TanStack Query, Tailwind CSS
- **Scraping**: Playwright (JS-rendered), Cheerio (static HTML)
- **Testing**: Vitest, fast-check (property-based testing)

## Project Structure

```
packages/
├── backend/          # Express API + scrapers + curation engine
├── frontend/         # React SPA with Vite
└── shared/           # TypeScript types, enums, constants
```

## Local Development

```bash
# Install dependencies
npm install

# Start backend (mock mode - no DB needed)
cd backend && npx tsx src/index.ts

# Start frontend
cd frontend && npx vite
```

Frontend: http://localhost:3000  
Backend API: http://localhost:4000

## Environment Variables (Production)

```env
DATABASE_URL=postgresql://user:pass@host:5432/car_ads
REDIS_URL=redis://host:6379
PORT=4000
NODE_ENV=production
```

## Running Tests

```bash
# Backend (372 tests)
cd backend && npm test

# Frontend (33 tests)
cd frontend && npm test
```

## Deployment

See deployment guide below for Railway (backend) + Vercel (frontend).
