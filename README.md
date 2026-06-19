# Family Tree

A collaborative genealogy platform where families can privately build, manage, and verify family relationships together. Each family operates inside its own isolated **Tree Room** with role-based access control and a proposal-based relationship system.

---

## Features

- **Tree Rooms** — Each family tree is an isolated workspace with its own members, roles, and data.
- **Role-Based Access** — Admin, Member, and Viewer roles with granular permissions.
- **Relationship Proposals** — Members propose relationships; Admins review and approve. Prevents accidental data corruption and preserves historical integrity.
- **Relationship Validation** — Automatic cycle detection, age checks, duplicate prevention, and inverse relationship consistency.
- **Relationship Inference** — Approved relationships automatically suggest obvious derived relationships for admin review.
- **Tree Visualization** — Generation-based layered layout with orthogonal lines, zoom/pan, fit-to-screen, full-screen mode, and PNG/PDF export.
- **Person Profiles** — Detailed profiles with life events, media, status badges (active, ghost, merged, archived).
- **Ghost Profiles & Claiming** — Profiles for unregistered family members; users can claim and merge them.
- **Invitation System** — Public invite links (Member/Viewer) and private email-specific Admin invitations with expiry and revocation.
- **Access Requests** — Join and role-upgrade requests with admin approval workflow.
- **Audit Logging** — Append-only activity logs for all significant actions.
- **Notifications** — Real-time notifications for relationship status, invitations, claims, and role changes.
- **Soft Delete** — No permanent data loss; all deletions are reversible.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **State Management:** TanStack Query, local state
- **HTTP Client:** Axios
- **Animations:** Framer Motion
- **Icons:** Lucide React

### Backend
- **Framework:** Fastify
- **Language:** TypeScript
- **Validation:** Zod
- **Auth:** Supabase Authentication (JWT)

### Database
- **Neo4j** — Graph database for native relationship traversal, ancestry queries, and cycle detection.

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neo4j AuraDB or self-hosted

---

## Architecture

The system follows a **modular monolith** pattern — no microservices, no event buses, no premature abstractions.

### Key Design Principles

- **Tree Isolation:** Every entity is scoped by `treeId`. Cross-tree data leakage is impossible.
- **Account vs. Person:** `UserAccount` represents login identity; `Person` represents a human in a tree. They are linked via `PersonAccountLink`.
- **Proposal Workflow:** Relationships are never created directly. They flow through `Proposal → Approval → Official Relationship`.
- **Graph-Native Storage:** Neo4j stores people as nodes and relationships as edges, making ancestry traversal and cycle detection natural and efficient.

### Backend Module Structure

```
src/modules/
  auth/          — Authentication and JWT validation
  trees/         — Tree room management
  people/        — Person profiles, ghost profiles, claiming, merging
  relationships/ — Proposals, approvals, validation, inference
  invitations/   — Invite links, admin invitations, access requests
  notifications/ — In-app notifications
  audit/         — Append-only activity logging
```

### Frontend Structure

```
app/
  (auth)/      — Login, signup
  (dashboard)/ — Dashboard, tree viewer
  api/         — API routes
components/
  ui/          — Shared UI primitives
  layout/      — Layout components
  tree/        — Tree visualization renderer
  profile/     — Profile cards and drawers
  relationship/ — Relationship proposal UI
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project ([supabase.com](https://supabase.com))
- A Neo4j instance (local, AuraDB, or Docker)

### Backend Setup

```powershell
cd backend
cp .env.example .env
npm install
npm run dev
```

Configure `.env` with your Neo4j credentials and Supabase JWT secret.

API base: `http://localhost:3001/api`

### Frontend Setup

```powershell
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Configure `.env.local` with your Supabase project URL and anon key.

The app runs at `http://localhost:3000` and expects the backend at `http://localhost:3001/api`.

### Quick Testing

- **Backend auth token:** Use `MOCK:<userId>:<role>` (e.g., `MOCK:alice:admin`)
- **Frontend login:** Open `/login` and use a mock token like `alice` with role `admin`/`editor`/`viewer`

---

## API Overview

Base URL: `http://localhost:3001/api`

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /auth/signup` | No | Create account |
| `POST /auth/login` | No | Login |
| `POST /auth/signup-with-invitation` | No | Sign up via invite link |
| `GET /trees` | Yes | List user's trees |
| `POST /trees` | Yes | Create tree |
| `GET /trees/:treeId/people` | Yes | List people in tree |
| `POST /trees/:treeId/people` | Yes | Create person |
| `GET /trees/:treeId/people/:personId` | Yes | Get person details |
| `PUT /trees/:treeId/people/:personId` | Yes | Update person |
| `POST /trees/:treeId/relationships/proposals` | Yes | Propose relationship |
| `GET /trees/:treeId/relationships/proposals` | Yes | List proposals |
| `POST /trees/:treeId/relationships/proposals/:id/approve` | Yes (Admin) | Approve proposal |
| `POST /trees/:treeId/relationships/proposals/:id/reject` | Yes (Admin) | Reject proposal |
| `POST /trees/:treeId/invitations/generate` | Yes (Admin) | Generate invite link |
| `GET /invitations/:token` | No | Get invitation details |
| `POST /invitations/:token/accept` | Yes | Accept invitation |

All authenticated endpoints require `Authorization: Bearer <accessToken>`.

---

## Deployment

### Backend (Render)

The project includes `render.yaml` for Render Blueprint deployment. Key environment variables:

- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`

### Frontend (Vercel)

Connect the `frontend/` directory as a Vercel project. Set the same Supabase environment variables.

---

## Project Status

This project is actively developed and in production. See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for current progress and [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) for the full product vision.

### Core Systems — Complete

- [x] Authentication & Authorization
- [x] People & Profile Management
- [x] Ghost Profiles & Claiming
- [x] Relationship Proposal & Approval Workflow
- [x] Relationship Validation & Inference
- [x] Invitation System (public & private)
- [x] Access Requests & Role Upgrades
- [x] Audit Logging
- [x] Notifications
- [x] Tree Visualization (generation layout, zoom/pan, export)

### Roadmap

- Family memory features (timeline, albums, stories)
- GEDCOM import/export
- Mobile touch optimization
- Background theme customization
- Photo uploads
- CSV import
- Search & filtering

---

## Documentation

| File | Description |
|------|-------------|
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | Complete product vision, philosophy, and architecture decisions |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) | Detailed product requirements and user journeys |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design principles |
| [DB_SCHEMA.md](./DB_SCHEMA.md) | Neo4j schema (nodes, relationships, properties) |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | API contract specifications |
| [API_REFERENCE.md](./API_REFERENCE.md) | Endpoint reference |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | TypeScript and code style guidelines |
| [UX_SPEC.md](./UX_SPEC.md) | UI/UX specifications |
| [ROLE_HIERARCHY_GUIDE.md](./ROLE_HIERARCHY_GUIDE.md) | Role and permission details |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Implementation guide and patterns |
| [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) | Development phases |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Current implementation status |
| [FAMILY_TREE_UI_IMPLEMENTATION.md](./FAMILY_TREE_UI_IMPLEMENTATION.md) | Tree visualization implementation details |

---

## License

Private project — all rights reserved.
