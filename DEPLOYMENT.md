# Production Deployment Guide

This app is a Next.js server-rendered web app with a Prisma + libsql
database and Redis for URL metadata caching. The steps below cover what
you need and how to deploy to a typical production setup.

## What you need

- Node.js 20+ runtime (18+ may work, but 20 LTS is the safest choice).
- A persistent database reachable via `TURSO_DATABASE_URL` or `DATABASE_URL`
  (libsql/SQLite).
- A Redis instance reachable via `REDIS_URL`.
- A secure `BETTER_AUTH_SECRET` value.
- A public URL + HTTPS (recommended for auth cookies and general security).

## Required environment variables

- `TURSO_DATABASE_URL`
  - Example: `libsql://<db-name>.turso.io`
- `TURSO_AUTH_TOKEN`
  - Required for Turso. Store only in your deployment secret manager.
- `DATABASE_URL`
  - Local dev uses `file:./dev.db`.
  - Production can reuse the Turso URL (or set only `TURSO_DATABASE_URL`).
  - Self-hosted SQLite on a persistent disk: `file:/absolute/path/prod.db`
- `LOCAL_DATABASE_URL`
  - Used only by Prisma CLI for migrations and schema changes.
  - Example: `file:./dev.db`
- `REDIS_URL`
  - Example: `redis://localhost:6379` or `rediss://user:pass@host:port`
- `BETTER_AUTH_SECRET`
  - Generate a strong secret:
    - `openssl rand -base64 32`
- `NODE_ENV=production`

Note: the runtime supports `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` and
falls back to `DATABASE_URL`.

## Database setup

Prisma CLI does not support `libsql://` directly. Use a local SQLite URL for
CLI commands, then apply the generated SQL to Turso.

1) Configure Prisma CLI to use `LOCAL_DATABASE_URL` (already set in
   `prisma.config.ts`).
   - Optional in `.env` (defaults to `file:./dev.db` if not set):
     - `LOCAL_DATABASE_URL="file:./dev.db"`
2) Generate a migration locally:
   - `npx prisma migrate dev --name init`
3) Apply to Turso with the Turso CLI:
   - `turso db shell bmrks-production < ./prisma/migrations/<timestamp>_init/migration.sql`

For local dev only, you can use:
- `npx prisma db push`

## Build and run (generic Node server)

1) Install dependencies:
   - `npm ci`
2) Generate the Prisma client:
   - `npx prisma generate`
3) Apply the schema:
   - `npx prisma db push`
4) Build the app:
   - `npm run build`
5) Run the server:
   - `NODE_ENV=production npm run start`

The app will listen on port 3000 by default.

## Deploy on Vercel (example)

1) Create a Vercel project from this repo.
2) Set environment variables in Vercel:
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `REDIS_URL`, `BETTER_AUTH_SECRET`
3) Set the Build Command to:
   - `npx prisma generate && npm run build`
4) Provide a managed Redis service (e.g. Upstash or Redis Cloud).
5) Use a managed libsql/SQLite service (e.g. Turso) for `DATABASE_URL`.
6) Deploy.

## Deploy on a VM or container (example)

1) Provision a host with Node.js 20 and a process manager (systemd/pm2).
2) Provide Redis (managed or a Docker container).
3) Set environment variables in the host config.
4) Run the build steps above.
5) Run `npm run start` behind a reverse proxy (nginx/Caddy) with HTTPS.

## Operational notes

- Back up the database regularly (especially if using a file-based DB).
- Make sure outbound HTTP/S is allowed (URL metadata fetcher needs it).
- Use `rediss://` for Redis in production if supported by your provider.
