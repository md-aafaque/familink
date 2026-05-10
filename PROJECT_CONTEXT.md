# Family Tree Project - Context

## What is the Project?

**Family Tree** is a platform where users can create and manage multiple private family tree rooms. Each family has its own isolated space with:
- One admin who created the tree room
- Invited members with different roles (Admin, Member, Viewer)
- Relationships that need admin verification before becoming official
- Ghost profiles for people who can't create their own accounts

Think of it as a collaborative family genealogy platform where each family has their own private workspace, and family members can work together to build and maintain their family tree.

---

## Key Features

### 1. Family Tree Rooms
- Any user can create a new family tree room
- Each room gets a unique ID
- The creator becomes the admin of that room
- Only invited members can access that specific tree
- Users can be part of multiple family trees

### 2. Role-Based Access Control (Per Tree)
Each member of a family tree can have one of three roles:
- **Admin**: 
  - Create and edit relationships
  - Invite/remove members
  - Assign roles to members
  - Approve pending relationships
  - Edit any profile
- **Member**: 
  - View all profiles and relationships
  - Create new relationships (needs admin approval)
  - Create ghost profiles
  - Claim ghost profiles (needs admin approval)
  - Cannot approve relationships
- **Viewer**: 
  - View only (read-only access)
  - Cannot create relationships or profiles

### 3. User Nodes
- When a user joins a tree, they start as an isolated node
- Their profile is linked to their account
- They can be connected to other people through relationships
- The user details(Name, Age, Education, Occupation, Address, Contact Details, etc.) will not vary for the various family tree he has joined. 
- Every node will have an "editors" array tracking who can edit them
- Anyone can claim to edit and when approved by admin, the claimant's ID gets added to the editors array for that profile
- The first person in the editor array will be the one who created the profile i.e. the user because he can edit his own profile. 


### 4. Ghost Profiles
Users can create ghost profiles for people who:
- Are children (too young for accounts)
- Are not tech savvy
- Are deceased
- Cannot create their own profile
- Don't have email or internet access

Ghost profiles:
- Have no account associated
- Can be claimed later by the actual person
- The first person in the editor array will be the one who created that ghost profile. 

### 5. Profile Editor Logic
- Each profile has an `editors` array containing user IDs
- **Admins** can always edit any profile in the tree
- **Profile creators** and **claimers** are automatically in the editors array
- **Members** can edit only profiles they created or claimed 
- **Viewers** cannot edit any profile

### 6. Relationship Management
- member can create any kind of relationship between themselves and any other person in the tree
- Relationships require **admin verification** before becoming official
- Once approved by admin, relationship is visible to all members
- Admin can edit or delete existing relationships
- Notifications sent when relationships are approved/rejected
- Every relationship in a tree will have a treeId to mark that connection belongs to that tree

### 7. Unified Dashboard
- Single dashboard after login (not separate admin/user dashboards)
- Shows all family trees the user is part of
- Option to create a new family tree
- Option to join an existing tree (via invitation)
- Role indicators (Admin/Member/Viewer) shown for each tree
- Admin-only features are conditionally hidden based on user's role in that tree

### 8. Notifications
- Notifications sent for:
  - Relationship approval
  - Relationship rejection (with reason)
  - Member invitation to tree (for that member only)
  - Member added/removed from tree (for that member only)
  - Role changes (for that member only)

### 9. Member Invitation
- Admin can invite members via email 
- Invitation includes link to join specific family tree
- Invitee can accept and choose to join
- Admin assigns role when inviting (Admin/Member/Viewer)
- Invitee recieves a mail and also a notification in the website with link to join a tree

---

## Tech Stack

### Frontend
- **Language**: TypeScript
- **Framework**: Next.js 13 (React)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **UI Icons**: Lucide React
- **Port**: 3000

### Backend
- **Language**: TypeScript
- **Framework**: Fastify (lightweight Node.js server)
- **Authentication**: Supabase (Email & Password or Google OAuth Login)
- **Port**: 3001

### Database
- **Type**: Neo4j (Graph Database)
- **Why Graph DB?**: Perfect for storing relationships between people (family connections are naturally graph-like)



---

## User Roles & Permissions Matrix

| Action | Admin | Member | Viewer |
|--------|-------|--------|--------|
| View all profiles | ✅ | ✅ | ✅ |
| Create profile | ✅ | ✅ | ❌ |
| Edit own profile | ✅ | ✅ | ❌ |
| Edit others' profile | ✅ | ❌ | ❌ |
| Create relationship | ✅ | ✅ | ❌ |
| Approve relationship | ✅ | ❌ | ❌ |
| Edit relationship | ✅ | ❌ | ❌ |
| Delete relationship | ✅ | ❌ | ❌ |
| Invite member | ✅ | ❌ | ❌ |
| Remove member | ✅ | ❌ | ❌ |
| Change member role | ✅ | ❌ | ❌ |
| Claim ghost profile | ✅ | ✅ | ❌ |
| Create ghost profile | ✅ | ✅ | ❌ |
| Delete own relationship | ✅ | ✅ | ❌ |
| Edit claimed profile | ✅ | ✅ | ❌ |
---

## Core User Flows

### Flow 1: Create Family Tree
1. User clicks "Create New Family Tree"
2. Provides family name
3. System creates new tree room with unique ID
4. User becomes admin of that tree
5. User added as a node in that tree
6. Dashboard shows this new tree

### Flow 2: Invite Members to Tree
1. Admin goes to tree settings
2. Enters email(s) of people to invite
3. System sends invitation
4. Invitee receives notification + link
5. Invitee joins tree with specified role
6. Invitee becomes a node in the tree

### Flow 3: Create and Claim Ghost Profile
1. Member creates ghost profile for deceased relative "John"
2. Ghost profile added to tree (no account associated)
3. Later, John's son (now on the tree) wants to claim the profile.
4. Son clicks "Claim Profile"
5. Admin Approves
6. Son's ID added to "editors" array
7. Son can now edit John's profile

### Flow 4: Create Relationship (Pending Approval)
1. User A clicks on User B's profile
2. Creates relationship "User A is parent of User B"
3. Relationship marked as "pending"
4. Admin receives notification
5. Admin reviews and approves/rejects
6. If approved, relationship visible to all members
7. User A and User B receive notifications

### Flow 5: Join Existing Tree
1. User receives invitation link
2. Clicks link and lands on join page
3. Sees family tree details
4. Clicks "Join" button
5. Added to tree with assigned role
6. Becomes a node in the tree
7. Tree now appears in their dashboard

### Flow 6: Claim Ghost profile 
1. Whenever a ghost profile is claimed an options shows - 
    - You want to merge the profile with your own profile 
    - You want to be editor of both the profile
2. Ghost profile created for new born son by "John".
3. Son grows up and join the family tree with his details and is an isolated node.
4. Wants to merge the relationship of the ghost node created by john and profile details of the isolated node. 
5. Delete that ghost node and replace it with his node. 

---

## Why This Tech Stack?

- **Next.js**: Modern React framework with great developer experience, built-in routing
- **Fastify**: Lightweight, fast Node.js server perfect for APIs with per-route control
- **TypeScript**: Type safety prevents bugs and enables better IDE support
- **Neo4j**: Graph database makes querying relationships trivial; perfect for family connections
- **Supabase**: Pre-built authentication service saves development time
- **Tailwind**: Rapid UI development with utility classes
- **Framer Motion**: Smooth animations for better UX

---

## Architecture Overview

### Authentication Flow
1. User signs up with Supabase (email/password or Google Oauth)
2. Supabase returns JWT token
3. Token stored in localStorage
4. All API requests include JWT in Authorization header
5. Backend validates JWT and extracts user ID
6. User can then create/join family trees

### Data Model
- **User nodes**: One per registered user
- **Person nodes**: Represent family members (may or may not have accounts)
- **FamilyTree nodes**: Represent rooms/workspaces
- **MEMBER_OF relationships**: Connect users to family trees with roles
- **Relationships**: Connect people (Parent, Spouse, Sibling, etc.)

### Authorization Pattern
- **Authentication**: Is the request from a valid user? (JWT validation)
- **Authorization**: Does this user have access to this tree? (MEMBER_OF relationship check)
- **Role-based**: What actions can they perform? (Admin/Member/Viewer based on role in that specific tree)

---

## What Problems Does It Solve?

1. **Family Genealogy Management**: Easy way to track and visualize family relationships
2. **Decentralized Collaboration**: Each family has their own isolated space; no mixing of data
3. **Privacy**: Only family members invited to a tree can see it
4. **Flexibility**: Users can be part of multiple families/trees
5. **Ghost Profiles**: Support for family members who can't create accounts
6. **Collaborative Editing**: Multiple people can contribute, with admin oversight
7. **Data Integrity**: Pending relationships require admin approval before going official

---

## Planned Features for Phase 2

- Export family tree as PDF
- Photo gallery for each person
- Timeline of family events
- Advanced search and filtering
- Bulk import from CSV
- Relationship suggestions based on data
- Mobile-responsive design improvements
- Batch invite members
- Family tree templates
