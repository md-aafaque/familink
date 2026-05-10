# Invitation System Implementation Guide

## Overview
A comprehensive 3-type invitation system has been implemented for the Family Tree project, allowing admins to generate shareable invitation links that can be distributed publicly (WhatsApp, social media, etc.) without needing email addresses.

## Implementation Summary

### 1. **Backend Routes** (`backend/src/routes/invitations.ts`)

#### Endpoints Created:

##### A. Generate Invitation Link
**POST** `/api/trees/:treeId/invitations/generate`
- Only admin can access
- Types: `admin` | `member` | `viewer`
- Returns: invitation token, URL, and metadata
- Token expires in 7 days (configurable)

**Example Response:**
```json
{
  "token": "uuid",
  "invitationUrl": "http://localhost:3000/join/uuid",
  "invitationType": "member",
  "treeId": "tree-id",
  "treeName": "Family Tree Name",
  "expiresAt": 1234567890
}
```

##### B. Get Invitation Details (Public)
**GET** `/api/invitations/:token`
- No authentication required
- Returns: tree name, invitation type, and expiration info
- Validates token expiration

##### C. Accept Invitation
**POST** `/api/invitations/:token/accept`
- Requires authentication (for existing users)
- **Existing Member**: 
  - If clicking viewer link → direct access granted
  - If already has role → no additional action needed
- **New User**: 
  - Creates access request with status "pending"
  - Goes for admin approval

##### D. Get Pending Access Requests
**GET** `/api/trees/:treeId/access-requests`
- Only admin can access
- Returns: list of pending member/viewer requests

##### E. Approve Access Request
**POST** `/api/trees/:treeId/access-requests/:requestId/approve`
- Only admin can approve
- Adds user to tree with requested role
- Creates person node for user

##### F. Reject Access Request
**POST** `/api/trees/:treeId/access-requests/:requestId/reject`
- Only admin can reject
- Supports optional rejection reason
- Notifies user of rejection

##### G. Get Active Invitations
**GET** `/api/trees/:treeId/invitations`
- Only admin can view
- Returns: all active, non-expired invitation links for the tree

### 2. **Authentication Route** (`backend/src/routes/auth.ts`)

#### New Endpoint:

**POST** `/api/auth/signup-with-invitation`
- Allows new user signup with invitation token
- **Admin Invitations**: 
  - User directly becomes admin
  - No approval needed
  - Person node created automatically
- **Member/Viewer Invitations**: 
  - User account created with status "approved"
  - Access request marked as "pending"
  - Awaits admin approval
  - Person node created upon approval

### 3. **Database Schema Updates**

New Neo4j Node Types:
```
TreeInvitation {
  token: UUID
  treeId: string
  invitationType: 'admin' | 'member' | 'viewer'
  createdBy: userId
  createdAt: timestamp
  expiresAt: timestamp
  status: 'active' | 'inactive'
}

TreeAccessRequest {
  id: UUID
  userId: string
  treeId: string
  invitationType: 'member' | 'viewer'
  status: 'pending' | 'approved' | 'rejected'
  createdAt: timestamp
  approvedAt?: timestamp
  rejectedAt?: timestamp
  rejectionReason?: string
  userName: string
  userEmail: string
}
```

New Relationships:
- `TreeInvitation -[:FOR_TREE]-> FamilyTree`
- `TreeAccessRequest -[:REQUESTS_ACCESS_TO]-> FamilyTree`

### 4. **Frontend Pages**

#### A. Join Invitation Page
**Path:** `/app/join/[token]/page.tsx`
- **Public page** (no auth required initially)
- Shows:
  - Family tree name
  - Invitation type (with role explanation)
  - Expiration date
  - Accept/Cancel buttons
- **Flow for New User**:
  1. Click "Accept" → signup form appears
  2. Enter name, email, password
  3. Submit → account created
  4. For admin invitations → direct access
  5. For member/viewer invitations → pending approval message
- **Flow for Existing User**:
  1. Click "Accept" → processed
  2. If member clicking viewer link → direct access
  3. If new to tree → creates access request

#### B. Pending Invitations Page
**Path:** `/app/admin/pending-invitations/page.tsx`
- Shows all pending member/viewer requests
- Only accessible to admin
- Features:
  - User details (name, email)
  - Requested role (member/viewer)
  - Request timestamp
  - Approve/Reject buttons
  - Optional rejection reason field
- Displays real-time updates after action

#### C. Generate Invitations Page
**Path:** `/app/admin/generate-invitations/page.tsx`
- Admin dashboard for creating invitation links
- Three sections for each invitation type (admin/member/viewer)
- Features:
  - One-click link generation
  - Copy-to-clipboard functionality
  - Shows all active links with metadata
  - Displays time remaining for each link
  - Shows expiration date
  - Test link button
  - Visual indicators for expired links

### 5. **Updated PROJECT_CONTEXT.md**

Added comprehensive documentation for:
- **Member Invitation** (Section 9)
  - Three invitation types explained
  - New user vs existing member flows
  - Token structure and validity
- **New User Flow** (Updated Flow 2)
  - Step-by-step invitation acceptance
  - Approval workflow for new users
  - Direct access for existing members
- **New Approval Workflow** (Flow 7)
  - Admin review of pending requests
  - Approve/reject actions
  - Notification process
- **Updated Data Model**
  - TreeInvitation nodes
  - TreeAccessRequest nodes
  - Updated relationships

## User Workflows

### Workflow 1: Admin Creates Member Invitation
1. Admin goes to `/admin/generate-invitations?treeId=XXX`
2. Clicks "Generate Link" under Member Invitation
3. System generates unique token and shareable URL
4. Admin copies link and shares on WhatsApp/Facebook
5. Link: `http://localhost:3000/join/{token}`

### Workflow 2: New User Joins via Member Link
1. User clicks link → lands on `/join/{token}`
2. Sees family tree details and requested role
3. Clicks "Accept Invitation"
4. Shows signup form (name, email, password)
5. Submits → account created
6. Status: pending approval
7. User sees: "Request submitted for approval"
8. Redirected to dashboard

### Workflow 3: Admin Approves Request
1. Admin receives notification of new request
2. Goes to `/admin/pending-invitations?treeId=XXX`
3. Sees pending user request with role
4. Clicks "Approve"
5. User added to tree with member role
6. User notified (appears in dashboard)
7. User can now access family tree

### Workflow 4: Existing Member Clicks Viewer Link
1. Existing member clicks viewer invitation link
2. System recognizes they're already a member
3. Directly opens family tree (read-only view)
4. No approval needed
5. Seamless access

### Workflow 5: Admin Creates Admin Invitation
1. Admin goes to `/admin/generate-invitations?treeId=XXX`
2. Clicks "Generate Link" under Admin Invitation
3. Shares link with trusted person
4. New user clicks link → sees invitation
5. Clicks "Accept" → signup form
6. Submits → directly becomes admin
7. No approval needed
8. Immediate access to tree

## Security Features

1. **Token Validation**
   - Unique UUID tokens
   - 7-day expiration
   - Checked on every use

2. **Access Control**
   - Only admins can generate links
   - Only admins can approve/reject
   - Rate limiting recommended

3. **Role-Based Access**
   - Admin invitations bypass approval
   - Member/viewer invitations require approval
   - Existing members get fast-track access

4. **User Verification**
   - New users must sign up with email
   - Email becomes unique identifier
   - Password protected accounts

## Configuration

**Environment Variables** (if needed):
```
FRONTEND_URL=http://localhost:3000
# Default: auto-detected from request
```

**Token Expiration** (in invitations.ts):
```typescript
const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
```

## Frontend Integration Points

### Required Components:
- `AnimatedButton` (already exists)
- `AnimatedCard` (already exists)
- `Header` (already exists)
- Icons from `lucide-react`

### Required Libraries:
- `axios` (already via `@/lib/api`)
- `next/navigation` (router, search params)
- `lucide-react` icons

## Testing Recommendations

1. **Test Admin Link Generation**
   - Generate admin invitation
   - Share link
   - New user signs up
   - Verify direct admin access

2. **Test Member Link with Approval**
   - Generate member invitation
   - New user signs up
   - Verify pending status
   - Admin approves
   - Verify user gets access

3. **Test Existing Member + Viewer Link**
   - Add user as member first
   - Generate viewer link
   - User clicks link
   - Verify direct access (no approval prompt)

4. **Test Link Expiration**
   - Generate link
   - Manually set expiration to past time
   - Try to use link
   - Verify error message

5. **Test Rejection Workflow**
   - Generate member link
   - User signs up
   - Admin rejects with reason
   - Verify user gets notification

## Future Enhancements

1. Email notifications when requests are approved/rejected
2. Batch invitation generation
3. Invitation analytics (usage tracking)
4. Custom expiration times per link
5. Link revocation/deactivation
6. Invitation templates with custom messages
7. SMS-based invitations
8. QR code generation for links

## File Structure

```
Backend:
├── src/routes/invitations.ts (NEW - 380+ lines)
├── src/routes/auth.ts (UPDATED - added signup-with-invitation)
├── src/routes/index.ts (UPDATED - registered invitations route)

Frontend:
├── app/join/[token]/page.tsx (NEW - invitation landing page)
├── app/admin/pending-invitations/page.tsx (NEW - approval dashboard)
├── app/admin/generate-invitations/page.tsx (NEW - link generation)

Documentation:
├── PROJECT_CONTEXT.md (UPDATED - new sections)
```

## Summary

✅ Three invitation types (admin, member, viewer)
✅ Public shareable links (no email needed)
✅ Admin approval workflow for new users
✅ Direct access for existing members
✅ Comprehensive frontend pages
✅ Full backend API implementation
✅ Database schema updates
✅ Updated documentation
✅ Security measures in place
