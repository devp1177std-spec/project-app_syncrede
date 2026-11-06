# PROJECT CONTEXT: Social Media Platform Monorepo

## 1. Overview & Architecture

This repository is a TypeScript full-stack monorepo managed with **Turborepo** (`turbo` 2.11.7) and **npm workspaces** (`packageManager: npm@11.8.0`). It is structured feature-by-feature toward a production-grade social media and community marketplace application.

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
| **Monorepo Manager** | Turborepo (`turbo` ^2.11.7) | Build orchestration, typechecking, task pipeline |
| **Web Frontend** | Next.js 15.5.27, React 19, TypeScript | App Router, mobile-first shell layout (`MobileShell`), Edge route protection |
| **Frontend Styling** | Tailwind CSS 3.4.17, `clsx`, `tailwind-merge`, `tailwindcss-animate` | Utility-first styling with custom mobile viewport containers & animations |
| **Client State / Fetching** | `@tanstack/react-query` 5.66.0, `react-hook-form`, `zod` | Server state, optimistic updates, client schema validation |
| **API Backend** | NestJS 11 (`@nestjs/core`, `@nestjs/platform-express`) | Modular REST architecture, global interceptors, filters, pipes |
| **Database & ORM** | PostgreSQL 16, Prisma ORM (`@prisma/client` ^6.4.1) | Relational persistence, schema modeling, relation tables |
| **Authentication** | Firebase Authentication (`firebase` ^13.0.0, `firebase-admin` ^14.5.0) | Client SDK for Google Sign-In & email/password; server session cookies (`__session`) via route handlers; Edge middleware protection; Firebase Admin ID token verification on API |
| **Cache & In-Memory Store** | Redis (`ioredis` ^5.11.1), Docker Redis 7 | User presence, rate limit storage, popular post ZSET ranking, sets |
| **Background Queue** | BullMQ (`bullmq` ^5.81.5), `@nestjs/bullmq` | Asynchronous job dispatching and worker service |
| **Storage / Media** | AWS SDK S3 (`@aws-sdk/client-s3`, presigner) | Presigned upload/download URLs for Cloudflare R2 / S3 / MinIO |
| **Logging & Docs** | `nestjs-pino`, `pino-pretty`, `@nestjs/swagger` | Structured logging with request IDs, OpenAPI at `/api/docs` |
| **Testing** | Jest 29 (`ts-jest`), Node test runner, Playwright E2E | 8 test suites (64 unit tests) in `apps/api`, 1 test suite (10 unit tests) in `apps/web` (total 74 unit tests), plus automated Playwright E2E suite (`apps/web/tests-e2e/`) |

---

## 3. Database Schema (`packages/database/prisma/schema.prisma`)

The database provider is **PostgreSQL** (`DATABASE_URL`). Better Auth legacy tables (`Session`, `Account`, `Verification`) have been completely removed. Active models confirmed in schema:

- **`User` (`users`)**: Primary identity model. Includes `email`, `username`, `displayUsername`, `bio`, `location`, `website`, `isVerified`, `isPrivate`, `role` (`"user"` | `"admin"`), counters (`followerCount`, `followingCount`, `postCount`), and onboarding tracking (`termsAcceptedAt`, `termsVersion`, `onboardingCompletedAt`, `onboardingSkipped`). Synchronized with Firebase Authentication UID.
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

*Note on migrations:* `packages/database/prisma/` contains `schema.prisma`. Schema synchronization is currently performed via `npm run db:push`.

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
   - Full Firebase Admin integration: `AuthService` initializes `adminAuth` via service account JSON, environment credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), or Google Application Default Credentials.
   - `AuthService.validateRequest()`: Decodes and verifies incoming Firebase Bearer ID tokens (`adminAuth.verifyIdToken()`), auto-creates or links users in the PostgreSQL `User` table, and returns user/session context.
   - Guards: `AuthGuard` (token verification & user injection), `OptionalAuthGuard` (optional viewer token injection), `RolesGuard` (`@Roles('admin')`).
   - Test suite: `apps/api/src/auth/auth.service.spec.ts` testing credentials initialization, token validation, user linkage, and unauthorized error paths.
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
   - Registers `video-processing`, `notifications`, and `stories` queues connecting to Redis.

---

## 5. Background Worker (`apps/worker`)

- Entry point: `apps/worker/src/index.ts`.
- Subscribes to BullMQ queues on Redis:
  - **`video-processing`**: Skeleton worker returning `{ status: 'completed' }` (FFmpeg transcoding placeholder).
  - **`notifications`**: Dispatches logs for `notification:new_follower`, `notification:follow_request`, `notification:follow_accepted`, `notification:verification_approved`, `notification:verification_rejected`. (Push notification delivery via Web Push/FCM is not yet connected).
  - **`stories`**: Worker executing `story:cleanup_expired` job to purge expired stories from PostgreSQL.

---

## 6. Frontend Architecture (`apps/web`)

### Providers, Middleware & Auth Architecture
- **Root Layout** (`apps/web/app/layout.tsx`):
  - `QueryProvider`: TanStack React Query client with 5-minute stale time.
  - `AuthProvider` (`apps/web/providers/auth-provider.tsx`):
    - Subscribes to Firebase `onIdTokenChanged(auth)` to observe login state, tokens, and credentials.
    - Synchronizes HTTP-only session cookie via `/api/auth/session` (with CSRF prevention).
    - Exposes `loginWithCredentials`, `signUp`, `loginWithGoogle`, `sendPasswordReset`, `updateProfile`, and `logout`.
    - Handles friendly Firebase error translation via `formatFirebaseAuthError` (`apps/web/lib/firebase/errors.ts`).
  - `SocketProvider`: Connects to `process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'`.
- **Edge Route Protection** (`apps/web/middleware.ts`):
  - Checks for the presence of the `__session` cookie.
  - Redirects unauthenticated requests targeting protected routes (`/`, `/profile`, `/create-profile`, `/chat`, `/market`, `/social`, `/stories`) to `/login?redirect={targetPath}`.
  - Redirects already-authenticated visitors navigating to `/login` or `/signup` back to home (`/`).
  - Whitelists `/splash`, `/login`, `/signup`, `/forgot-password`, static assets, and auth API routes.
- **Auth Session Route Handlers**:
  - `POST /api/auth/session`: Validates CSRF headers (`origin`/`host` match or `x-requested-with`), verifies ID token with Firebase Admin, creates a 5-day session cookie, and sets `httpOnly`, `sameSite: 'lax'`, `secure` cookie.
  - `POST /api/auth/logout`: Revokes user refresh tokens via Firebase Admin and clears the `__session` cookie.
- **API Client** (`apps/web/lib/api-client.ts`):
  - `fetchApi` automatically retrieves current user Firebase ID token via `auth.currentUser.getIdToken()`.
  - Automatically handles 401 Unauthorized responses by force-refreshing the Firebase ID token and re-trying the request once.

### Core UI Components
1. **`PostCard`** (`apps/web/components/post-card.tsx`):
   - Modular, memoized post component for the home feed.
   - Author header: Creator avatar, username, verified badge, location, timestamp, and follow toggle button.
   - Three-dot dropdown menu:
     - **Report Content**: Launches the `ReportBottomSheet` modal for user feedback.
     - **Not Interested in This Content**: Immediately covers the post with an accessible black translucent overlay (`bg-black/80`), notifies the user, and initiates a 3-second auto-removal animation smoothly collapsing the card height.
   - Double-tap on image to like with floating animated heart icon.
   - Action bar: Like (heart), Comment (speech bubble), Send (share), Bookmark/Save.
   - Like counter with preview user attribution (`including @username`).
   - Caption with clickable `#hashtags` that filter the home feed.
   - "View all X comments" opening the interactive comments drawer.
2. **`ReportBottomSheet`** (`apps/web/components/report-bottom-sheet.tsx`):
   - Accessible modal bottom sheet for content moderation reporting.
   - Prevents background body scrolling and handles `Escape` key dismissal.
   - Validates report reason input before submitting feedback.
3. **`StoryViewer`** (`apps/web/components/story-viewer.tsx`):
   - Dedicated full-screen Instagram-style story viewer outside the `MobileShell` layout.
   - Top-left back button (`ChevronLeft`) in both the active story author bar and the invalid-user fallback state.
   - Smart referrer-aware history detection (`hasInAppHistoryRef`): uses `router.back()` if navigation started within the app, falling back cleanly to `/` when opened directly.
   - Mobile safe area support with `calc(env(safe-area-inset-top, 0px) + ...)`.
   - Instant image load check for pre-cached or completed images.
   - 60fps segmented progress bar, tap/swipe navigation, press-and-hold pause with UI dimming, quick emoji reactions, and reply input.

### Page Inventory & Status
| Route | File Path | Implementation Status | Data Source / Notes |
| :--- | :--- | :--- | :--- |
| `/splash` | `app/splash/page.tsx` | Functional | Redirects after 2s based on auth status |
| `/login` | `app/(auth)/login/page.tsx` | Functional | Firebase email/password & Google Sign-In with Zod validation |
| `/signup` | `app/(auth)/signup/page.tsx` | Functional | Firebase registration, live username check, error translation |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Functional | Firebase password reset email dispatch with success confirmation |
| `/create-profile` | `app/(auth)/create-profile/page.tsx` | Functional | Step 2 onboarding, image cropper modal |
| `/api/auth/session` | `app/api/auth/session/route.ts` | Functional | Server-side Firebase session cookie generation with CSRF check |
| `/api/auth/logout` | `app/api/auth/logout/route.ts` | Functional | Revokes refresh tokens and clears `__session` cookie |
| `/` | `app/(app)/page.tsx` | Interactive UI Prototype | Integrated story circles, "For you" / "Following" tabs, SearchBar filter, `PostCard` list, "Not Interested" dismissal, `ReportBottomSheet`, and interactive comments drawer |
| `/stories` | `app/stories/page.tsx` | Functional | Full-screen story viewer default/query entrypoint (`?user=...`) |
| `/stories/[username]` | `app/stories/[username]/page.tsx` | Functional | Full-screen Instagram-style story viewer with back button & gestures |
| `/social` | `app/(app)/social/page.tsx` | Interactive UI Prototype | Hardcoded mock chats, communities, bots, feed |
| `/market` | `app/(app)/market/page.tsx` | Incomplete Stub | Static placeholder view |
| `/profile` | `app/(app)/profile/page.tsx` | Functional with Fallback | Calls API (`/api/users/:username`), falls back to `profile-mock-data.ts` |
| `/profile/[username]` | `app/(app)/profile/[username]/page.tsx` | Functional with Fallback | Calls API, falls back to `profile-mock-data.ts` |
| `/search` | `app/(app)/search/page.tsx` | Prototype | Filters client-side array `MOCK_SEARCH_USERS` in `lib/search-service.ts` |
| `/chat` | `app/chat/page.tsx` | Prototype | Renders `ChatView` |
| `/chat/[id]` | `app/chat/[id]/page.tsx` | Prototype | Hardcoded conversations in `chat-view.tsx`, simulated `setTimeout` replies |

---

## 7. Confirmed Facts vs Assumptions

### Confirmed Facts
- Turborepo pipelines (`npm run typecheck` across all 8 packages) compile with zero errors.
- Unit test suite: 74 unit tests green (64 unit tests across 8 suites in `@social/api`, 10 unit tests in `@social/web`).
- Production builds succeed with zero errors across `@social/web` (all 17 static and dynamic routes + edge middleware), `@social/api`, and `@social/worker`.
- Firebase Authentication is fully integrated across web frontend, Next.js server session cookies/middleware, and NestJS API backend (`adminAuth.verifyIdToken()`).
- Legacy Better Auth dependencies and Prisma models (`Session`, `Account`, `Verification`) have been completely removed.
- Home feed posts on `/` are modularized with `PostCard`, double-tap likes, comments drawer, hashtag click filtering, "Not Interested" dismissal overlay with 3-second animated removal, and `ReportBottomSheet` content moderation.
- The User Stories system is fully implemented end-to-end:
  - **Prisma Schema**: `Story` (with 24h `expiresAt`, `mediaType`, `duration`, `caption`, `location`, `linkText`, `linkUrl`) and `StoryView` (`[storyId, viewerId]` composite unique index for view receipts).
  - **REST API**: NestJS `StoriesModule` mounted at `/api/stories` providing `GET /feed`, `GET /user/:username`, `POST /`, `POST /:id/view`, `DELETE /:id`, and `GET /:id/views`.
  - **Background Worker**: BullMQ queue (`stories`) and worker in `apps/worker` executing `story:cleanup_expired` to purge expired stories from PostgreSQL.
  - **Typed API Client**: Extended `apiClient.stories` and exported `api` alias in `@social/web` with view receipt synchronization on story transition.
  - **Full-Screen Viewer**: Implemented at `app/stories/[username]/page.tsx` outside `(app)` shell, featuring top-left back navigation with smart history detection, safe-area insets, 60fps segmented progress bar, tap/swipe/keyboard navigation, press-and-hold pause with UI dimming, quick emoji reactions, and reply input.
- Automated E2E testing framework with Playwright CLI (`apps/web/tests-e2e/`) verifies route protection, login, signup, password reset, and visual viewports across mobile and desktop.

### Assumptions (Pending Backend / Database Implementation)
- Future posts feed is expected to be served via API rather than static arrays in `app/(app)/page.tsx`.
- WebSocket real-time communication is assumed to be planned for chat and presence, as indicated by `SocketProvider` and `SocketEvents`, but no WebSocket gateway currently exists in `apps/api`.
- OpenSearch is intended for full-text search (defined in `docker-compose.yml`), but indexing pipelines and client queries have not yet been built.
- Notifications are planned for Web Push / FCM (environment variables in `.env`), but currently only log to stdout inside `apps/worker`.

---

## 8. Current Implementation Status vs Roadmap

According to `README.md` and codebase verification:
- [x] **Feature 0: Monorepo Foundation & Core Infrastructure** (Completed)
- [x] **Feature 1: Authentication & User Accounts** (Completed with Firebase Auth on client, Edge middleware, server session cookies, password reset, NestJS token verification, and 3-state onboarding flow with database persistence: COMPLETED, SKIPPED, NOT_COMPLETED)
- [x] **Feature 2: User Profiles & Follows System** (Completed on backend, profile UI integrated with mock fallback)
- [x] **Feature 2.5: Instagram-Style User Stories (Full-Stack Completed)** (Completed Prisma schema, REST endpoints, BullMQ cleanup worker, view receipts, dedicated full-screen viewer, segmented progress timer, touch/swipe/keyboard navigation, reactions, feed integration, back navigation, and safe-area insets)
- [ ] **Feature 3: Posts & Cloudflare R2 Media Uploads** (Frontend feed features modular `PostCard`, double-tap likes, comments drawer, report flow, hashtag filtering, and "Not Interested" dismissal; backend has presigned URL service and Prisma `Post`/`PostMedia` models. **Backend Post CRUD endpoints and frontend `/create` page remain pending**)
- [ ] **Feature 4: Comments & Likes System** (Frontend has interactive UI state in `PostCard` & comments drawer; **database tables and backend endpoints not yet implemented**)
- [ ] **Feature 5: Activity Feed** (Feed algorithm, fan-out, and API endpoint not yet implemented)
- [ ] **Feature 6: Realtime Chat** (No WebSocket gateway in NestJS; no Chat/Message models in Prisma)
- [ ] **Feature 7: Video Processing Pipeline** (BullMQ queue exists; FFmpeg transcoding job handler is a stub)
- [ ] **Feature 8: Realtime & Push Notifications** (Worker logs to console; no Web Push or FCM dispatch)
- [ ] **Feature 9: Full-Text Search** (OpenSearch container configured; no backend service or synchronization)

---

## 9. Known Issues, Discrepancies & Gotchas

1. **Missing `/create` Route**:
   - The center "+" button in `apps/web/components/bottom-tab-bar.tsx` navigates to `/create`, but `apps/web/app/create/page.tsx` does not exist, triggering a 404.
2. **Missing Auth Legal Links**:
   - `app/(auth)/signup/page.tsx` links to `/terms` and `/privacy`. Neither route is currently implemented.
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
6. **Firebase Environment Variables**:
   - Production operation requires Firebase project credentials (`NEXT_PUBLIC_FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` or service account JSON). Build-time stub defaults are provided in `client.ts` and `admin.ts` to allow static prerendering without crashing.
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

# Run unit tests across all workspaces (64 in apps/api, 10 in apps/web)
npm run test

# Run Next.js production build across workspaces
npm run build

# Start development servers (Web on :3000, API on :4000, Worker concurrently)
npm run dev

# Or run individual workspaces
npm run dev --workspace=@social/web
npm run dev --workspace=@social/api
npm run dev --workspace=@social/worker
```

---

## 11. Git Branch & Verification Status

### Active Branch: `menu/reportcntent`

### Recent Commits
1. `5aec364`: `report for each content in homepage`
   - Modularized home feed with `PostCard` (`apps/web/components/post-card.tsx`).
   - Implemented three-dot post menu with "Report Content" and "Not Interested in This Content".
   - Created `ReportBottomSheet` (`apps/web/components/report-bottom-sheet.tsx`) for user reporting with category/reason validation and feedback toast.
   - Built "Not Interested" dismissal with black translucent overlay (`bg-black/80`), 3-second auto-removal, and smooth card height collapse.
   - Added interactive double-tap like with animated heart icon, hashtag click filtering, and comments drawer in `page.tsx`.
   - Introduced comprehensive Playwright E2E testing suite in `apps/web/tests-e2e/` with route protection verification, form validation, and desktop/mobile screenshots.
2. `9bca3bc`: `firebase auth integration`
   - Migrated authentication completely from Better Auth to Firebase Authentication.
   - Removed Better Auth models (`Session`, `Account`, `Verification`) from `packages/database/prisma/schema.prisma`.
   - Built Firebase Client SDK (`apps/web/lib/firebase/client.ts`) with Google Sign-In and emulator support.
   - Built Firebase Admin SDK (`apps/web/lib/firebase/admin.ts`, `apps/api/src/auth/auth.service.ts`).
   - Implemented server session cookie handling (`/api/auth/session`, `/api/auth/logout`, `apps/web/lib/firebase/server-auth.ts`).
   - Added Next.js Edge route guard `middleware.ts` protecting private routes.
   - Implemented `/forgot-password` (`apps/web/app/(auth)/forgot-password/page.tsx`) with form validation and reset email dispatch.
   - Updated `apps/api` `AuthService`, `AuthGuard`, `OptionalAuthGuard` with Firebase token validation and PostgreSQL user linkage.
   - Added unit test suites for Firebase errors (`apps/web/lib/firebase/errors.test.ts`) and API auth (`apps/api/src/auth/auth.service.spec.ts`).
3. `cc3a7bd`: `docs: update implementation status and branch verification in PROJECT_CONTEXT.md`
4. `7d94a97`: `feat(stories): complete backend API, database schema, and cleanup worker`
5. `6eaaef3`: `add story page`

### Working Copy Modifications (`apps/web/components/story-viewer.tsx`)
- Added top-left back button (`ChevronLeft`) with touch-friendly hit target in both story author header and invalid-user fallback screen.
- Implemented smart in-app referrer/history detection (`hasInAppHistoryRef`): uses `router.back()` if navigation started inside the app, falling back to `/` if accessed directly.
- Added mobile safe area padding: `calc(env(safe-area-inset-top, 0px) + ...)`.
- Added instant completion check for cached/pre-loaded images.

### Verification Matrix
- **Typecheck**: `npm run typecheck` passes cleanly across all 8 monorepo workspaces.
- **Unit Tests**: `npm run test` passes with 74/74 unit tests green (64 tests in `apps/api`, 10 tests in `apps/web`).
- **Web Build**: `npm run build --workspace=@social/web` compiles all 17 static/dynamic routes and edge middleware.
- **API Build**: `npm run build --workspace=@social/api` compiles NestJS production bundle cleanly.
- **Worker Build**: `npm run build --workspace=@social/worker` compiles cleanly.
- **E2E Tests**: Playwright test suite in `apps/web/tests-e2e/` passes route protection, authentication, and form validation tests.
