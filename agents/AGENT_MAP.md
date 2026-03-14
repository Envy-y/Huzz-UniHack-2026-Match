# Agent Dependency Map

## Execution Phases

```
━━━━━━━━━━━━━━━━━━━━━━━ BACKEND PHASE ━━━━━━━━━━━━━━━━━━━━━━━━

LAYER B0 — Foundation (no deps, start here)
└── B1: DB Foundation

LAYER B1 — Core Infrastructure (parallel, after B0)
├── B2: Auth Backend
└── B3: tRPC Infrastructure

LAYER B2 — Feature APIs (parallel, after B1 + B2 + B3)
├── B4: Players API
├── B5: Lobbies API
└── B9: Admin & Seeding

LAYER B3 — Complex Features (parallel, after B5)
├── B6: Matchmaking Engine    ← needs B5
└── B7: Voice Search API      ← needs B5

LAYER B4 — Payment Backend (after B6)
└── B8: Payment Backend

━━━━━━━━━━━━━━━━━━━━━━━ FRONTEND PHASE ━━━━━━━━━━━━━━━━━━━━━━━

All frontend agents start once their corresponding backend layer is done.
They can run in parallel with each other.

├── F1: Auth UI               ← after B2
├── F2: Home Page             ← after B5
├── F3: Advanced Match Page   ← after B7
├── F4: Create Lobby Page     ← after B5
├── F5: Profile Page          ← after B4
└── F6: Payment Page          ← after B8
```

---

## Dependency Matrix

### Backend

| Agent | File | Depends On | Blocks |
|-------|------|-----------|--------|
| B1 | [B1-db-foundation.md](backend/B1-db-foundation.md) | — | all |
| B2 | [B2-auth-backend.md](backend/B2-auth-backend.md) | B1 | B4, B5, B6, F1 |
| B3 | [B3-trpc-infrastructure.md](backend/B3-trpc-infrastructure.md) | B1, B2 | B4, B5, B6, B7, B9 |
| B4 | [B4-players-api.md](backend/B4-players-api.md) | B1, B2, B3 | F5 |
| B5 | [B5-lobbies-api.md](backend/B5-lobbies-api.md) | B1, B2, B3 | B6, B7, F2, F4 |
| B6 | [B6-matchmaking-engine.md](backend/B6-matchmaking-engine.md) | B1, B2, B3, B5 | B8 |
| B7 | [B7-voice-search-api.md](backend/B7-voice-search-api.md) | B3, B5 | F3 |
| B8 | [B8-payment-backend.md](backend/B8-payment-backend.md) | B6 | F6 |
| B9 | [B9-admin-seeding.md](backend/B9-admin-seeding.md) | B1, B3 | — |

### Frontend

| Agent | File | Depends On |
|-------|------|-----------|
| F1 | [F1-auth-ui.md](frontend/F1-auth-ui.md) | B2 |
| F2 | [F2-home-page.md](frontend/F2-home-page.md) | B5 |
| F3 | [F3-advanced-match-page.md](frontend/F3-advanced-match-page.md) | B7 |
| F4 | [F4-create-lobby-page.md](frontend/F4-create-lobby-page.md) | B5 |
| F5 | [F5-profile-page.md](frontend/F5-profile-page.md) | B4 |
| F6 | [F6-payment-page.md](frontend/F6-payment-page.md) | B8 |

---

## Contracts Each Backend Agent Must Expose

Downstream agents (both backend and frontend) import these. Each backend agent MUST produce these before marking itself done.

| Agent | Exposes |
|-------|---------|
| B1 | `src/lib/prisma.ts` singleton · `src/types.ts` shared domain types · `prisma/schema.prisma` |
| B2 | `src/server/context.ts` with `ctx.playerId` · `src/lib/supabase.ts` browser client · `src/middleware.ts` |
| B3 | `src/server/trpc.ts` procedure builders · `src/lib/trpc.ts` client · `/api/trpc/[trpc]/route.ts` handler |
| B4 | `players` tRPC sub-router: `.get` `.update` `.matchHistory` `.create` |
| B5 | `lobbies` tRPC sub-router: `.list` `.create` `.recommendations` · `LobbyCard` component |
| B6 | `queue` tRPC sub-router: `.join` · Haversine util · Matchmaker service |
| B7 | `lobbies.search` tRPC procedure · `nlToSql.ts` utility |
| B8 | `payment` tRPC sub-router: `.createSession` · Stripe mock session |
| B9 | Seed scripts · `admin` tRPC sub-router: `.reset` `.scrape` |

---

## Shared Types (`src/types.ts`) — owned by B1

```ts
export type Day        = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export type TimeSlot   = 'M' | 'A' | 'N'
export type GameType   = 'S' | 'D'
export type Objective  = 'Competitive' | 'Social' | 'Casual'
export type LobbyStatus = 'Open' | 'Full' | 'Matched' | 'Cancelled'
export type MatchStatus = 'Confirmed' | 'Played' | 'Cancelled'
```

All agents import from `@/types` — never redefine these locally.

---

## Full Feature Checklist

Frontend agents must account for all of these when building UI:

- [ ] Email/password sign up + login
- [ ] Geolocation capture on first login
- [ ] Home page — 4 recommended lobbies (past co-players + skill proximity)
- [ ] LobbyCard — game type, days, time, objective, skill, fill bar, join button
- [ ] Create lobby form — match type, objective, days, time, description
- [ ] Advanced match — voice search via Vapi.ai mic button
- [ ] Voice search results — exact SQL matches + recommendation padding
- [ ] Queue join flow — when joining a lobby from any LobbyCard
- [ ] Profile page — view/edit skill + bio, match history list
- [ ] Payment page — fee split display, Stripe test checkout per player
- [ ] Admin panel (dev only) — reset lobbies, trigger scrape
