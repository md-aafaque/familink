# Implementation Phases

# Purpose

This file tracks implementation phases for the Family Tree project.

Use it as the source of truth for build order, scope boundaries, and progress. Update the status as work is completed.

Status values:

```text
not_started
in_progress
blocked
done
deferred
```

---

# Phase 0: Documentation And Alignment

Status: done

Goal:

Lock product, UX, architecture, API, and schema direction before feature work continues.

Tasks:

* [x] Define traditional V1 family structure.
* [x] Define two-gender V1 scope.
* [x] Define strict generation-based tree layout rules.
* [x] Resolve public admin invitation policy.
* [x] Add product specification.
* [x] Add UX specification.
* [x] Add implementation phase tracker.
* [x] Normalize all API docs against intended backend routes.
* [x] Clean historical implementation docs so they do not conflict with current product rules.

Exit criteria:

* Product, UX, API, and schema docs agree with each other.
* No V1 security contradictions remain.

---

# Phase 1: Core App Foundation

Status: done

Goal:

Build the basic authenticated application shell and tree workspace model.

Tasks:

* [x] Authentication integration.
* [x] Dashboard with joined trees.
* [x] Create tree flow.
* [x] Tree membership roles.
* [x] Tree authorization middleware.
* [x] Shared API response format.
* [x] Typed errors.
* [x] Audit log foundation.

Exit criteria:

* User can sign in, create a tree, and open a protected tree workspace.

---

# Phase 2: People And Profiles

Status: done

Goal:

Allow families to create and maintain person profiles.

Tasks:

* [x] Create person.
* [x] Edit person.
* [x] Soft delete/archive person.
* [x] Ghost profile support.
* [x] Profile permissions.
* [x] Profile drawer UI.
* [x] Basic photo/avatar support.
* [x] Privacy fields for sensitive data.

Exit criteria:

* Users can add relatives and view/edit permitted profiles.

---

# Phase 3: Relationship System

Status: done

Goal:

Build proposal, approval, validation, and relationship inference workflows.

Tasks:

* [x] Create relationship proposal.
* [x] Approve/reject relationship proposal.
* [x] Prevent ancestry cycles.
* [x] Prevent duplicate relationships.
* [x] Validate obvious age conflicts.
* [x] Maintain inverse relationship consistency.
* [x] Generate inferred relationship suggestions.
* [x] Add admin review UI for inferred suggestions.
* [x] Add relationship audit events.

Exit criteria:

* Admin-approved family relationships create a coherent graph and obvious inferred relationships are suggested or applied safely.

---

# Phase 4: Tree Viewer V1

Status: done

Goal:

Build the attractive, readable family tree viewer.

Tasks:

* [x] Generation-row layout engine.
* [x] Spouse baseline placement.
* [x] Marriage anchor point rendering.
* [x] Parent-child T-junction rendering.
* [x] Sibling branching bar rendering.
* [x] Orthogonal line routing.
* [x] Person card states.
* [x] Zoom and pan.
* [x] Fit-to-screen.
* [x] Focus person.
* [x] Collapse/expand branch.
* [x] Full-screen mode.
* [x] Download current tree as PNG.
* [x] Download current tree as PDF.
* [x] Mobile tree interaction.

Exit criteria:

* The tree is visually attractive, readable, interactive, and downloadable.

---

# Phase 5: Invitations And Access Requests

Status: done

Goal:

Let admins invite family safely.

Tasks:

* [x] Public member invitation links.
* [x] Public viewer invitation links.
* [x] Email-specific admin invitation flow.
* [x] Access request creation.
* [x] Access request approval/rejection.
* [x] Role upgrade requests.
* [x] Invitation expiry.
* [x] Invitation revocation.
* [x] Rate limiting.
* [x] Notifications for request outcomes.

Exit criteria:

* Users can join trees through safe invitation flows without public admin links.

---

# Phase 6: Claims, Merge, And Corrections

Status: done

Goal:

Support real-world cleanup as families join.

Tasks:

* [x] Claim ghost profile.
* [x] Approve/reject claim.
* [x] Merge duplicate profiles.
* [x] Preserve merged profile audit history.
* [x] Move relationships during merge.
* [x] Resolve conflicting profile data.

Exit criteria:

* Family members can claim and clean up profiles without corrupting history.

---

# Phase 7: Family Memory Features

Status: deferred

Goal:

Make the app feel more personal and valuable beyond structure.

Tasks:

* [ ] Life events timeline.
* [ ] Photo albums.
* [ ] Stories/notes.
* [ ] Birthday and anniversary reminders.
* [ ] Family activity feed.

Exit criteria:

* The tree feels like a family memory product, not just a graph editor.

---

# Phase 8: Import, Export, And Polish

Status: deferred

Goal:

Improve portability and long-term usefulness.

Tasks:

* [ ] GEDCOM import.
* [ ] GEDCOM export.
* [ ] CSV import.
* [ ] Advanced PDF export options.
* [ ] Search and filtering improvements.
* [ ] Accessibility pass.
* [ ] Performance pass for large trees.

Exit criteria:

* Users can move family data in and out of the app and browse larger trees comfortably.
