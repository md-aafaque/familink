# API_CONTRACTS.md

# API Contracts

# Base URL

```text
/api/v1
```

---

# Authentication

Authentication handled via:

```text
Authorization: Bearer <jwt>
```

All protected routes require valid JWT.

---

# Response Format

## Success

```json
{
  "success": true,
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "error": {
    "message": "Readable error message"
  }
}
```

---

# TREE ROUTES

## Create Tree

### POST

```text
/trees
```

### Body

```json
{
  "name": "Sharma Family"
}
```

---

## Get User Trees

### GET

```text
/trees
```

---

## Get Tree Details

### GET

```text
/trees/:treeId
```

---

# PERSON ROUTES

## Create Person

### POST

```text
/trees/:treeId/people
```

### Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "status": "ghost"
}
```

---

## Update Person

### PATCH

```text
/trees/:treeId/people/:personId
```

---

## Get Person

### GET

```text
/trees/:treeId/people/:personId
```

---

## Soft Delete Person

### DELETE

```text
/trees/:treeId/people/:personId
```

---

# RELATIONSHIP PROPOSALS

## Create Proposal

### POST

```text
/trees/:treeId/relationship-proposals
```

### Body

```json
{
  "fromPersonId": "",
  "toPersonId": "",
  "relationshipType": "parent"
}
```

---

## Approve Proposal

### POST

```text
/trees/:treeId/relationship-proposals/:proposalId/approve
```

---

## Reject Proposal

### POST

```text
/trees/:treeId/relationship-proposals/:proposalId/reject
```

### Body

```json
{
  "reason": "Invalid relationship"
}
```

---

# INVITATIONS

## Create Invitation

### POST

```text
/trees/:treeId/invitations
```

### Body

```json
{
  "role": "member"
}
```

---

## Accept Invitation

### POST

```text
/invitations/accept
```

### Body

```json
{
  "token": ""
}
```

---

# PROFILE CLAIMS

## Request Claim

### POST

```text
/trees/:treeId/people/:personId/claim
```

---

## Approve Claim

### POST

```text
/trees/:treeId/claims/:claimId/approve
```

---

# MERGE ROUTES

## Merge Profiles

### POST

```text
/trees/:treeId/people/merge
```

### Body

```json
{
  "sourcePersonId": "",
  "targetPersonId": ""
}
```

---

# NOTIFICATIONS

## Get Notifications

### GET

```text
/notifications
```

---

## Mark Read

### POST

```text
/notifications/:notificationId/read
```

---

# AUDIT LOGS

## Get Tree Activity

### GET

```text
/trees/:treeId/activity
```

---

# AUTHORIZATION RULES

## Admin

Can:

* approve proposals
* manage roles
* manage invitations
* edit all profiles

---

## Member

Can:

* create people
* create proposals
* edit allowed profiles

---

## Viewer

Read-only.
