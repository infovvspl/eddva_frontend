# EDDVA — Frontend

Single-page React application serving every EDDVA portal: the school product
(super-admin, institute admin, teacher, student, parent), the coaching product,
the public marketing site and the blog admin.

One build serves all tenants. Which institute a visitor belongs to is resolved
from the **subdomain** at runtime, not at build time.

---

## Quick start

```sh
npm install
npm run dev          # http://localhost:8080
```

The dev server proxies `/api`, `/uploads` and `/socket.io` to the backend at
`http://localhost:3000`. Start the NestJS backend first, or point somewhere
else with `VITE_DEV_PROXY_TARGET`.

No `.env` is required for local development — the defaults assume a backend on
port 3000 on the same machine.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on port 8080, HMR, API proxy |
| `npm run build` | Production build into `dist/` |
| `npm run build:dev` | Production build with development env values |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint over the repo |

There is no separate typecheck script — run `npx tsc --noEmit`.

## Environment variables

All are optional in development. Vite only exposes variables prefixed `VITE_`.

| Variable | Purpose | Default when unset |
|---|---|---|
| `VITE_API_BASE_URL` | REST API base | `/api/v1` (dev proxy, or same origin in prod) |
| `VITE_BACKEND_URL` | Backend origin for some direct calls | falls back to the API base |
| `VITE_SOCKET_URL` | Socket.IO origin | same origin |
| `VITE_DEV_PROXY_TARGET` | Where the dev server proxies API calls | `http://localhost:3000` |
| `VITE_DEFAULT_TENANT_SUBDOMAIN` | Tenant whose catalogue the public pages fall back to | none |
| `VITE_PUBLIC_CATALOG_TENANT_ID` | Tenant whose catalogue the public site shows | none |
| `VITE_AGORA_APP_ID` | Agora RTC app id for live classes | live class disabled |
| `VITE_SARVAM_API_KEY` | Sarvam speech services | feature disabled |
| `VITE_PPT_STUDIO_URL` | PPT studio origin | bundled `public/ppt-studio` |
| `VITE_LIBRARY_BACKEND_URL` | Library service | none |
| `VITE_SPORTS_BACKEND_URL` | Sports service | none |

Production values are set by the deploy workflow, not by a committed `.env`.

## Multi-tenancy

A tenant is identified by subdomain and resolved in [`src/lib/tenant.ts`](src/lib/tenant.ts):

```
iit.eddva.in    → tenant "iit"
iit.localhost   → tenant "iit"     (works in dev)
localhost       → falls back to the subdomain stored at login
```

Super-admin accounts have no tenant; the stored subdomain is cleared on login
so the platform routes render instead.

When testing tenant behaviour locally, use `iit.localhost:8080` rather than
plain `localhost`.

## Project layout

```
src/
  pages/
    school/         school product — admin/ teacher/ student/ parent/
    student/        coaching student portal
    teacher/        coaching teacher portal
    admin/          institute admin (coaching)
    super-admin/    platform administration
    blog-admin/     blog authoring
    landing/        marketing pages
  new-website/      public marketing site (separate design system)
  components/
    school/         school-specific UI (Button, Modal, DataTable, …)
    ui/             shadcn/Radix primitives
  lib/
    api/            one axios module per domain
    api-config.ts   base URL resolution
    tenant.ts       subdomain → tenant
    *-socket.ts     Socket.IO clients (live, chat, battle, notifications)
  hooks/            shared React hooks
  context/          React context providers
```

`@/` is aliased to `src/`, so import as `@/lib/api/school-client`.

## API conventions

`src/lib/api/client.ts` is the shared axios instance. Its request interceptor
attaches the bearer token and, **for coaching requests only**, an
`X-Tenant-Subdomain` header. School requests and super-admin requests
deliberately omit it: school scopes by `institute_id` in its own database, and
super-admin is a platform-wide role. Each domain gets a thin module beside the
client (`teacher.ts`, `blog.ts`, `live-class.ts`, …).

**School pages use [`school-client.ts`](src/lib/api/school-client.ts), which
prefixes every path with `/school` automatically.** Call
`api.get('/assessments')`, never `api.get('/school/assessments')` — prefixing
twice is the most common mistake in this codebase.

The API base resolves in this order: `VITE_API_BASE_URL` → `/api/v1` in dev →
same-origin `/api/v1` in production. If the app is opened over a LAN IP while
`VITE_API_BASE_URL` points at `localhost`, the host is rewritten to the current
one so phones on the same network work without reconfiguration.

## Notable dependencies

- **UI** — Tailwind CSS, shadcn/ui on Radix primitives, Framer Motion, Lucide icons
- **Data** — TanStack Query, Zustand stores, React Hook Form + Zod
- **Content** — react-markdown with `remark-gfm` / `remark-math` / `rehype-katex`
  for maths, TipTap for rich text, ReactFlow for mind maps, Recharts for charts
- **Media** — Agora RTC and HLS.js for live and recorded classes, `pdfjs-dist`
  and `react-pdf` for documents
- **Realtime** — Socket.IO for live classes, chat, battles and notifications

Rendered markdown does **not** load `rehype-raw`, so raw HTML in content is
inert. Keep it that way — content arrives from teachers and from AI generation.

## Testing

Vitest with jsdom and Testing Library; setup lives in `src/test/setup.ts`, and
specs sit next to the code as `*.test.ts(x)`.

```sh
npm test                                  # everything
npx vitest run src/components/school      # one directory
```

`@testing-library/user-event` is **not** a dependency — use `fireEvent` with
`act` from React, as the existing tests do.

Playwright is installed and configured (`playwright.config.ts`) but the suite
is not wired into CI.

## Building and deployment

`npm run build` emits `dist/`. The build targets ES2019 / Safari 14 so that
older iOS WebKit can parse the output — do not raise that target without
checking iPad usage.

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds with the production API URLs and ships `dist/` to EC2. The deploy
publishes **assets only** — it does not touch nginx or certificates.

`dev` is the integration branch; `main` is production.

## Repository notes

The repository root still holds a number of one-off debugging scripts
(`scratch_*`, `test_*`, `fix_*`, stale `vite.config.ts.timestamp-*` files).
They are not part of the build and can be ignored; they are being cleared
gradually.
