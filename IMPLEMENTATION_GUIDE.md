# Invitation System Implementation Guide

# Overview

The invitation system lets admins invite relatives into a tree while protecting privileged access.

V1 invitation policy:

* public links are allowed for member and viewer roles
* admin invitations are email-specific, revocable, and manually approved
* public admin links are not allowed

---

# Invitation Types

## Viewer Link

Public shareable link.

Behavior:

* new user signs up and creates a pending access request
* existing non-member creates a pending access request
* existing member/admin opens the tree directly with their existing role

## Member Link

Public shareable link.

Behavior:

* new user signs up and creates a pending access request
* existing viewer creates a pending role upgrade request
* existing member/admin opens the tree directly with their existing role

## Admin Invite

Private invite flow.

Behavior:

* invite targets a specific email address
* access requires manual approval
* invite can be revoked
* no public admin invitation URL is generated

---

# Backend Endpoints

Recommended endpoints:

```text
POST /api/trees/:treeId/invitations/generate
GET  /api/invitations/:token
POST /api/invitations/:token/accept
POST /api/auth/signup-with-invitation
GET  /api/trees/:treeId/access-requests
POST /api/trees/:treeId/access-requests/:requestId/approve
POST /api/trees/:treeId/access-requests/:requestId/reject
GET  /api/trees/:treeId/invitations
POST /api/trees/:treeId/invitations/:invitationId/revoke
POST /api/trees/:treeId/admin-invitations
```

`/admin-invitations` must require a target email.

---

# Database Nodes

## Invitation

```ts
{
  id: string
  treeId: string
  role: "member" | "viewer"
  token: string
  expiresAt: string
  createdBy: string
  createdAt: string
  revokedAt?: string
  revokedBy?: string
}
```

## AdminInvitation

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
}
```

## TreeAccessRequest

```ts
{
  id: string
  treeId: string
  userId: string
  requestedRole: "admin" | "member" | "viewer"
  currentRole?: "member" | "viewer"
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
}
```

---

# Frontend Pages

## Join Page

Path:

```text
/join/[token]
```

Shows:

* tree name
* requested role
* expiration status
* accept action
* sign-up form for new users
* pending approval message after request

## Invitation Management

Path:

```text
/admin/invitations
```

Shows:

* generate member link
* generate viewer link
* list active links
* copy link
* revoke link
* create email-specific admin invite

## Access Request Review

Path:

```text
/admin/access-requests
```

Shows:

* requester name and email
* requested role
* current role if upgrade
* request date
* approve action
* reject action with reason

---

# Security Requirements

* Validate JWT on protected routes.
* Verify tree admin role before generating or reviewing invitations.
* Do not allow public admin invitation links.
* Expire public links after 7 days by default.
* Support revocation.
* Rate-limit invitation generation and signup attempts.
* Never expose invitation tokens in logs.

---

# Testing Checklist

* [ ] Admin can generate member link.
* [ ] Admin can generate viewer link.
* [ ] Admin cannot generate public admin link.
* [ ] Admin can create email-specific admin invite.
* [ ] New user with member link creates pending request.
* [ ] New user with viewer link creates pending request.
* [ ] Viewer with member link creates upgrade request.
* [ ] Member with viewer link opens tree directly.
* [ ] Expired link is rejected.
* [ ] Revoked link is rejected.
* [ ] Admin can approve request.
* [ ] Admin can reject request with reason.

