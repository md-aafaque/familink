# CODING_STANDARDS.md

# Coding Standards

## General Principles

Code must be:

* readable
* maintainable
* predictable
* typed
* modular

Optimize for:

* future maintainers
* debugging simplicity
* production reliability

NOT for:

* cleverness
* abstraction addiction
* one-line magic

---

# TypeScript Rules

## REQUIRED

* strict mode enabled
* no any
* explicit types for public APIs
* use shared types
* prefer inferred local types

---

## Avoid

```ts
any
unknown abuse
massive union chaos
```

---

# Naming Conventions

## Files

Use:

```text
kebab-case.ts
```

Examples:

* create-tree.ts
* relationship-service.ts

---

## Components

Use:

```text
PascalCase
```

Examples:

* TreeCard
* ProfileModal

---

## Variables

Use:

```ts
camelCase
```

---

## Constants

Use:

```ts
UPPER_SNAKE_CASE
```

---

# React Standards

## Component Size

Avoid giant components.

Preferred:

* under 250 lines

Extract:

* hooks
* subcomponents
* utilities

---

## Server vs Client Components

Prefer server components.

Use client components ONLY when needed.

Examples:

* forms
* animations
* interactivity

---

## Hooks

Custom hooks should:

* encapsulate logic
* avoid duplicated state handling

Examples:

* useCurrentTree
* useRelationshipProposals

---

# Styling Standards

## Use Tailwind

Avoid:

* inline styles
* arbitrary chaos
* inconsistent spacing

---

## Design Philosophy

UI should feel:

* warm
* premium
* spacious
* calm

---

## Animations

Use Framer Motion subtly.

Avoid:

* excessive animations
* distracting transitions

---

# API Standards

## Validation

ALL request bodies validated using:

* Zod

No exceptions.

---

## Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "message": "Readable message"
  }
}
```

---

# Database Standards

## Queries

Keep Neo4j queries:

* readable
* parameterized
* modular

Avoid giant Cypher files.

---

## Tree Isolation

Every query must include:

```ts
treeId
```

unless intentionally global.

---

# Security Standards

## Never Trust Frontend

Backend validates:

* auth
* roles
* permissions
* ownership

---

## Sensitive Data

Never expose:

* internal IDs unnecessarily
* stack traces
* secrets

---

# Error Handling

Use typed errors.

Examples:

* UnauthorizedError
* ForbiddenError
* ValidationError
* NotFoundError

---

# Logging Standards

Log:

* important actions
* failures
* security issues

Do NOT log:

* passwords
* tokens
* secrets

---

# Git Standards

## Commit Messages

Use:

```text
feat:
fix:
refactor:
chore:
```

Examples:

* feat: add relationship proposal approval flow
* fix: prevent ancestry cycle creation

---

# Testing Philosophy

Priority:

* critical business logic
* permission logic
* relationship validation

Avoid over-testing trivial UI.

---

# Performance Standards

Avoid:

* unnecessary rerenders
* huge payloads
* loading entire trees

Prefer:

* pagination
* lazy loading
* memoization where useful

---

# Accessibility Standards

Must include:

* keyboard navigation
* semantic HTML
* proper labels
* focus states
* sufficient contrast

---