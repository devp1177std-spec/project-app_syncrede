# PROJECT CONTEXT: Social Media Platform Monorepo

## 1. Overview & Architecture

This repository is a TypeScript full-stack monorepo managed with **Turborepo** (`turbo` 2.4.4 / 2.11.7) and **npm workspaces** (`packageManager: npm@11.8.0`). It is structured feature-by-feature toward a production-grade social media and community marketplace application.

### Monorepo Structure

```text
social-media-app/
├── apps/
│   ├── api/                   # NestJS 11 REST API backend (Port 4000)
│   ├── web/                   # Next.js 15 (App Router) mobile-first frontend (Port 3000)
│   └── worker/                # BullMQ background job worker process
│
├── packages/
│   ├── database/              # Prisma schema, client instance, and database scripts
│   ├── types/                 # Shared TypeScript interfaces, DTOs, and Socket event enums
│   ├── validation/            # Shared Zod validation schemas and environment validation
│   ├── shared/                # Convenience re-export barrel of @social/types and @social/validation
│   └── config/                # Shared tsconfig.base.json
│
├── docker-compose.yml         # Local infrastructure: PostgreSQL, Redis, OpenSearch
├── turbo.json                 # Turbo pipeline tasks (build, lint, typecheck, test, dev)
├── package.json               # Monorepo root configuration
└── .env / .env.example        # Shared environment configuration
```

---

## 2. Tech Stack & Dependencies

| Area | Technology | Role / Notes |
| :--- | :--- | :--- |
| **Monorepo Manager** | Turborepo (`turbo` ^2.4.4) | Build orchestration, typechecking, task pipeline |
| **Web Frontend** | Next.js 15.2.0, React 19, TypeScript | App Router, mobile-first shell layout (`MobileShell`) |
| **Frontend Styling** | Tailwind CSS 3.4.17, `clsx`, `tailwind-merge` | Utility-first styling with custom mobile viewport containers |
| **Client State / Fetching** | `@tanstack/react-query` 5.66.0, `react-hook-form`, `zod` | Server state, optimistic updates, client schema validation |
| **API Backend** | NestJS 11 (`@nestjs/core`, `@nestjs/platform-express`) | Modular REST architecture, global interceptors, filters, pipes |
| **Database & ORM** | PostgreSQL 16, Prisma ORM (`@prisma/client` ^6.4.1) | Relational persistence, schema modeling, relation tables |
| **Authentication** | Better Auth (`better-auth` ^1.7.7 in API, ^1.2.3 in web) | Session tokens, password hashing, bearer plugin, username plugin |
| **Cache & In-Memory Store** | Redis (`ioredis` ^5.11.1), Docker Redis 7 | User presence, rate limit storage, popular post ZSET ranking, sets |
| **Background Queue** | BullMQ (`bullmq` ^5.81.5), `@nestjs/bullmq` | Asynchronous job dispatching and worker service |
| **Storage / Media** | AWS SDK S3 (`@aws-sdk/client-s3`, presigner) | Presigned upload/download URLs for Cloudflare R2 / S3 / MinIO |
| **Logging & Docs** | `nestjs-pino`, `pino-pretty`, `@nestjs/swagger` | Structured logging with request IDs, OpenAPI at `/api/docs` |
| **Testing** | Jest 29, `ts-jest` | 8 test suites (60 unit tests) in `apps/api` |

---

## 3. Database Schema (`packages/database/prisma/schema.prisma`)

The database provider is **PostgreSQL** (`DATABASE_URL`). Key models confirmed in schema:

- **`User` (`users`)**: Primary identity model. Includes `email`, `username`, `displayUsername`, `bio`, `location`, `website`, `isVerified`, `isPrivate`, `role` (`"user"` | `"admin"`), counters (`followerCount`, `followingCount`, `postCount`), and onboarding tracking (`termsAcceptedAt`, `termsVersion`, `onboardingCompletedAt`, `onboardingSkipped`).
- **Better Auth Core**: `Session` (`sessions`), `Account` (`accounts`), and `Verification` (`verifications`) models.
- **Social Graph Models**:
  - `Follow` (`follows`): Many-to-many follower relationship with compound unique `[followerId, followingId]`.
  - `FollowRequest` (`follow_requests`): Follow requests for private accounts (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`).
  - `Block` (`blocks`): Mutual blocking (`[blockerId, blockedId]`).
  - `Mute` (`mutes`): Notification and feed muting (`[muterId, mutedId]`).
- **Post & Media Models**:
  - `Post` (`posts`): `authorId`, `caption`, `type` (`IMAGE` | `VIDEO` | `ALBUM`), counters (`likeCount`, `commentCount`, `shareCount`, `viewCount`), denormalized engagement `score`.
  - `PostMedia` (`post_media`): `postId`, `url`, `thumbnailUrl`, `type`, `order`.
- **Identity Verification**:
  - `VerificationRequest` (`verification_requests`): Verification badge submissions with `category`, `legalName`, `documentType`, `documentUrl`, `status` (`PENDING`, `APPROVED`, `REJECTED`), reviewed by admin ID.
- **User Stories & Analytics**:
  - `Story` (`stories`): 24-hour disappearing content with `userId`, `mediaUrl`, `mediaType` (`IMAGE` | `VIDEO`), `duration`, `caption`, `location`, `linkText`, `linkUrl`, `expiresAt`.
  - `StoryView` (`story_views`): View receipts and analytics tracking viewer ID, story ID, and unique composite `[storyId, viewerId]`.

*Note on migrations:* `packages/database/prisma/` contains `schema.prisma` but no `migrations/` directory. Schema synchronization is currently done via `npm run db:push`.

---

## 4. Backend Architecture (`apps/api`)

### Global Setup (`apps/api/src/main.ts` & `app.module.ts`)
- **Global prefix**: `/api`.
- **CORS**: Configured with credentials enabled for `http://localhost:3000`.
- **Global validation pipe**: `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`.
- **Global exception filter**: `GlobalExceptionFilter` transforms all exceptions to standard `{ success: false, error: { code, message, details }, meta }` envelope.
- **Global response interceptor**: `TransformInterceptor` wraps endpoints into `{ success: true, data, meta }`.
- **Rate limiting**: `ThrottlerGuard` backed by custom `RedisThrottlerStorageService` (default 100 req / 60s).
- **Swagger Documentation**: Mounted at `http://localhost:4000/api/docs`.

### Modules & Implemented Endpoints
1. **`HealthModule`** (`/api/health`):
   - `GET /api/health`: Validates PostgreSQL connection (`SELECT 1`), Redis ping, and S3/R2 storage health.
2. **`AuthModule`** (`/api/auth`):
   - `ALL /api/auth/*`: Handled by Better Auth node handler with Prisma adapter, Redis secondary storage, bearer plugin, and username plugin.
   - Guards: `AuthGuard` (session verification), `OptionalAuthGuard` (optional viewer session injection), `RolesGuard` (`@Roles('admin')`).
3. **`UsersModule`** (`/api/users` & `/api/admin/verifications`):
   - `GET /api/users/check-username?u={username}`: Checks reserved set and DB availability; caches results in Redis (5m TTL).
   - `PATCH /api/users/me/profile`: Updates profile bio, location, website, avatar, username, onboarding state.
   - `GET /api/users/me/follow-requests`: Lists pending follow requests for private profiles.
   - `POST /api/users/follow-requests/:id/accept`: Transactionally marks request accepted, creates follow, increments follower/following counters, dispatches BullMQ notification.
   - `POST /api/users/follow-requests/:id/reject`: Marks request rejected.
   - `POST /api/users/me/verification`: Submits identity verification request.
   - `GET /api/users/me/verification`: Returns current user's latest verification status.
   - `GET /api/users/:username`: Retrieves profile, online presence from Redis key `user:presence:${id}`, and viewer relationship flags.
   - `GET /api/users/:username/posts`: Returns grid posts with cursor pagination and popular ranking via Redis ZSET (`user:${userId}:popular_posts`, 15m TTL).
   - `GET /api/users/:username/following`: Paginated following list with batched relationship flags (no N+1).
   - `GET /api/users/:username/followers`: Paginated followers list.
   - `POST /api/users/:username/follow`: Follows user (or creates `FollowRequest` if target is private).
   - `DELETE /api/users/:username/follow`: Unfollows user or cancels follow request.
   - `POST /api/users/:username/block`: Blocks target user, severs mutual follows, decrements counts, adds target to Redis set `user:${actorId}:blocks`.
   - `DELETE /api/users/:username/block`: Removes block.
   - `POST /api/users/:username/mute`: Adds to Redis set `user:${actorId}:mutes`.
   - `DELETE /api/users/:username/mute`: Removes from Redis mute set.
   - `POST /api/admin/verifications/:id/approve`: Admin route; sets `isVerified = true` on user, marks request approved, dispatches notification job.
   - `POST /api/admin/verifications/:id/reject`: Admin route; marks request rejected with reason.
4. **`StoriesModule`** (`/api/stories`):
   - `GET /api/stories/feed`: Retrieves unexpired stories for current viewer's followed accounts + self (or public discovery), sorted by unseen status.
   - `GET /api/stories/user/:username`: Retrieves unexpired stories for a specific username with view receipts.
   - `POST /api/stories`: Authenticated story creation endpoint (24-hour expiration).
   - `POST /api/stories/:id/view`: Records a view on a story for the authenticated user.
   - `DELETE /api/stories/:id`: Deletes a story (creator or admin).
   - `GET /api/stories/:id/views`: Retrieves view receipts and viewer list for story creator.
5. **`StorageModule`** (`/api/storage`):
   - `POST /api/storage/presigned-url`: Generates S3/R2 presigned upload URL and public URL.
6. **`BullMqModule`** (`apps/api/src/bullmq/`):
   - Registers `video-processing` and `notifications` queues connecting to Redis.

---

## 5. Background Worker (`apps/worker`)

- Entry point: `apps/worker/src/index.ts`.
- Subscribes to BullMQ queues on Redis:
  - **`video-processing`**: Skeleton worker returning `{ status: 'completed' }` (FFmpeg transcoding placeholder).
  - **`notifications`**: Dispatches logs for `notification:new_follower`, `notification:follow_request`, `notification:follow_accepted`, `notification:verification_approved`, `notification:verification_rejected`. (Push notification delivery via Web Push/FCM is not yet connected).
  - **`stories`**: Worker executing `story:cleanup_expired` job to purge expired stories from PostgreSQL.

---

## 6. Frontend Architecture (`apps/web`)

### Providers & Layout
- Root layout (`apps/web/app/layout.tsx`) wraps the app in `AppProviders`:
  - `QueryProvider`: TanStack React Query client with 5-minute stale time.
  - `AuthProvider`: Auth state, user session synchronization, login/signup/logout, and dev fallback mode.
  - `SocketProvider`: Connects to `process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'`.
- Inner app layout (`apps/web/app/(app)/layout.tsx`):
  - Wraps views in `MobileShell` (fixed max-w-[430px] smartphone container) and renders `BottomTabBar`.

### Page Inventory & Status
| Route | File Path | Implementation Status | Data Source |
| :--- | :--- | :--- | :--- |
| `/splash` | `app/splash/page.tsx` | Functional | Redirects after 2s based on auth status |
| `/login` | `app/(auth)/login/page.tsx` | Functional | Calls API + localStorage dev fallback |
| `/signup` | `app/(auth)/signup/page.tsx` | Functional | Live username check, calls API |
| `/create-profile` | `app/(auth)/create-profile/page.tsx` | Functional | Step 2 onboarding, image cropper modal |
| `/` | `app/(app)/page.tsx` | Interactive UI Prototype | Integrated story circles linked to `/stories/[username]`, mock posts (`INITIAL_POSTS`) |
| `/stories` | `app/stories/page.tsx` | Functional | Full-screen story viewer default/query entrypoint (`?user=...`) |
| `/stories/[username]` | `app/stories/[username]/page.tsx` | Functional | Full-screen Instagram-style story viewer for target user |
| `/social` | `app/(app)/social/page.tsx` | Interactive UI Prototype | **Hardcoded mock chats, communities, bots, feed** |
| `/market` | `app/(app)/market/page.tsx` | Incomplete Stub | Static placeholder view |
| `/profile` | `app/(app)/profile/page.tsx` | Functional with Fallback | Calls API (`/api/users/:username`), falls back to `profile-mock-data.ts` |
| `/profile/[username]` | `app/(app)/profile/[username]/page.tsx` | Functional with Fallback | Calls API, falls back to `profile-mock-data.ts` |
| `/search` | `app/(app)/search/page.tsx` | Prototype | Filters client-side array `MOCK_SEARCH_USERS` in `lib/search-service.ts` |
| `/chat` | `app/chat/page.tsx` | Prototype | Renders `ChatView` |
| `/chat/[id]` | `app/chat/[id]/page.tsx` | Prototype | Hardcoded conversations in `chat-view.tsx`, simulated `setTimeout` replies |

### User Stories Architecture (`apps/web/components/story-viewer.tsx` & `lib/stories-data.ts`)
- **Full-Screen Dedicated Route**: Placed at `app/stories/[username]/page.tsx` outside `(app)` to prevent layout conflicts with `MobileShell` and `BottomTabBar`, presenting a dark immersive environment (`#060608`) with ambient desktop backdrop blur.
- **Auto-Progression & Segmented Timers**: Segmented progress bars with 60fps `requestAnimationFrame` animation loops, advancing automatically between stories and users.
- **Gestures & Controls**: Left/right tap zones, press-and-hold pause (with UI dimming), touch swipe gestures (down to close, left/right for adjacent users), and keyboard bindings (`Escape`, `ArrowLeft`, `ArrowRight`, `Space`).
- **Interactive Story Actions**: Quick emoji reaction bursts with float-up animations, message reply input with pause on focus, like heart toggle, and share link generator.
- **Data Layer**: Centralized in `apps/web/lib/stories-data.ts` exporting `USER_STORIES`, `getAllStoryGroups()`, `getStoryGroupByUsername()`, and `getAdjacentStoryUsers()`.

---

## 7. Confirmed Facts vs Assumptions

### Confirmed Facts
- Turborepo pipelines (`typecheck` across all 8 packages and 60 unit tests across 8 test suites in `apps/api`) compile and pass cleanly.
- Production builds succeed with zero errors across `@social/web` (all 14 static and dynamic routes), `@social/api`, and `@social/worker`.
- Authentication endpoints and session checks exist and are protected by Better Auth with database persistence in Prisma.
- The User Profile and Social Graph APIs (`UsersService`) are fully implemented on the backend with Redis-backed presence, popular post ranking, follow approval transactions, and verification management.
- The User Stories system is fully implemented end-to-end:
  - **Prisma Schema**: `Story` (with 24h `expiresAt`, `mediaType`, `duration`, `caption`, `location`, `linkText`, `linkUrl`) and `StoryView` (`[storyId, viewerId]` composite unique index for view receipts).
  - **REST API**: NestJS `StoriesModule` mounted at `/api/stories` providing `GET /feed`, `GET /user/:username`, `POST /`, `POST /:id/view`, `DELETE /:id`, and `GET /:id/views`.
  - **Background Worker**: BullMQ queue (`stories`) and worker in `apps/worker` executing `story:cleanup_expired` to purge expired stories from PostgreSQL.
  - **Typed API Client**: Extended `apiClient.stories` and exported `api` alias in `@social/web` with view receipt synchronization on story transition.
  - **Full-Screen Viewer**: Implemented at `app/stories/[username]/page.tsx` outside `(app)` shell, featuring 60fps segmented progress bar, tap/swipe/keyboard navigation, press-and-hold pause with UI dimming, quick emoji reactions, and reply input.
  - **Unit Test Coverage**: `apps/api/src/stories/stories.controller.spec.ts` testing all story endpoints and edge cases.
- Frontend profile viewing (`ProfileScreen`) is integrated with backend APIs but features built-in fallback to mock data when API calls fail or return no data.
- The home feed posts (`/`), social directory (`/social`), and search (`/search`) pages currently use static local mock datasets and do not call backend post or search APIs.

### Assumptions (Pending Backend / Database Implementation)
- Future posts feed is expected to be served via API rather than static arrays in `app/(app)/page.tsx`.
- WebSocket real-time communication is assumed to be planned for chat and presence, as indicated by `SocketProvider` and `SocketEvents`, but no WebSocket gateway currently exists in `apps/api`.
- OpenSearch is intended for full-text search (defined in `docker-compose.yml`), but indexing pipelines and client queries have not yet been built.
- Notifications are planned for Web Push / FCM (environment variables in `.env`), but currently only log to stdout inside `apps/worker`.

---

## 8. Current Implementation Status vs Roadmap

According to `README.md` and codebase verification:
- [x] **Feature 0: Monorepo Foundation & Core Infrastructure** (Completed)
- [x] **Feature 1: Authentication & User Accounts** (Completed on backend and frontend auth flows)
- [x] **Feature 2: User Profiles & Follows System** (Completed on backend, profile UI integrated with mock fallback)
- [x] **Feature 2.5: Instagram-Style User Stories (Full-Stack Completed)** (Completed Prisma schema, REST endpoints, BullMQ cleanup worker, view receipts, dedicated full-screen viewer, segmented progress timer, touch/swipe/keyboard navigation, reactions, and feed integration)
- [ ] **Feature 3: Posts & Cloudflare R2 Media Uploads** (Backend has presigned URL service and schema; **missing Post CRUD endpoints and frontend post creation route**)
- [ ] **Feature 4: Comments & Likes System** (Schema lacks `Comment` and `Like` tables; **no backend endpoints; frontend is local UI state only**)
- [ ] **Feature 5: Activity Feed** (Feed algorithm, fan-out, and API endpoint not yet implemented)
- [ ] **Feature 6: Realtime Chat** (No WebSocket gateway in NestJS; no Chat/Message models in Prisma)
- [ ] **Feature 7: Video Processing Pipeline** (BullMQ queue exists; FFmpeg transcoding job handler is a stub)
- [ ] **Feature 8: Realtime & Push Notifications** (Worker logs to console; no Web Push or FCM dispatch)
- [ ] **Feature 9: Full-Text Search** (OpenSearch container configured; no backend service or synchronization)

---

## 9. Known Issues, Discrepancies & Gotchas

1. **Missing `/create` Route**:
   - The center "+" button in `apps/web/components/bottom-tab-bar.tsx` navigates to `/create`, but `apps/web/app/create/page.tsx` does not exist, triggering a 404.
2. **Missing Auth Utility Pages**:
   - `app/(auth)/login/page.tsx` links to `/forgot-password`.
   - `app/(auth)/signup/page.tsx` links to `/terms` and `/privacy`.
   - None of these routes are currently implemented.
3. **No NestJS WebSocket Gateway**:
   - `apps/web/providers/socket-provider.tsx` attempts to connect to `http://localhost:4000` via `socket.io-client`. Because no gateway is registered in `apps/api`, connection errors occur in the client console.
4. **Multiple PrismaClient Instances**:
   - `packages/database/src/index.ts` exports a singleton `prisma`.
   - `apps/api/src/users/users.service.ts` instantiates its own `new PrismaClient()`.
   - `apps/api/src/auth/auth.service.ts` instantiates another `new PrismaClient()`.
   - `apps/api/src/prisma/prisma.service.ts` instantiates a third `new PrismaClient()`.
   - *Impact:* Creates multiple connection pools to PostgreSQL rather than sharing a single pooled connection.
5. **PostgreSQL Port in Docker**:
   - `docker-compose.yml` maps PostgreSQL to host port `5433` (`5433:5432`), and `.env` specifies port `5433`. Ensure local development connects to port 5433 and not the standard 5432.
6. **Package Version Discrepancy**:
   - `better-auth` is specified as `^1.7.7` in `apps/api/package.json` and `^1.2.3` in `apps/web/package.json`.
7. **Debug Statement**:
   - `apps/web/app/chat/page.tsx` line 2 contains `console.log("changes 2 made here");`.

---

## 10. Developer Commands & Workflow

From the monorepo root:

```bash
# Install dependencies
npm install

# Run database schema push
npm run db:push

# Generate Prisma client
npm run db:generate

# Run full project typecheck across all workspaces
npm run typecheck

# Run tests (runs 8 test suites in apps/api)
npm run test

# Start development servers (Web on :3000, API on :4000, Worker concurrently)
npm run dev

# Or run individual workspaces
npm run dev --workspace=@social/web
npm run dev --workspace=@social/api
npm run dev --workspace=@social/worker
```

---

## 11. Git Branch & Verification Status

### Active Branch: `story_page`

### Recent Commits
1. `6eaaef3`: `add story page`
   - Added full-screen story viewer (`apps/web/components/story-viewer.tsx`).
   - Added Next.js dynamic story routes (`apps/web/app/stories/[username]/page.tsx` and `app/stories/page.tsx`).
   - Integrated story circles in home feed (`apps/web/app/(app)/page.tsx`) with creator story groups.
   - Added mock story dataset (`apps/web/lib/stories-data.ts`) with 9 creator profiles matching feed posts.
2. `7d94a97`: `feat(stories): complete backend API, database schema, and cleanup worker`
   - Added `Story` and `StoryView` models to `packages/database/prisma/schema.prisma`.
   - Added shared story types, DTOs, and Zod schemas in `packages/types` and `packages/validation`.
   - Built `StoriesModule` (`StoriesController`, `StoriesService`, DTOs) in `apps/api` with full CRUD, view recording, and feed queries.
   - Implemented BullMQ `storiesQueue` and `story:cleanup_expired` job in `apps/worker` to purge 24-hour expired stories.
   - Extended `apiClient.stories` and exported `api` in `apps/web/lib/api-client.ts`.
   - Added Jest unit tests for `StoriesController` (coverage for all 6 endpoints).

### Verification Matrix
- **Typecheck**: `npm run typecheck` passes cleanly across all 8 monorepo workspaces.
- **Unit Tests**: `npm run test` passes with 8/8 suites and 60/60 unit tests green.
- **Web Build**: `npm run build --workspace=@social/web` compiles all 14 static and dynamic routes.
- **API Build**: `npm run build --workspace=@social/api` compiles NestJS production bundle.
- **Worker Build**: `npm run build --workspace=@social/worker` compiles cleanly.

### Pending Infrastructure Step
- **Database Schema Push**: Once the PostgreSQL Docker container is running locally (`docker-compose up -d postgres` on port 5433), execute `npm run db:push` to sync the new `stories` and `story_views` tables with the live database.
