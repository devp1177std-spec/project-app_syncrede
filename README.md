# Production Social Media Application

A scalable, production-grade social media platform architecture built feature-by-feature using modern full-stack web and backend technologies.

## Tech Stack Overview

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15, React 19, TypeScript | Fast, SEO-friendly UI, App Router |
| **Styling & UI** | Tailwind CSS, shadcn/ui | Consistent, accessible design system |
| **Backend** | NestJS, TypeScript | REST APIs, business logic, WebSocket gateways |
| **Database** | PostgreSQL | Relational persistence |
| **ORM** | Prisma | Schema modeling & type-safe queries |
| **Cache & Realtime** | Redis, Socket.IO | Real-time chat/presence, fast session/feed caching |
| **Background Tasks** | BullMQ | Asynchronous job queues |
| **File Storage & CDN** | Cloudflare R2, Cloudflare CDN | S3-compatible media storage & fast edge delivery |
| **Video Processing** | FFmpeg (via BullMQ) | Asynchronous transcoding and thumbnail generation |
| **Search Engine** | OpenSearch | Full-text search for users, posts, and hashtags |
| **Authentication** | Firebase Authentication | User authentication & identity management |
| **Notifications** | Web Push, FCM | Real-time and push notifications |

---

## Monorepo Architecture

```text
social-media-app/
├── apps/
│   ├── web/               # Next.js 15 web client
│   ├── api/               # NestJS backend application
│   └── worker/            # BullMQ background worker service
│
├── packages/
│   ├── database/          # Prisma schema, migrations, database client
│   ├── types/             # Shared TypeScript types, Socket events, API responses
│   ├── config/            # Shared base tsconfig and lint rules
│   └── validation/        # Shared Zod validation schemas
│
├── docker-compose.yml     # Local PostgreSQL, Redis, and OpenSearch
├── turbo.json             # Turborepo build pipeline
└── package.json           # npm workspaces configuration
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v20 or v22+ (tested with v24)
- **npm**: v10+
- **Docker** *(Optional)*: For running local Postgres, Redis, and OpenSearch

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Local Infrastructure (Optional)
If running local database and cache services:
```bash
docker compose up -d
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Generate Database Client
```bash
npm run db:generate
```

### 6. Run the Application
Run all services simultaneously using Turbo:
```bash
npm run dev
```

Or run individual workspaces:
```bash
# Next.js Web App (http://localhost:3000)
npm run dev --workspace=@social/web

# NestJS API (http://localhost:4000/api)
npm run dev --workspace=@social/api

# BullMQ Worker
npm run dev --workspace=@social/worker
```

---

## Feature-by-Feature Roadmap
- [x] **Feature 0: Monorepo Foundation & Core Infrastructure**
- [ ] **Feature 1: Authentication & User Accounts (Firebase Authentication + NestJS Guards)**
- [ ] **Feature 2: User Profiles & Follows System**
- [ ] **Feature 3: Posts & Cloudflare R2 Media Uploads**
- [ ] **Feature 4: Comments & Likes System**
- [ ] **Feature 5: Activity Feed (Chronological & Algorithmic with Redis)**
- [ ] **Feature 6: Realtime Chat (Socket.IO + Redis)**
- [ ] **Feature 7: Video Processing Pipeline (BullMQ + FFmpeg)**
- [ ] **Feature 8: Realtime & Push Notifications (Socket.IO, Web Push, FCM)**
- [ ] **Feature 9: Full-Text Search (OpenSearch)**
