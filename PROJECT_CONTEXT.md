# Family Tree Project - Production Context

# Vision

**Family Tree** is a collaborative genealogy platform where families can privately build, manage, and verify family relationships together.

Each family operates inside its own isolated workspace called a **Tree Room**.

The platform is designed to:

* support collaborative editing
* preserve historical integrity
* prevent accidental data corruption
* remain simple enough for rapid development
* support a polished, emotionally warm family tree experience
* scale gradually without overengineering

This specification intentionally balances:

* clean architecture
* business practicality
* strong UX
* maintainability
* fast implementation speed

---

# Core Product Philosophy

The system follows these principles:

1. **Each family tree is isolated**

   * no data leakage between families

2. **Accounts and people are separate concepts**

   * a person can exist without an account
   * accounts may link to people later

3. **All important changes are reviewable**

   * relationship proposals require approval
   * edits are tracked

4. **Most users are non-technical**

   * UX must stay simple
   * family tree visualization must remain readable
   * core actions must be obvious for elders, children, and first-time users

5. **Avoid unnecessary enterprise complexity**

   * no microservices
   * no event buses initially
   * no CQRS
   * no premature abstractions

6. **Traditional family model for V1**

   * focus on two genders: male and female
   * prioritize parent, child, spouse, sibling, and adopted child relationships
   * support common remarriage/divorce cases without turning V1 into a full legal/genealogy edge-case engine

---

# Tech Stack

## Frontend

* TypeScript
* Next.js 14
* Tailwind CSS
* Framer Motion
* React Query / TanStack Query
* Axios
* Lucide React

## Backend

* TypeScript
* Fastify
* Zod validation
* Supabase Authentication

## Database

* Neo4j

## Optional Infrastructure (Phase 2)

* Redis
* BullMQ
* S3-compatible object storage

---

# Core Architecture

---

# 1. Authentication vs Identity vs Person

The system separates:

## A. UserAccount

Represents login/authentication identity.

Example:

* email
* password
* oauth login
* global user identity

A user account:

* can belong to multiple family trees
* may link to one or more people records

---

## B. Person

Represents a human being inside a family tree.

A person:

* may or may not have an account
* may be alive or deceased
* may be a ghost profile
* belongs to a specific tree

Examples:

* grandfather
* child
* deceased relative
* family member without internet access

---

## C. PersonAccountLink

Connects a UserAccount to a Person.

Used for:

* profile claiming
* merged ghost profiles
* editor permissions

---

# Tree Isolation Model

Every entity belongs to a tree.

All queries must include:

```ts
treeId
```

This prevents cross-tree contamination.

---

# Main Features

---

# 1. Family Tree Rooms

Users can:

* create family trees
* join existing trees
* belong to multiple trees
* start a tree from a guided setup wizard
* download/export a visual tree

Each tree contains:

* members
* people
* relationships
* permissions
* invitations
* audit history

---

# 2. Tree Roles

Roles are scoped per tree.

## Admin

Can:

* approve relationship proposals
* manage members
* manage permissions
* edit all profiles
* delete/archive relationships
* manage invitations

---

## Member

Can:

* view all profiles
* create people
* propose relationships
* edit permitted profiles
* claim profiles

Cannot:

* approve relationships
* manage roles

---

## Viewer

Read-only access.

---

# Role Hierarchy

```text
Admin > Member > Viewer
```

Higher roles automatically inherit lower permissions.

---

# 3. Person Types

Every person has a status:

```ts
type PersonStatus =
  | "active"
  | "ghost"
  | "merged"
  | "archived"
```

---

## Active Person

Real person currently represented in tree.

---

## Ghost Profile

Used for:

* children
* deceased relatives
* offline family members

Ghost profiles:

* have no login account
* can later be claimed

---

## Merged Person

Old ghost profile merged into real account-linked profile.

Kept only for history/audit references.

---

# 4. Permissions Model

Avoid storing raw arrays like:

```ts
editors: string[]
```

Instead use permission relationships.

---

## ProfilePermission

```ts
{
  personId
  userId
  permission: "owner" | "editor"
}
```

---

## Rules

### Admin

Can edit all profiles.

### Owner

Can fully edit profile.

### Editor

Can edit permitted fields.

### Viewer

Cannot edit.

---

# 5. Relationship System

Relationships are NOT created directly.

Instead:

## RelationshipProposal

```ts
{
  id
  treeId
  proposerId
  fromPersonId
  toPersonId
  relationshipType
  status
  createdAt
}
```

---

## Proposal Status

```ts
type ProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
```

---

## Workflow

1. Member proposes relationship
2. Admin reviews proposal
3. Admin approves/rejects
4. Approved proposal creates official relationship

---

# Official Relationships

Core relationship types:

* parent
* child
* spouse
* sibling
* adopted_child
* divorced_spouse

Every relationship includes:

```ts
{
  treeId
  createdBy
  approvedBy
  createdAt
}
```

---

# 6. Relationship Validation Rules

Before approval:

## Prevent:

* self-parenting
* ancestry cycles
* impossible ages
* duplicate relationships

---

## Example Checks

### Invalid:

* father younger than child
* person becomes own ancestor
* person assigned as both parent and child of the same person
* duplicate spouse relationship for the same marriage pair

### Optional Warnings:

* conflicting birth years
* multiple biological parents
* unusually large parent-child age gap
* sibling birth order conflicts

Warnings do NOT always block approval.

## Relationship Inference Rules

Approved relationships must update obvious connected family logic so users do not need to repeat tedious work.

Examples:

* If A is approved as parent of B, and B already has siblings C and D in the same sibling group, A should be proposed or applied as parent of C and D depending on admin policy.
* If A and B are approved as spouses and B is already a verified parent of child C, the system should suggest A as the other parent of C unless a conflicting parent already exists.
* If A and B are approved as siblings, verified parents of A should be suggested as parents of B, and verified parents of B should be suggested as parents of A.
* If a child relationship is approved, the inverse parent relationship must be represented consistently.
* If a spouse relationship is approved, the inverse spouse relationship must be represented consistently.

Do not silently create high-impact inferred relationships when there is ambiguity. Use admin-reviewable suggestions for cases involving remarriage, adoption, divorce, or conflicting existing parents.

---

# 7. Ghost Profile Claiming

Users can claim ghost profiles.

---

## Claim Flow

1. User requests claim
2. Admin reviews request
3. If approved:

   * account linked to person
   * user receives owner permission

---

# 8. Ghost Merge Flow

Sometimes:

* ghost profile already exists
* real user later joins separately

The user may choose:

## Option A

Keep both profiles linked.

## Option B

Merge profiles.

---

## Merge Rules

When merged:

* relationships move to real profile
* old ghost profile becomes:

  * `"merged"`
* old node remains for audit history

Never hard delete merged profiles.

---

# 9. Invitation System

Admins can generate invitation links.

---

# IMPORTANT SECURITY RULE

Public links are allowed ONLY for:

* Member
* Viewer

Admin invitations must be:

* email-specific
* manually approved
* revocable

Public admin invitation links are not allowed in V1.

---

# Invitation Types

## Member Invite Link

Requires admin approval.

---

## Viewer Invite Link

Requires admin approval.

---

## Admin Invite

Private email invitation only.

No public admin links.

---

# Invitation Token Structure

```ts
{
  token
  treeId
  role
  expiresAt
  createdBy
}
```

---

# Invitation Rules

## Existing Member

If user already has:

* same role
* higher role

Result: directly open tree

---

## Lower Role Upgrade

Example:

* Viewer clicks Member link

Result: creates upgrade request

Requires admin approval.

---

# 10. Dashboard

Single unified dashboard.

Shows:

* all joined trees
* role in each tree
* pending invitations
* pending approvals (admin only)
* recent activity
* quick actions to open tree, add relative, invite family, or review proposals

---

# 11. Notifications

Keep notifications simple initially.

## Notification Types

* relationship approved
* relationship rejected
* invitation accepted
* role changed
* claim approved
* merge completed

---

# Notification Structure

```ts
{
  id
  userId
  type
  read
  createdAt
}
```

---

# 12. Audit History

Track important actions.

This is REQUIRED.

---

## ActivityLog

```ts
{
  id
  treeId
  actorId
  actionType
  entityType
  entityId
  createdAt
}
```

---

## Logged Actions

Examples:

* relationship approved
* profile edited
* role changed
* merge completed
* invitation generated

---

# 13. Soft Delete Strategy

Never permanently delete important data.

Use:

```ts
deletedAt
deletedBy
```

Applies to:

* relationships
* profiles
* invitations

---

# 14. Privacy Controls

Sensitive fields should support visibility levels.

Example:

```ts
{
  phoneVisibility: "private" | "editors" | "tree"
}
```

Recommended fields:

* phone
* address
* email
* birth date

---

# Data Model Overview

---

# Nodes

## UserAccount

```ts
{
  id
  email
  name
  createdAt
}
```

---

## FamilyTree

```ts
{
  id
  name
  createdBy
  createdAt
}
```

---

## Person

```ts
{
  id
  treeId
  firstName
  lastName
  gender
  birthDate
  deathDate
  status
  createdAt
}
```

---

## RelationshipProposal

```ts
{
  id
  treeId
  proposerId
  relationshipType
  status
}
```

---

## Invitation

```ts
{
  id
  treeId
  role
  token
  expiresAt
}
```

---

## Notification

```ts
{
  id
  userId
  type
  read
}
```

---

## ActivityLog

```ts
{
  id
  treeId
  actorId
  actionType
}
```

---

# Relationships

## MEMBER_OF

```ts
role: "admin" | "member" | "viewer"
```

---

## HAS_PERMISSION

```ts
permission: "owner" | "editor"
```

---

## LINKED_TO_ACCOUNT

Connects Person and UserAccount.

---

## FAMILY_RELATIONSHIP

Examples:

* parent
* spouse
* sibling

---

# UI / UX Principles

---

# 1. Keep Tree Readable

Default UI should NOT be:

* free-form graph chaos

Preferred:

* layered family tree
* generation-based layout
* orthogonal connection lines
* full-screen tree mode
* easy visual export/download

---

# 2. Visual Status Badges

Every important state must be visible.

Examples:

| State    | Badge  |
| -------- | ------ |
| Pending  | Yellow |
| Verified | Green  |
| Ghost    | Gray   |
| Rejected | Red    |

---

# 3. Progressive Disclosure

Do not overwhelm users.

Advanced actions:

* hidden under menus
* shown only when relevant

---

# 4. Mobile-Friendly Navigation

Large trees should support:

* zoom
* collapse branches
* focus mode
* fit-to-screen
* search within tree
* mini-map or orientation aid where useful

---

# Visual Product Direction

The family tree should feel attractive, familiar, and welcoming across ages and cultures.

Use:

* a refined neutral canvas
* user-selectable background styles, similar in spirit to how messaging apps let users personalize chat backgrounds
* tasteful built-in background collections such as plain, paper, floral, geometric, heritage, celebration, and dark
* optional custom background upload where privacy and readability rules allow it
* clean cards with avatars, names, lifespan dates, and small status badges
* crisp high-contrast relationship lines
* tasteful color accents for status and relationship meaning

Background customization must never reduce readability. Person cards, relationship lines, and text remain the priority.

Avoid:

* admin-dashboard visuals as the main experience
* chaotic force-directed graphs
* decorative clutter that competes with names and relationship lines
* abstract visuals that make the family structure hard to understand

---

# Security Rules

---

# Required

## JWT Validation

All protected routes require auth.

---

## Tree Authorization

Every request must verify:

* user belongs to tree

---

## Rate Limiting

Protect:

* invitations
* login
* relationship creation

---

## Expiring Tokens

Invitation links expire.

Default:

```ts
7 days
```

---

# Validation Layer

All API inputs validated using:

* Zod

Never trust frontend types.

---

# API Design Principles

Use:

* REST APIs
* simple route structure
* predictable naming

Avoid:

* premature GraphQL
* over-abstracted services

---

# Suggested Backend Structure

```text
src/
  modules/
    auth/
    trees/
    people/
    relationships/
    invitations/
    notifications/
    audit/

  middleware/
  plugins/
  utils/
```

---

# Performance Considerations

Do NOT optimize prematurely.

But prepare for:

* subtree loading
* pagination
* lazy relationship expansion

Avoid loading entire huge trees at once.

---

# Phase 2 Features

Only after core system is stable.

---

## Planned Features

* PDF export
* photo uploads
* family event timeline
* CSV import
* GEDCOM import/export
* search & filtering
* relationship suggestions
* mobile optimization
* batch invitations

---

# Explicit Non-Goals (For Now)

Avoid building:

* AI relationship inference
* realtime collaboration
* microservices
* websocket synchronization
* complex workflow engines
* public tree discovery

Keep version 1 manageable.

---

# Final Product Direction

The system should feel:

* trustworthy
* family-friendly
* easy for non-technical users
* collaborative but controlled

The architecture should remain:

* scalable enough
* easy to reason about
* fast to build
* easy to vibe-code with AI tools

This specification intentionally prioritizes:

* clarity over cleverness
* maintainability over abstraction
* product usability over engineering vanity
