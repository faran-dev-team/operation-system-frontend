# Operation System — Frontend

Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.

## Setup

```bash
npm install
cp .env.example .env.local
```

`.env.local` should point at the NestJS API:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Run

Backend (port 4000) must be running for sign-in:

```bash
# backend repo
npm run start:dev
```

Frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits redirect to `/login`.

## Auth notes

- Typed API client lives in `src/lib/api` and follows backend `docs/API_CONTRACT.md`.
- Password login calls `POST /api/v1/auth/login`, then `GET /api/v1/me`.
- Session token is stored in localStorage (Remember me) or sessionStorage.
- Sign out clears the session and returns to `/login`.

```bash
npm run lint
npm run build
```
