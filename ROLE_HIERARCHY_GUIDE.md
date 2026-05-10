# Invitation System - Role Hierarchy Logic

## Overview

The invitation system now implements a sophisticated role hierarchy that determines access and approval requirements based on user status and current role in the tree.

## Role Hierarchy

```
Admin (Level 3) > Member (Level 2) > Viewer (Level 1)
```

**Key Principle**: A higher-level role can perform all actions of lower-level roles.

---

## Decision Logic Flow

When a user clicks an invitation link, the system follows this logic:

### Step 1: Is the user new (doesn't exist in system)?
- **YES** → Go to Step 4
- **NO** → Go to Step 2

### Step 2: Is the user already in this specific tree?
- **YES** → Go to Step 3
- **NO** → Go to Step 4

### Step 3: Compare User's Current Role with Requested Role
Using the role hierarchy levels:

**If current role level ≥ requested role level:**
- **Grant direct access** ✅
- No approval needed
- User can immediately access tree
- Example: Member (2) clicking Viewer link (1) → Direct access

**If current role level < requested role level:**
- **Create upgrade request** ⏳
- Mark as pending approval
- Admin must review and approve
- If approved: old role deleted, new role assigned
- Example: Viewer (1) clicking Member link (2) → Pending approval

### Step 4: New User or Exists in Different Tree
- **For Admin invitations**: 
  - Direct admin account creation
  - No approval needed ✅
  - Immediate tree access

- **For Member/Viewer invitations**:
  - User signs up
  - Access request created
  - Mark as pending approval ⏳
  - Admin must approve

---

## Detailed Scenarios

### Scenario 1: New User Clicks Member Link
```
User Status: Doesn't exist in system
Action: Click member invitation link

Flow:
1. Join page shows invitation details
2. User clicks "Accept Invitation"
3. Signup form appears
4. User fills: name, email, password
5. Account created
6. Access request created (pending)
7. User sees: "Request submitted for approval"
8. Admin reviews and approves
9. User added as Member to tree

Result: ⏳ Pending Approval
```

### Scenario 2: Existing Admin Clicks Member Link (Same Tree)
```
User Status: Already admin in tree
Current Role: Admin (level 3)
Requested Role: Member (level 2)
Tree: Same tree they already manage

Flow:
1. User clicks member invitation link
2. System checks: "Are they in this tree?" YES
3. System checks: "Admin (3) >= Member (2)?" YES
4. Direct access granted

Result: ✅ Immediate Access (read tree as member)
```

### Scenario 3: Existing Member Clicks Admin Link (Same Tree)
```
User Status: Already member in tree
Current Role: Member (level 2)
Requested Role: Admin (level 3)
Tree: Same tree they're already in

Flow:
1. User clicks admin invitation link
2. System checks: "Are they in this tree?" YES
3. System checks: "Member (2) >= Admin (3)?" NO
4. Access request created for upgrade
5. Marked as pending approval
6. Upgrade reason: "Viewer to Member" or "Member to Admin"

Result: ⏳ Pending Approval for Role Upgrade
```

### Scenario 4: User from Different Tree Clicks Member Link
```
User Status: Exists in system, in another tree
Current Role: Admin (but in Tree A, not Tree B)
Action: Clicks member link for Tree B

Flow:
1. User clicks member invitation link for Tree B
2. System checks: "Are they in Tree B?" NO
3. Access request created for Tree B
4. Marked as pending approval
5. Admin of Tree B reviews request

Result: ⏳ Pending Approval (new to this tree)
```

### Scenario 5: Member Clicks Viewer Link (Same Tree)
```
User Status: Already member in tree
Current Role: Member (level 2)
Requested Role: Viewer (level 1)
Tree: Same tree

Flow:
1. User clicks viewer invitation link
2. System checks: "Are they in this tree?" YES
3. System checks: "Member (2) >= Viewer (1)?" YES
4. Direct access granted
5. User can view tree with their member permissions

Result: ✅ Immediate Access (member can always view)
```

### Scenario 6: Viewer Clicks Admin Link (Same Tree)
```
User Status: Already viewer in tree
Current Role: Viewer (level 1)
Requested Role: Admin (level 3)
Tree: Same tree

Flow:
1. User clicks admin invitation link
2. System checks: "Are they in this tree?" YES
3. System checks: "Viewer (1) >= Admin (3)?" NO
4. Access request created for upgrade
5. Marked as pending approval
6. Admin reviews: "Approve viewer to admin?"
7. If approved: old viewer role deleted, admin role assigned

Result: ⏳ Pending Approval for Role Upgrade
```

---

## API Response Examples

### Scenario 1: New User Signs Up
```json
{
  "success": true,
  "message": "Request submitted for member approval",
  "treeId": "tree-123",
  "requestId": "req-uuid",
  "status": "pending"
}
```

### Scenario 2: Direct Access (Higher Role Exists)
```json
{
  "success": true,
  "message": "Already a member with sufficient permissions, opening tree",
  "treeId": "tree-123",
  "role": "admin"
}
```

### Scenario 3: Role Upgrade Requested
```json
{
  "success": true,
  "message": "Request submitted to upgrade from member to admin",
  "treeId": "tree-123",
  "requestId": "req-uuid",
  "status": "pending",
  "currentRole": "member",
  "requestedRole": "admin"
}
```

---

## Admin Approval Dashboard

The admin sees all pending requests with additional context:

```
Request: Jane Smith (jane@example.com)
Type: Member
Status: Pending

[Approve] [Reject]
```

For role upgrades, the request shows:
```
Request: John Doe (john@example.com)
Type: Admin
Status: Pending
Upgrade from: Viewer

[Approve] [Reject]
```

---

## Database Changes

### TreeAccessRequest Node (Updated)

```neo4j
TreeAccessRequest {
  id: UUID
  userId: string
  treeId: string
  invitationType: "admin" | "member" | "viewer"
  status: "pending" | "approved" | "rejected"
  createdAt: timestamp
  approvedAt?: timestamp
  rejectedAt?: timestamp
  rejectionReason?: string
  userName: string
  userEmail: string
  upgradeFrom?: string  // NEW - shows previous role for upgrades
}
```

### Approval Logic (Updated)

When approving, the system now:
1. Checks if `upgradeFrom` field exists
2. If yes: Delete old relationship, create new one with upgraded role
3. If no: Create new relationship with requested role
4. Create person node (only for new users)

---

## Benefits of Role Hierarchy

✅ **Smooth User Experience**: Existing members get instant access when possible
✅ **Security**: Requires approval for privilege escalation
✅ **Flexibility**: Users can get upgraded roles through invitation links
✅ **Clear Logic**: Role levels make decision-making straightforward
✅ **No Confusion**: Hierarchy removes ambiguous scenarios

---

## Common User Workflows

### Workflow 1: Quick Access for Existing Member
1. Existing member receives viewer link
2. Clicks link
3. Tree opens immediately (no approval needed)
4. Can view with their current member privileges

### Workflow 2: Privilege Escalation
1. Current viewer receives member link
2. Clicks link
3. Creates upgrade request
4. Admin approves
5. User becomes member with editing permissions

### Workflow 3: New Family Member
1. New user (not in system) clicks member link
2. Signs up
3. Account created, pending approval
4. Admin approves
5. User added to tree, sees tree in dashboard

### Workflow 4: Admin Invites Admin
1. Admin generates admin link
2. Shares with trusted person
3. New person clicks link
4. Signs up
5. Immediately becomes admin (no approval)

---

## Migration Notes

If you're upgrading from the previous system:

1. Existing `TreeAccessRequest` nodes without `upgradeFrom` are treated as new user requests
2. All existing pending requests will show as "new to tree"
3. No data migration needed
4. New upgrade scenarios only apply to requests created after update

---

## Security Considerations

1. **Admin invitations bypass approval**: Only admins should have access to admin links
2. **Role upgrades require approval**: Can't self-elevate without admin consent
3. **Token validation**: Tokens expire in 7 days
4. **Access control**: Only tree admins can approve requests

---

## Testing Checklist

- [ ] New user can sign up with member link (pending approval)
- [ ] New user can sign up with viewer link (pending approval)
- [ ] New user can sign up with admin link (direct access)
- [ ] Existing member clicking viewer link → instant access
- [ ] Existing member clicking admin link → upgrade request
- [ ] Existing viewer clicking member link → upgrade request
- [ ] Existing admin can see all role types (instant access)
- [ ] Admin can approve member request
- [ ] Admin can approve viewer request
- [ ] Admin can approve role upgrade
- [ ] Admin can reject any request with reason
- [ ] User from different tree pending approval → creates new request
