# ARCHITECTURE.md

# Family Tree Application Architecture

## Core Philosophy

The application prioritizes:

* simplicity over cleverness
* maintainability over abstraction
* product usability over engineering vanity
* modular architecture without overengineering
* production realism

The system is intentionally designed as a modular monolith.

We are NOT building:

* microservices
* CQRS
* event sourcing
* websocket infrastructure
* distributed systems
* generic enterprise frameworks

---

# High-Level System Architecture

## Frontend

### Stack

* Next.js 14 App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* TanStack Query
* Axios

### Responsibilities

Frontend handles:

* rendering
* client-side interactions
* optimistic UI where safe
* authentication session persistence
* tree visualization
* API communication

Frontend must NOT contain:

* business logic duplication
* authorization logic
* validation-only-on-client

---

## Backend

### Stack

* Fastify
* TypeScript
* Zod
* Supabase JWT validation
* Neo4j driver

### Responsibilities

Backend handles:

* authentication validation
* authorization
* business rules
* relationship validation
* tree isolation
* data integrity
* audit logging

---

## Database

### Neo4j

Neo4j is the source of truth.

Reason:
Family relationships are graph-native.

Neo4j handles:

* ancestry traversal
* relationship discovery
* cycle detection
* multi-hop queries
* subtree expansion

---

# Architecture Principles

## 1. Modular Monolith

The backend uses feature-based modules.

Example:

```text
src/modules/
  auth/
  trees/
  people/
  relationships/
  invitations/
  notifications/
  audit/
```

Each module contains:

* routes
* controller
* service
* repository
* schemas
* types

---

# 2. Clear Layer Responsibilities

## Route Layer

Responsibilities:

* request parsing
* auth middleware
* validation
* calling services

Must NOT:

* contain business logic
* contain database logic

---

## Service Layer

Responsibilities:

* business logic
* authorization checks
* orchestration
* workflow management

Must NOT:

* contain HTTP-specific logic

---

## Repository Layer

Responsibilities:

* Neo4j queries
* persistence logic

Must NOT:

* contain business decisions

---

# 3. Authentication vs Authorization

## Authentication

Handled by:

* Supabase JWT

Purpose:

* identify user

---

## Authorization

Handled internally.

Purpose:

* verify tree membership
* verify permissions
* verify roles

All protected operations must verify:

```ts
user belongs to tree
```

---

# 4. Tree Isolation

Every entity belongs to:

```ts
treeId
```

All database queries must scope by:

```ts
treeId
```

This is mandatory.

Never query globally unless explicitly required.

---

# 5. Person Architecture

## UserAccount

Represents:

* authentication identity
* global user

---

## Person

Represents:

* a human being in a family tree

A person may:

* have account
* not have account
* be deceased
* be ghost profile

---

## PersonAccountLink

Connects:

```text
UserAccount <-> Person
```

Used for:

* profile claims
* merges
* ownership

---

# 6. Relationship Architecture

Relationships are NOT directly created.

Flow:

```text
Proposal -> Approval -> Official Relationship
```

Reason:

* prevents corruption
* allows moderation
* improves trust

---

# 7. Permission System

Avoid raw arrays.

Do NOT use:

```ts
editors: string[]
```

Use graph relationships:

```text
(User)-[:HAS_PERMISSION]->(Person)
```

Permissions:

* owner
* editor

---

# 8. Soft Delete Strategy

Never hard delete critical data.

Use:

```ts
deletedAt
deletedBy
```

Applies to:

* people
* relationships
* invitations

---

# 9. Audit Logging

All important actions must create activity logs.

Examples:

* relationship approved
* profile edited
* role changed
* merge completed

Audit logs are append-only.

---

# 10. Frontend Architecture

## App Router Structure

```text
app/
  (auth)/
  (dashboard)/
  api/
```

---

## Component Structure

```text
components/
  ui/
  layout/
  tree/
  profile/
  relationship/
```

---

## State Management

Preferred:

* TanStack Query
* local component state

Avoid global state unless necessary.

Use Zustand ONLY if truly needed.

---

# 11. Tree Visualization Philosophy

The tree is the soul of the product.

Do NOT:

* build generic graph visualizer
* build node chaos
* build engineering dashboard

Preferred:

* generation-based layout
* clean relationship lines
* subtree collapse
* readable spacing
* smooth zoom/pan

UX goals:

* emotional
* warm
* understandable
* family-oriented

---

# 12. Performance Philosophy

Do NOT prematurely optimize.

But support:

* subtree loading
* lazy expansion
* pagination
* memoization where useful

Avoid:

* loading massive trees entirely

---

# 13. Security Principles

Must include:

* JWT validation
* route protection
* role validation
* tree authorization
* invitation expiry
* rate limiting

Never trust frontend.

All validation happens on backend.

---

# 14. Error Handling

Use centralized error handling.

Errors should:

* be typed
* predictable
* user-friendly
* non-leaking

Avoid exposing internal stack traces.

---

# 15. Non-Goals

We are NOT implementing initially:

* realtime sync
* collaborative cursors
* AI inference systems
* public social network features
* complex workflow engines

Keep V1 focused and shippable.