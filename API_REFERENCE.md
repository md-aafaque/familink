# API Reference - Invitation System

## Base URL
`http://localhost:3001/api`

## Endpoints

### 1. Generate Invitation Link
```
POST /trees/:treeId/invitations/generate
Authentication: Required
Body:
{
  "invitationType": "admin" | "member" | "viewer"
}

Response (201):
{
  "token": "uuid",
  "invitationUrl": "http://localhost:3000/join/uuid",
  "invitationType": "member",
  "treeId": "tree-123",
  "treeName": "Smith Family",
  "expiresAt": 1234567890
}

Error (403): Only tree admin can generate invitations
Error (400): Invalid invitation type
```

### 2. Get Invitation Details
```
GET /invitations/:token
Authentication: Not required
Query params: None

Response (200):
{
  "token": "uuid",
  "treeId": "tree-123",
  "treeName": "Smith Family",
  "invitationType": "member",
  "expiresAt": 1234567890
}

Error (404): Invalid or expired invitation
Error (410): Invitation expired
```

### 3. Accept Invitation (Existing User)
```
POST /invitations/:token/accept
Authentication: Required
Body: {} (empty)

Response (200):
{
  "success": true,
  "message": "Already a member, opening tree",
  "treeId": "tree-123",
  "role": "member"
}

OR

{
  "success": true,
  "message": "Request submitted for member approval",
  "treeId": "tree-123",
  "requestId": "req-uuid",
  "status": "pending"
}

Error (404): Invalid or expired invitation
Error (410): Invitation expired
Error (409): User already exists (for admin invitations)
```

### 4. Sign Up with Invitation (New User)
```
POST /auth/signup-with-invitation
Authentication: Not required
Body:
{
  "token": "uuid",
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response (200):
For Admin Invitation:
{
  "message": "Admin account created successfully",
  "userId": "user-uuid",
  "role": "admin",
  "treeId": "tree-123"
}

For Member/Viewer Invitation:
{
  "message": "Account created. Awaiting admin approval to join tree.",
  "userId": "user-uuid",
  "treeId": "tree-123",
  "requestId": "req-uuid",
  "status": "pending",
  "role": "member"
}

Error (400): All fields required / Invalid token / Email mismatch / etc.
Error (410): Invitation expired
```

### 5. Get Pending Access Requests
```
GET /trees/:treeId/access-requests
Authentication: Required
Query params: None

Response (200):
{
  "pendingRequests": [
    {
      "id": "req-uuid",
      "userId": "user-uuid",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "invitationType": "member",
      "createdAt": 1234567890,
      "status": "pending"
    }
  ]
}

Error (403): Only admin can view access requests
```

### 6. Approve Access Request
```
POST /trees/:treeId/access-requests/:requestId/approve
Authentication: Required
Body: {} (empty)

Response (200):
{
  "success": true,
  "message": "member request approved",
  "userId": "user-uuid",
  "role": "member"
}

Error (403): Only admin can approve requests
Error (404): Request not found or already processed
```

### 7. Reject Access Request
```
POST /trees/:treeId/access-requests/:requestId/reject
Authentication: Required
Body:
{
  "reason": "Not a family member" (optional)
}

Response (200):
{
  "success": true,
  "message": "Request rejected",
  "userId": "user-uuid"
}

Error (403): Only admin can reject requests
Error (404): Request not found or already processed
```

### 8. Get Active Invitations
```
GET /trees/:treeId/invitations
Authentication: Required
Query params: None

Response (200):
{
  "activeInvitations": [
    {
      "token": "uuid",
      "invitationType": "member",
      "createdAt": 1234567890,
      "expiresAt": 1234567890,
      "invitationUrl": "http://localhost:3000/join/uuid"
    }
  ]
}

Error (403): Only admin can view invitations
```

## Request Headers

All authenticated endpoints require:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

## Common Error Codes

| Code | Message |
|------|---------|
| 400 | Bad request / Invalid parameters |
| 401 | Authentication required |
| 403 | Forbidden / Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g., user already exists) |
| 410 | Gone / Invitation expired |
| 500 | Internal server error |

## Example Workflows

### Workflow 1: Generate and Share Admin Link
```bash
# 1. Admin generates link
curl -X POST http://localhost:3001/api/trees/tree-123/invitations/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invitationType": "admin"}'

# Response includes invitationUrl that can be shared
```

### Workflow 2: New User Signs Up with Member Link
```bash
# 1. User clicks link, gets invitation details
curl http://localhost:3001/api/invitations/uuid

# 2. User signs up with token
curl -X POST http://localhost:3001/api/auth/signup-with-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "token": "uuid",
    "email": "user@example.com",
    "password": "pass123",
    "name": "John Doe"
  }'

# Response: pending approval status
```

### Workflow 3: Admin Approves Request
```bash
# 1. Admin gets pending requests
curl http://localhost:3001/api/trees/tree-123/access-requests \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Admin approves specific request
curl -X POST http://localhost:3001/api/trees/tree-123/access-requests/req-uuid/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# User is now added to tree
```

### Workflow 4: Existing Member Accepts Viewer Link
```bash
# 1. Existing member (already logged in) clicks link
curl -X POST http://localhost:3001/api/invitations/uuid/accept \
  -H "Authorization: Bearer $EXISTING_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Response: success with direct tree access
```

## Rate Limiting (Recommended)

Not yet implemented, but consider adding:
- 10 requests per minute per user for link generation
- 5 requests per minute per user for signup attempts
- 10 requests per minute per admin for approval actions

## Notes

- Token format: UUID v4
- Token expiration: 7 days (configurable)
- All timestamps in milliseconds (Unix epoch)
- All UUIDs are version 4
- Emails are lowercased and trimmed on storage
