# Plaxe Implementation Plan

Automated per-user media deletion for Plex. A server admin logs in via Plex OAuth, assigns users (home/friends) to media (shows/movies), and when all assigned users have watched something, it is auto-deleted after a configurable delay.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ apps/web (TanStack Start + React 19)                    │
│  ├── UI (shadcn/ui + Tailwind v4)                       │
│  ├── Catch-all API route → Effect HttpApi handler       │
│  └── OpenAPI client (auto-generated from contracts)     │
├─────────────────────────────────────────────────────────┤
│ libs/api (@plaxe/api)                                   │
│  ├── contracts/ (HttpApi definitions)                   │
│  ├── handlers/  (HttpApiBuilder implementations)        │
│  ├── services/  (business logic)                        │
│  └── db/        (Drizzle schema + migrations)           │
├─────────────────────────────────────────────────────────┤
│ libs/plex-client (@plaxe/plex-client)                   │
│  └── Effect-based HTTP client for Plex APIs             │
└─────────────────────────────────────────────────────────┘
     │                              │
     ▼                              ▼
  SQLite (local)              Plex Media Server
                              + plex.tv API
```

---

## Phase 1: Foundation

### 1.1 — Plex HTTP Client (`libs/plex-client`)

New workspace package `@plaxe/plex-client` with an Effect-based HTTP client wrapping the Plex APIs.

**plex.tv API (cloud):**

- `POST /api/v2/pins` — Create a PIN for OAuth
- `GET /api/v2/pins/{id}` — Check/claim a PIN (get auth token)
- `GET /api/v2/user` — Validate token / get current user info
- `GET /api/v2/resources` — Discover servers for the authenticated user
- `GET /api/v2/friends` — List friends the admin shares with
- `GET /api/v2/home/users` — List home (managed) users

**Plex Media Server API (local):**

- `GET /library/sections` — List library sections (Movie/TV)
- `GET /library/sections/{id}/all` — List all items in a library
- `GET /library/metadata/{id}` — Get a single metadata item (includes `viewCount`, `viewedLeafCount`, `leafCount`)
- `GET /library/metadata/{id}/children` — Get seasons (for a show)
- `GET /library/metadata/{id}/allLeaves` — Get all episodes of a show
- `GET /status/sessions/history/all` — Playback history (admin sees all users, includes `accountID`)
- `DELETE /library/metadata/{id}` — Delete a metadata item (and its files)

**Design:**

- Service tag: `PlexClient` (Effect Context.Tag)
- Config: `PlexClientConfig` (server URL, auth token) via Effect `Config`
- All requests include standard Plex headers: `X-Plex-Token`, `X-Plex-Client-Identifier`, `X-Plex-Product`, `Accept: application/json`
- Use `@effect/platform` `HttpClient` for requests
- Typed error type: `PlexApiError` (extends `Data.TaggedError`)

### 1.2 — Database Layer (`libs/api/src/db/`)

**Packages:**

- `@effect/sql-sqlite-node` + `better-sqlite3` — SQLite client for Effect
- `@effect/sql-drizzle` — Drizzle integration via `SqliteDrizzle`
- `drizzle-orm` + `drizzle-kit` — Schema definition & migrations

**Schema (Drizzle):**

```
admin
  id              TEXT PK (plex account ID)
  username        TEXT NOT NULL
  email           TEXT
  thumb           TEXT
  plexToken       TEXT NOT NULL (encrypted at rest)
  serverUrl       TEXT NOT NULL
  serverName      TEXT
  serverMachineId TEXT
  clientId        TEXT NOT NULL (our app's client identifier)
  createdAt       INTEGER NOT NULL (unix timestamp)
  updatedAt       INTEGER NOT NULL

plex_user
  id              TEXT PK (plex user ID)
  title           TEXT NOT NULL (display name)
  username        TEXT
  thumb           TEXT
  isHome          INTEGER NOT NULL DEFAULT 0 (boolean: home user vs friend)
  createdAt       INTEGER NOT NULL
  updatedAt       INTEGER NOT NULL

media
  id              TEXT PK (uuid)
  plexRatingKey   TEXT NOT NULL UNIQUE
  title           TEXT NOT NULL
  type            TEXT NOT NULL ('movie' | 'show')
  thumb           TEXT
  librarySectionId TEXT NOT NULL
  createdAt       INTEGER NOT NULL
  updatedAt       INTEGER NOT NULL

media_user_assignment
  id              TEXT PK (uuid)
  mediaId         TEXT NOT NULL FK → media.id
  plexUserId      TEXT NOT NULL FK → plex_user.id
  createdAt       INTEGER NOT NULL
  UNIQUE(mediaId, plexUserId)

watch_status
  id              TEXT PK (uuid)
  mediaId         TEXT NOT NULL FK → media.id
  plexUserId      TEXT NOT NULL FK → plex_user.id
  plexRatingKey   TEXT NOT NULL (episode or movie ratingKey)
  watchedAt       INTEGER NOT NULL (unix timestamp)
  createdAt       INTEGER NOT NULL
  UNIQUE(mediaId, plexUserId, plexRatingKey)

deletion_queue
  id              TEXT PK (uuid)
  plexRatingKey   TEXT NOT NULL (the specific item to delete — episode or movie)
  mediaId         TEXT NOT NULL FK → media.id
  title           TEXT NOT NULL
  scheduledAt     INTEGER NOT NULL (unix timestamp: when it becomes eligible)
  deletedAt       INTEGER (null until actually deleted)
  cancelledAt     INTEGER (null unless admin cancels)
  createdAt       INTEGER NOT NULL
```

**Layer composition:**

```
SqliteClientLayer (better-sqlite3, WAL mode)
  → SqliteDrizzle.layer
  → MigratorLayer (run migrations on startup)
  → merge into AppLayer
```

**Config:**

- `DB_PATH` — path to SQLite file (default: `./data/plaxe.db`)
- `DELETION_DELAY_HOURS` — configurable delay (default: `24`)

### 1.3 — Auth: Plex OAuth (Forwarding flow)

Since this is a web app with a single admin user:

**Flow:**

1. User visits `/login`
2. Frontend calls `POST /api/auth/login` — server creates a PIN via plex.tv, returns `pinId` + `pinCode`
3. Frontend redirects user to `https://app.plex.tv/auth#?clientID=...&code=...&forwardUrl=.../api/auth/callback`
4. User authenticates with Plex, gets redirected back to `GET /api/auth/callback?pinId=...`
5. Server checks PIN via `GET /api/v2/pins/{pinId}` — gets `authToken`
6. Server fetches user info, discovers servers, and stores admin record in DB
7. Server sets an HTTP-only session cookie (signed, containing admin ID)
8. Redirect to `/`

**API Group: `AuthApi`**

- `POST /api/auth/login` → returns `{ pinId, pinCode, authUrl }`
- `GET /api/auth/callback` → processes the OAuth callback
- `POST /api/auth/logout` → clears session
- `GET /api/auth/me` → returns current admin info (or 401)

**Session management:**

- HTTP-only signed cookie (Effect `HttpApiSecurity.apiKey` with cookie location)
- Middleware on protected groups checks the cookie, loads admin from DB, adds to context

---

## Phase 2: Core Features

### 2.1 — User Management

**Service: `PlexUserService`**

- `syncUsers()` — fetches friends + home users from plex.tv API, upserts into `plex_user` table
- `listUsers()` — returns all known Plex users
- `getUser(id)` — returns a single user

**API Group: `UsersApi`** (protected)

- `GET /api/users` → list all users
- `POST /api/users/sync` → trigger a sync from Plex

### 2.2 — Media & Assignment Management

**Service: `MediaService`**

- `syncLibrary(sectionId)` — fetches all items from a library section, upserts into `media` table
- `listMedia(filters?)` — list tracked media with assignment counts
- `getMedia(id)` — get single media item with assignments
- `assignUser(mediaId, userId)` — create assignment
- `unassignUser(mediaId, userId)` — remove assignment
- `getAssignments(mediaId)` — list assigned users for a media item

**Deletion granularity:**

- **Movies:** the movie itself is enqueued for deletion
- **TV Shows:** individual episodes are enqueued for deletion when all assigned users have watched that episode; the show-level assignment covers all current and future episodes

**API Group: `MediaApi`** (protected)

- `GET /api/media` → list media (with filters: type, library, search)
- `GET /api/media/:id` → get media detail with assigned users and per-episode watch status
- `POST /api/media/:id/assignments` → assign a user `{ userId }`
- `DELETE /api/media/:id/assignments/:userId` → unassign a user
- `GET /api/libraries` → list Plex library sections
- `POST /api/libraries/:id/sync` → sync media from a library

### 2.3 — Watch Status Polling

**Service: `WatchPollerService`**

- Runs on a configurable interval (default: 5 minutes)
- For each tracked media item with assignments:
    - **Movies:** check playback history for each assigned user
    - **TV Shows:** track individual episode watches per assigned user; when all assigned users have watched an episode → enqueue that episode for deletion
- Records new watches in `watch_status` table
- When all assigned users have watched an item → enqueue in `deletion_queue` with `scheduledAt = now + DELETION_DELAY_HOURS`

**Approach for per-user watch status:**

- The admin token can query `/status/sessions/history/all` which includes `accountID` for all users
- Poll this endpoint filtered by `mindate` (last poll time) to get only recent watches
- Cross-reference `accountID` + `ratingKey` against assignments

**History cursor / caching:**

- Store a `lastPolledAt` timestamp (unix) in a `poll_state` table
- Each poll passes `mindate=lastPolledAt` so we only fetch new history entries since the last poll
- On success, update `lastPolledAt` to the current time
- This avoids re-parsing the full history on every poll cycle
- On first run (no cursor), do a full history scan and backfill `watch_status`

**`poll_state` table:**

```
poll_state
  key             TEXT PK ('watch_history')
  lastPolledAt    INTEGER NOT NULL (unix timestamp)
  updatedAt       INTEGER NOT NULL
```

**Scheduling:**

- Use `Effect.Schedule` with `Effect.repeat` for the polling loop
- Runs as a fiber started when the app boots, managed via `Effect.forkScoped`

### 2.4 — Deletion Engine

**Service: `DeletionService`**

- Runs on a schedule (e.g., every 10 minutes)
- Queries `deletion_queue` for items where `scheduledAt <= now` AND `deletedAt IS NULL` AND `cancelledAt IS NULL`
- For each eligible item:
    - Calls `DELETE /library/metadata/{ratingKey}` on the Plex server
    - Marks `deletedAt` in the queue
    - Logs the deletion
- Admin can cancel pending deletions before they execute

**API endpoints** (protected):

- `GET /api/deletions` → list deletion queue (pending, completed, cancelled)
- `POST /api/deletions/:id/cancel` → cancel a pending deletion

---

## Phase 3: Frontend

### 3.1 — Pages & Routes

```
/login                  — Plex OAuth login page
/                       — Dashboard (overview, upcoming deletions)
/libraries              — Browse Plex libraries, trigger syncs
/media                  — Browse tracked media, manage assignments
/media/:id              — Media detail: assigned users, watch status, deletion status
/users                  — View/sync Plex users
/settings               — Deletion delay config, re-auth
```

### 3.2 — UI Components

- Use existing shadcn/ui setup (new-york style)
- Key components: DataTable, UserAvatar, MediaCard, AssignmentDialog, DeletionCountdown
- TanStack Router for routing (already set up)
- `openapi-fetch` client for API calls (already set up, regenerate as API grows)

---

## Phase 4: Polish & Operations

### 4.1 — Error Handling & Resilience

- Retry logic on Plex API calls (Effect `Schedule` with exponential backoff)
- Graceful handling of Plex server being unreachable
- Activity log table for audit trail

### 4.2 — Docker Support

- Dockerfile (multi-stage build)
- Volume mount for SQLite DB file
- Environment variable configuration

### 4.3 — Future Considerations

- Multi-server support (add `serverId` FK to media/assignments)
- Plex webhooks for real-time watch detection
- Notification system (Discord/email when deletions are scheduled)
- Granular TV show tracking (per-season assignments)

---

## Implementation Order

1. **`libs/plex-client`** — Plex API client (auth + core endpoints)
2. **Database schema** — Drizzle schema, migrations, SQLite layer
3. **Auth flow** — Plex OAuth + session middleware
4. **User sync** — Fetch and store friends/home users
5. **Media sync** — Fetch and store library media
6. **Assignments API** — Assign/unassign users to media
7. **Watch polling** — Detect watched media per user
8. **Deletion engine** — Queue + execute deletions
9. **Frontend** — Dashboard, media browser, user management
10. **Docker** — Container packaging

---

## Key Dependencies to Add

**`libs/plex-client`:**

- `@effect/platform` (HttpClient)
- `effect`

**`libs/api`:**

- `@effect/sql` + `@effect/sql-sqlite-node` + `@effect/sql-drizzle`
- `better-sqlite3` + `@types/better-sqlite3`
- `drizzle-orm` + `drizzle-kit`

**`apps/web`:**

- No new deps needed initially (already has openapi-fetch, shadcn, etc.)
