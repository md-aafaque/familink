# API Reference

# Base URL

```text
http://localhost:3001/api
```

---

# Common Headers

Authenticated endpoints require:

```text
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

# Common Response Shape

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

# Invitation Endpoints

## Generate Public Invitation Link

```text
POST /trees/:treeId/invitations/generate
```

Authentication:

```text
Required admin
```

Body:

```json
{
  "role": "member"
}
```

Allowed roles:

```ts
"member" | "viewer"
```

Admin public links are not allowed.

## Get Invitation Details

```text
GET /invitations/:token
```

Authentication:

```text
Not required
```

## Accept Invitation

```text
POST /invitations/:token/accept
```

Authentication:

```text
Required
```

Body:

```json
{}
```

## Sign Up With Invitation

```text
POST /auth/signup-with-invitation
```

Authentication:

```text
Not required
```

Body:

```json
{
  "token": "uuid",
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

## List Access Requests

```text
GET /trees/:treeId/access-requests
```

Authentication:

```text
Required admin
```

## Approve Access Request

```text
POST /trees/:treeId/access-requests/:requestId/approve
```

Authentication:

```text
Required admin
```

## Reject Access Request

```text
POST /trees/:treeId/access-requests/:requestId/reject
```

Authentication:

```text
Required admin
```

Body:

```json
{
  "reason": "Not recognized by the family admin"
}
```

## Revoke Invitation

```text
POST /trees/:treeId/invitations/:invitationId/revoke
```

Authentication:

```text
Required admin
```

---

# Admin Invitation Endpoints

## Create Admin Invitation

```text
POST /trees/:treeId/admin-invitations
```

Authentication:

```text
Required admin
```

Body:

```json
{
  "email": "trusted-relative@example.com"
}
```

Admin invitations are private, email-specific, revocable, and manually approved.

---

# Common Error Codes

| Code | Meaning |
| ---- | ------- |
| 400 | Bad request |
| 401 | Authentication required |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict |
| 410 | Expired or revoked invitation |
| 500 | Internal server error |

