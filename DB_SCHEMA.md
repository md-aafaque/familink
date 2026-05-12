# DB_SCHEMA.md

# Database Schema

# Database

Neo4j

---

# Node Types

# UserAccount

Represents authenticated user.

## Properties

```ts
{
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: string
}
```

---

# FamilyTree

Represents isolated family workspace.

## Properties

```ts
{
  id: string
  name: string
  createdBy: string
  createdAt: string
}
```

---

# Person

Represents a human inside a family tree.

## Properties

```ts
{
  id: string
  treeId: string
  firstName: string
  lastName?: string
  gender?: string
  birthDate?: string
  deathDate?: string
  status: "active" | "ghost" | "merged" | "archived"
  createdBy: string
  createdAt: string
  deletedAt?: string
  deletedBy?: string
}
```

---

# RelationshipProposal

Pending relationship awaiting approval.

## Properties

```ts
{
  id: string
  treeId: string
  proposerId: string
  fromPersonId: string
  toPersonId: string
  relationshipType: string
  status: "pending" | "approved" | "rejected"
  rejectionReason?: string
  createdAt: string
}
```

---

# Notification

## Properties

```ts
{
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}
```

---

# Invitation

## Properties

```ts
{
  id: string
  treeId: string
  role: "member" | "viewer"
  token: string
  expiresAt: string
  createdBy: string
  createdAt: string
}
```

---

# ActivityLog

## Properties

```ts
{
  id: string
  treeId: string
  actorId: string
  actionType: string
  entityType: string
  entityId: string
  createdAt: string
}
```

---

# Relationship Types

# MEMBER_OF

```ts
{
  role: "admin" | "member" | "viewer"
  joinedAt: string
}
```

---

# HAS_PERMISSION

```ts
{
  permission: "owner" | "editor"
  grantedAt: string
}
```

---

# LINKED_TO_ACCOUNT

Links:

```text
(Person) -> (UserAccount)
```

---

# FAMILY_RELATIONSHIP

Official approved family relationship.

## Properties

```ts
{
  type: string
  treeId: string
  createdBy: string
  approvedBy: string
  createdAt: string
  deletedAt?: string
}
```

---

# CLAIM_REQUEST

## Properties

```ts
{
  status: "pending" | "approved" | "rejected"
  createdAt: string
}
```

---

# Important Rules

## Rule 1

Every query must scope by:

```ts
treeId
```

---

## Rule 2

Never hard delete important data.

---

## Rule 3

All relationship creation flows through proposals.

---

## Rule 4

Admins override profile permissions.

---

## Rule 5

Merged profiles remain for audit history.
