# Vitaran Learning

Website and admin console for Vitaran Learning — curriculum, teacher resources, answer keys, and partner-school operations.

The repo is a two-app workspace:

| App | Stack | Default URL |
| --- | --- | --- |
| `frontend` | Next.js 16, React 19, Tailwind 4, shadcn (Base UI) | http://localhost:3000 |
| `backend` | Express 5, Prisma 7, PostgreSQL (Neon), Zod, jose | http://localhost:4000 |

## Prerequisites

- Node.js 20+
- npm
- A [Neon](https://neon.tech) Postgres database (or any Postgres 15+ with SSL)

## Quick start

Each app has a single `.env` file (`backend/.env` and `frontend/.env`). Both are gitignored.

### 1. Backend

Create `backend/.env`:

```
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://user:password@host-pooler.region.aws.neon.tech/neondb?sslmode=verify-full
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
JWT_EXPIRES_IN_HOURS=8
ADMIN_EMAIL=admin@vitaran.com
ADMIN_PASSWORD_HASH=
```

- `DATABASE_URL` — Neon connection string (`sslmode=verify-full`)
- `JWT_SECRET` — at least 32 characters (`openssl rand -base64 48`)
- `ADMIN_EMAIL` — admin login email
- `ADMIN_PASSWORD_HASH` — scrypt hash from the helper below

Generate a password hash (minimum 12 characters):

```bash
npm install
npm run hash-password -- "your-strong-password"
```

Paste the printed `scrypt:…` value into `ADMIN_PASSWORD_HASH`, then:

```bash
npx prisma generate
npm run db:migrate
npm run dev
```

API listens on port 4000. Health check: `GET http://localhost:4000/api/v1/health`.

### 2. Frontend

Create `frontend/.env`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Then:

```bash
cd frontend
npm install
npm run dev
```

Public site: http://localhost:3000  
Admin: http://localhost:3000/admin/login

## Project structure

```
backend/
  prisma/                 # schema + migrations
  src/
    config/               # env, Prisma client
    routes/               # Express routers
    controllers/
    services/
    repositories/
    schemas/              # Zod request validation
    middleware/
    generated/prisma/     # Prisma client output (generated)

frontend/
  src/
    app/(site)/           # public marketing pages
    app/admin/            # login + authenticated panel
    components/           # layout + shadcn UI
    features/             # domain UI (schools, auth, resources)
    services/             # server-only API clients
    types/
    constants/
```

## Public pages

| Path | Purpose |
| --- | --- |
| `/` | Landing page |
| `/contact` | Contact |
| `/teachers-resources` | Solution books (static files) |
| `/answer-keys` | Answer keys (static files) |
| `/results` | Student result lookup |

Teacher resources and answer keys are static assets served by the frontend. The admin screens for those pages are UI control over the same files — they are not stored in the database.

## Admin console

Protected by an httpOnly cookie (`vitaran_admin_session`) set after a successful `POST /api/v1/auth/login`. `proxy.ts` blocks `/admin/*` (except login) when the cookie is missing; pages still verify the token with `GET /api/v1/auth/me`.

| Path | Purpose |
| --- | --- |
| `/admin/login` | Sign in |
| `/admin` | Dashboard |
| `/admin/schools/new` | Register a school |
| `/admin/schools` | List, search, filter, paginate |
| `/admin/schools/[id]` | School details |
| `/admin/schools/[id]/edit` | Edit school |
| `/admin/teacher-resources` | Browse static solution books |
| `/admin/answer-keys` | Browse static answer keys |
| `/admin/results` | Placeholder (coming soon) |

School codes are assigned as `VLS-0001`, `VLS-0002`, … from an autoincrement serial.

## API

All routes sit under `/api/v1`. School routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Liveness |
| `POST` | `/auth/login` | No (rate limited) | Admin login |
| `GET` | `/auth/me` | Admin | Current admin |
| `GET` | `/schools` | Admin | List (search, status, board, page) |
| `GET` | `/schools/stats` | Admin | Dashboard stats |
| `POST` | `/schools` | Admin | Create |
| `GET` | `/schools/:id` | Admin | Get one |
| `PATCH` | `/schools/:id` | Admin | Update |
| `DELETE` | `/schools/:id` | Admin | Delete (204) |

Login is limited to 10 attempts per 15 minutes, keyed by email.

## Database

Prisma 7 with the `pg` adapter. The app and migrations both use `DATABASE_URL`.

Useful scripts (run from `backend/`):

```bash
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
npm run db:deploy     # prisma migrate deploy (CI / production)
npm run db:studio     # Prisma Studio
```

The `School` model lives in `backend/prisma/schema.prisma` (table `schools`).

## Scripts

**Backend**

```bash
npm run dev
npm run build          # prisma generate && tsc
npm start
npm run lint
npm run typecheck
npm run hash-password -- "<password>"
```

**Frontend**

```bash
npm run dev
npm run build
npm start
npm run lint
npm run typecheck
```

## Production notes

- Do not use a short or reused admin password. Generate a new hash with `hash-password` and keep `JWT_SECRET` unique per environment.
- Set `NODE_ENV=production`, a strict `CORS_ORIGIN`, and `sslmode=verify-full` on `DATABASE_URL`.
- Run `npm run db:deploy` before starting the API.
- The frontend session cookie is `Secure` in production and scoped to `/admin`.
