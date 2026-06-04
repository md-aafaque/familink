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
  displayName?: string
  gender?: string
  birthDate?: string
  birthPlace?: string
  deathDate?: string
  deathPlace?: string
  bio?: string
  avatarUrl?: string
  status: "active" | "ghost" | "merged" | "archived"
  createdBy: string
  createdAt: string
  deletedAt?: string
  deletedBy?: string
}
```

Gender values for V1:

```ts
"male" | "female"
```

---

# LifeEvent

Represents important life moments for a person.

## Properties

```ts
{
  id: string
  treeId: string
  personId: string
  type: "birth" | "death" | "marriage" | "divorce" | "education" | "work" | "migration" | "custom"
  title: string
  date?: string
  place?: string
  notes?: string
  createdBy: string
  createdAt: string
}
```

---

# MediaAsset

Represents photos or downloadable visual assets.

## Properties

```ts
{
  id: string
  treeId: string
  ownerPersonId?: string
  url: string
  type: "photo" | "document" | "tree_export"
  caption?: string
  createdBy: string
  createdAt: string
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

Admin invitations are not public links in V1. They must be email-specific, revocable, and manually approved.

---

# AdminInvitation

Private email-specific admin invitation.

## Properties

```ts
{
  id: string
  treeId: string
  email: string
  status: "pending" | "approved" | "rejected" | "revoked"
  createdBy: string
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
}
```

---

# TreeAccessRequest

Represents a pending request to join or upgrade role in a tree.

## Properties

```ts
{
  id: string
  treeId: string
  userId: string
  requestedRole: "admin" | "member" | "viewer"
  currentRole?: "member" | "viewer"
  status: "pending" | "approved" | "rejected"
  userName: string
  userEmail: string
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}
```

---

# ProfileClaimRequest

Represents a request by a user account to claim a ghost profile.

## Properties

```ts
{
  id: string
  treeId: string
  personId: string
  userId: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
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
  type: "parent" | "child" | "spouse" | "sibling" | "adopted_child" | "divorced_spouse"
  treeId: string
  createdBy: string
  approvedBy: string
  createdAt: string
  startDate?: string
  endDate?: string
  confidence?: "verified" | "likely" | "uncertain"
  notes?: string
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

# HAS_EVENT

Links:

```text
(Person) -> (LifeEvent)
```

---

# HAS_MEDIA

Links:

```text
(Person) -> (MediaAsset)
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

## Rule 6

Approved inverse relationships must remain consistent. For example, if A is the parent of B, B is the child of A.

## Rule 7

Obvious relationship inferences should be generated as suggestions or approved relationships depending on confidence and admin policy. Ambiguous inferred relationships must go through review.
