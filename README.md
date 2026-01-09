# Bar Scan Platform

Production-ready monorepo for a web app that scans QR/barcodes, matches against a product catalog, and persists scan records.

## Features
- Live camera feed with automatic multi-frame scanning (no manual trigger).
- QR and barcode support with cooldown and idempotent scan handling.
- Product matching with persisted scan history and action workflow.
- Action filters including Awaiting/Deployed/Returned.
- Printable QR/barcode labels and a Create Product flow with auto-incremented codes.
- Mobile testing via ngrok with HTTPS camera support.

## Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 14+

## Workspace Layout
- apps/web: Next.js frontend
- apps/api: NestJS backend
- packages/shared: shared types/DTOs
- prisma: schema and seed

## Local Setup
1) Install dependencies:
```
pnpm install
```

2) Create a local database (choose one):
- Option A: Docker (recommended)
Open a new terminal at the repo root (`c:\repo\barScan`), then:
```
docker compose up -d
```
Note: Docker Postgres runs on port 5433, while local Postgres typically uses 5432.
Make sure your `DATABASE_URL` matches the port you are using.
- Docker credentials (default):
  - user: `postgres`
  - password: `postgres`
- To stop and remove the container data:
```
docker compose down -v
```
- Option B: Local Postgres DB creation
```
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE bar_scan_platform;"
```

3) Configure environment variables:
- Copy root env:
```
copy .env.example .env
```
- Update `DATABASE_URL` in `.env`:
  - Docker example (port 5433):
    ```
    DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bar_scan_platform?schema=public"
    ```
  - Local Postgres example (port 5432):
    ```
    DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/bar_scan_platform?schema=public"
    ```
- Web env in `apps/web/.env.local` (committed with safe defaults):
```
NEXT_PUBLIC_API_BASE_URL="/api"
NEXT_PUBLIC_SCAN_COOLDOWN_SECONDS="5"
```
Note: This was purely done to reduce number of manual steps during local installation.

4) Run migrations and seed:
```
pnpm prisma migrate dev
pnpm prisma generate
pnpm db:seed
```

5) Start dev servers (two terminals):
- Terminal A:
```
pnpm -F @bar-scan/api dev
```
- Terminal B:
```
pnpm -F @bar-scan/web dev
```

## Verification
- Web app: http://localhost:3000
- API: http://localhost:4000
- Create a scan and verify it shows in history and in Prisma Studio:
```
pnpm prisma studio
```
Note: Barcode human-readable text can be toggled in
`apps/web/src/components/LabelPreview.tsx` via `displayValue`.

## Ngrok (mobile testing)
1) Download ngrok and extract ngrok.exe:
https://ngrok.com/download
2) Add the folder containing ngrok.exe to your PATH.
Example: if `ngrok.exe` is in `C:\tools\ngrok\ngrok.exe`, add `C:\tools\ngrok` to PATH.
3) Add your token:
```
ngrok config add-authtoken YOUR_TOKEN
```
Note: If ngrok says the config file is not found, create it here:
`C:\Users\YOUR_USER\AppData\Local\ngrok\ngrok.yml`
Make sure the file extension is `.yml`.

4) Run only the web tunnel (In a new Terminal):
```
ngrok http 3000
```
5) Make sure the API is running locally (Restart Terminal A):
```
pnpm -F @bar-scan/api dev
```
6) Open the ngrok web URL on your phone. The web app proxies API calls to localhost.

## Key Design Decisions
- Prisma handles schema/migrations and deterministic seeding.
- API enforces product matching and action transitions server-side.
- Scanning is automatic with multi-frame confirmation and cooldown.
- Decode and persist from captured frame for deterministic processing.
- Idempotency + cooldown backed by Postgres advisory locks.
- Web app proxies API via `/api` rewrite for ngrok single-tunnel flow.

## Known Limitations
- Prisma Studio does not auto-refresh; manual refresh is required.
- Mobile camera access requires HTTPS (use ngrok).
- ngrok free plan supports a single public URL; API requests are proxied via `/api`.
- No authentication/authorization layer is implemented.
- Prisma generate can fail on Windows if the API process is running (file lock).
- No unit tests included as part of this demo.
- Current implementation of the live feed camera could lead to memory leaks

## Testing Notes
- Manual verification via camera scan and scan history.
- API actions are validated server-side (single transition).

## To Refactor/Implement for better Production Readiness (not an exhaustive list)
High-priority gaps:
- Committed `.env.local` is not standard practice; replace with `.env.local.example`.
- Product code generation relies on lexicographic ordering of `codeValue`; use a numeric sequence.
- No authentication/authorization for action updates or product creation.
- No API rate limiting or abuse protection.

Medium-priority gaps:
- Error responses are not standardized; add a consistent error schema.
- CORS is open; lock to allowed origins.
- Docker flow requires manual migrate/seed; automate for one-command boot.

Lower-priority polish:
- Add tests (API unit + e2e smoke).
- Add CI (lint + typecheck + tests).
- Share types/DTOs across API and web.

## Tech Stack
- Frontend: Next.js, Tailwind CSS, TypeScript
- Backend: NestJS, Prisma, TypeScript
- Database: PostgreSQL (local or Docker)
- Scanning: @zxing/browser
- Monorepo: pnpm workspaces

## Architecture
- `apps/web` (Next.js UI) calls API via `/api` proxy or direct base URL.
- `apps/api` (NestJS) handles scan processing, actions, and product creation.
- `prisma` owns schema, migrations, and deterministic seed data.
