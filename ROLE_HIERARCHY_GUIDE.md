# Invitation Role Hierarchy Guide

# Role Levels

```text
Admin  = 3
Member = 2
Viewer = 1
```

Higher roles inherit lower-role access.

---

# Core Rule

When a user follows an invitation or requests access, compare the user's current role in that tree with the requested role.

If the user already has the same or higher role:

* open the tree directly
* keep the existing role
* do not downgrade the user

If the user has a lower role:

* create a role upgrade request
* require admin approval

If the user is not in the tree:

* create a join request for member/viewer public links
* require admin approval

---

# Admin Access Rule

Public admin links are not allowed.

Admin access requires:

* email-specific invitation or explicit upgrade request
* manual approval
* audit log entry

---

# Scenarios

## New User Uses Member Link

Result:

* account is created
* member access request is created
* admin approval is required

## New User Uses Viewer Link

Result:

* account is created
* viewer access request is created
* admin approval is required

## Existing Admin Uses Member Link

Result:

* direct tree access
* role remains admin

## Existing Member Uses Viewer Link

Result:

* direct tree access
* role remains member

## Existing Viewer Uses Member Link

Result:

* member upgrade request is created
* admin approval is required

## Existing Member Requests Admin

Result:

* admin upgrade request is created
* manual approval is required
* public admin link is not used

## User From Another Tree Uses Member Link

Result:

* new access request is created for this tree
* role in other trees is irrelevant
* admin approval is required

---

# Approval Dashboard Requirements

Admin review UI must show:

* requester name
* requester email
* requested role
* current role if upgrade
* request source
* created date
* approve action
* reject action
* rejection reason field

---

# Testing Checklist

* [ ] New user with member link creates pending request.
* [ ] New user with viewer link creates pending request.
* [ ] Existing member with viewer link opens tree directly.
* [ ] Existing admin with member link opens tree directly.
* [ ] Existing viewer with member link creates upgrade request.
* [ ] Existing member requesting admin creates upgrade request.
* [ ] Public admin invitation link cannot be generated.
* [ ] Admin can approve member request.
* [ ] Admin can approve viewer request.
* [ ] Admin can approve admin upgrade request.
* [ ] Admin can reject any request with reason.

