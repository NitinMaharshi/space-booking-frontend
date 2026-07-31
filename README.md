# CoSpace — Co-working Space Booking System (Frontend)

React SPA for a co-working space booking platform: desks, meeting rooms, private offices, and event spaces. Visitors browse, members book, admins manage.

This is the frontend half of a two-repo project. Backend/API: [space-booking-backend](https://github.com/NitinMaharshi/space-booking-backend) (needed for this app to actually do anything — it's a pure client).

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · Radix UI primitives · TanStack Query · React Hook Form + Zod · Zustand · Vitest + React Testing Library · Playwright · `@axe-core/playwright`

## Quick start (Docker)

```bash
cp .env.example .env   # VITE_API_URL — point at your running backend
docker build --target development -t space-booking-frontend:dev .
docker run --rm -p 5173:5173 --env-file .env space-booking-frontend:dev
```

Frontend: http://localhost:5173. You need the [backend](https://github.com/NitinMaharshi/space-booking-backend) running and reachable at whatever `VITE_API_URL` points to — this app doesn't do anything on its own without an API behind it.

## Quick start (without Docker)

Requires Node.js 22+.

```bash
npm install
cp .env.example .env    # VITE_API_URL — defaults to http://localhost:3000
npm run dev              # http://localhost:5173
```

## Demo logins

Assuming the backend's been seeded (`npm run db:seed` in the backend repo):

| Role   | Email               | Password       |
| ------ | ------------------- | -------------- |
| Admin  | `admin@cospace.dev` | `Password@123` |
| Member | `bob@cospace.dev`   | `Password@123` |
| Member | `carla@cospace.dev` | `Password@123` |

## Roles & core features

- **Visitor**: browse spaces with search/filter/date-availability, check a space's day-by-day availability timeline, register.
- **Member**: everything a visitor can do, plus request bookings, view/cancel their own bookings (optimistic UI update), manage their profile, verify their email.
- **Admin**: everything a member can do, plus manage spaces, approve/reject bookings (optimistic UI update), schedule maintenance windows.

Auth: access token kept in memory (Zustand — never `localStorage`, so an XSS payload can't read it), refresh token in an httpOnly cookie handled entirely by the backend. Route guards (`ProtectedRoute`) redirect unauthenticated or under-privileged users automatically.

## Testing

```bash
npm test                 # Vitest component tests
npm run test:e2e         # Playwright e2e — starts its own Vite server; needs the backend running (see e2e/booking-journey.spec.ts)
```

The e2e suite also includes an **accessibility audit** (`e2e/accessibility.spec.ts`) — scans every public/member/admin page with axe-core against WCAG 2.0/2.1 A/AA and asserts zero violations.

## Code quality

```bash
npm run lint            # oxlint
npm run format:check    # Prettier + import-sort (repo-wide, not just src/)
npx tsc -b --noEmit     # typecheck
```

`lint-staged` runs `prettier --write` + `oxlint --fix` on every commit via Husky.

## Common issues

- **API calls fail / network errors on every page**: the backend isn't running or isn't reachable at the `VITE_API_URL` you configured — this app has no functionality without it.
- **CORS errors in the browser console**: the backend's `CORS_ORIGIN` env var doesn't include this app's origin (e.g. `http://localhost:5173`) — see the backend repo's [CSRF/CORS docs](https://github.com/NitinMaharshi/space-booking-backend/blob/main/docs/ARCHITECTURE.md#csrf).
- **Playwright e2e times out on login/logout steps**: usually means the backend's auth rate limit was hit from running many tests back-to-back locally — check `AUTH_THROTTLE_LIMIT` in the backend's `.env`.

## License

UNLICENSED — internal project.
