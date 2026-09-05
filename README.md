# Urban Furniture - Accounting System

A 24-hour hackathon foundation for a furniture-business accounting platform. This repository intentionally contains the scalable project structure, initial dashboard UI, authentication architecture, API boundaries, and Prisma data model. Detailed transaction and accounting behavior is reserved for the implementation phase.

## Stack

- Client: React, Vite, JavaScript, Tailwind CSS, React Router, Axios, Recharts, Lucide React
- Server: Node.js, Express, Prisma, PostgreSQL, JWT, bcrypt, Zod, CORS, dotenv
- Workspace: npm workspaces monorepo

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

Set `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `CLIENT_URL` in `.env`. On Windows PowerShell, copy the environment file with `Copy-Item .env.example .env`.

## Run

Start the API in one terminal:

```bash
npm run dev:server
```

Start the client in another:

```bash
npm run dev:client
```

The client runs at `http://localhost:5173`; the API runs at `http://localhost:5000`. The health endpoint is `GET /api/health`.

## Frontend routes

The React Router foundation includes `/login`, `/dashboard`, all master-data and transaction routes, and the four report routes. Non-dashboard pages intentionally render a reusable placeholder state until their module is implemented.

## Project structure

```text
urban-furniture/
├── client/   # React/Vite application and reusable UI modules
├── server/   # Express API, authentication, services and Prisma
├── .env.example
├── package.json
└── README.md
```

## Database

The Prisma schema contains the requested user, contact, product, account, journal, analytic account, budget, sales, purchases, payments, and journal-entry relationships. `server/src/services/accountingService.js` is the future home for balanced debit/credit posting logic; it is intentionally not implemented yet.
