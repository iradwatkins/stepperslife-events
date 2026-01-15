# Story 13.4: Staff Role Assignment System

## Status
| Field | Value |
|-------|-------|
| Status | 🟢 Approved |
| Priority | P1 (High) |
| Estimate | M (5 pts) |
| Epic | Sprint 13 - Revenue & Reliability |
| Created | 2026-01-15 |
| Updated | 2026-01-15 |

---

## Project Context

### Infrastructure
| Field | Value |
|-------|-------|
| Project | SteppersLife Events |
| Local Folder | ~/Documents/projects/stepperslife-events |
| GitHub Repo | iradwatkins/stepperslife-events |
| Dev Port | 3001 |
| Database | Convex |
| Coolify UUID | awsgk0sk4ckw00go4c8w0ogg |

### Pre-Implementation Checklist
- [ ] Verify folder: `pwd` should show `/Users/irawatkins/Documents/projects/stepperslife-events`
- [ ] Verify repo: `git remote -v` should show `iradwatkins/stepperslife-events`
- [ ] Create feature branch: `git checkout -b feat/story-13-4-staff-roles`

---

## User Story

**As an** event organizer
**I want to** assign roles to my staff
**So that** they have appropriate permissions for their duties

---

## Description

### Background
The organizer layout at `src/app/organizer/layout.tsx:43` hardcodes staff roles to an empty array. This means staff members see a blank dashboard without proper permissions. Organizers need to assign roles (OWNER, MANAGER, STAFF, VOLUNTEER) with different permission levels.

### Current State
```typescript
// Line 43
// TODO: Fetch staff roles from event assignments if needed
staffRoles: [],
```

### Role Definitions
| Role | Permissions |
|------|-------------|
| OWNER | Full access, can delete event, manage all staff |
| MANAGER | Can manage staff, handle refunds, view all reports |
| STAFF | Can scan tickets, process cash orders, view basic reports |
| VOLUNTEER | Can only scan tickets |

### User Flow
1. Organizer creates an event (auto-assigned OWNER)
2. Organizer goes to Settings → Staff Management
3. Invites staff member by email
4. Assigns role (MANAGER/STAFF/VOLUNTEER)
5. Staff member accepts invite
6. Staff sees role-appropriate dashboard

---

## Acceptance Criteria

### Functional Requirements
- [ ] Define role types: OWNER, MANAGER, STAFF, VOLUNTEER
- [ ] Create role assignment UI in organizer settings
- [ ] Permission matrix: who can do what (scanning, cash, refunds)
- [ ] Role-based dashboard sections (hide irrelevant modules)
- [ ] Invitation flow for adding new staff members
- [ ] Role change audit log

### Non-Functional Requirements
- [ ] Security: Enforce permissions server-side
- [ ] UX: Clear role descriptions in assignment UI
- [ ] Performance: Role check < 50ms

---

## Technical Implementation

### Database Changes

#### Convex Schema Additions
```typescript
// convex/schema.ts

// Staff role enum
export const staffRoles = v.union(
  v.literal("OWNER"),
  v.literal("MANAGER"),
  v.literal("STAFF"),
  v.literal("VOLUNTEER")
);

// Add to eventStaff table or create new table
defineTable("organizerStaff", {
  organizerId: v.id("users"),
  staffUserId: v.id("users"),
  role: staffRoles,
  invitedAt: v.number(),
  acceptedAt: v.optional(v.number()),
  status: v.union(v.literal("pending"), v.literal("active"), v.literal("removed")),
});

// Permission matrix
defineTable("rolePermissions", {
  role: staffRoles,
  permissions: v.array(v.string()),
}).index("by_role", ["role"]);
```

### Permission Definitions
```typescript
// convex/staff/permissions.ts (NEW FILE)
export const PERMISSIONS = {
  OWNER: [
    "event:create", "event:edit", "event:delete",
    "staff:invite", "staff:remove", "staff:change_role",
    "tickets:scan", "tickets:refund",
    "orders:view", "orders:process_cash",
    "reports:view_all", "reports:export",
    "settings:edit"
  ],
  MANAGER: [
    "event:edit",
    "staff:invite", "staff:remove",
    "tickets:scan", "tickets:refund",
    "orders:view", "orders:process_cash",
    "reports:view_all",
  ],
  STAFF: [
    "tickets:scan",
    "orders:view", "orders:process_cash",
    "reports:view_basic",
  ],
  VOLUNTEER: [
    "tickets:scan",
  ],
} as const;

export function hasPermission(role: string, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) || false;
}
```

### Role Check Hook
```typescript
// src/hooks/useStaffRole.ts (NEW FILE)
export function useStaffRole(organizerId?: string) {
  const user = useCurrentUser();
  const staffRecord = useQuery(api.staff.getMyRole, { organizerId });

  return {
    role: staffRecord?.role || null,
    permissions: PERMISSIONS[staffRecord?.role] || [],
    hasPermission: (p: string) => hasPermission(staffRecord?.role, p),
    isOwner: staffRecord?.role === "OWNER",
    isManager: ["OWNER", "MANAGER"].includes(staffRecord?.role),
  };
}
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `convex/staff/permissions.ts` | Permission matrix |
| `convex/staff/queries.ts` | Staff role queries |
| `convex/staff/mutations.ts` | Invite, assign, remove mutations |
| `src/hooks/useStaffRole.ts` | Role check hook |
| `src/app/organizer/settings/staff/page.tsx` | Staff management UI |
| `src/components/staff/InviteStaffModal.tsx` | Invite flow |
| `src/components/staff/RoleSelector.tsx` | Role dropdown |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add organizerStaff table |
| `src/app/organizer/layout.tsx` | Fetch actual staff roles |
| `src/app/organizer/[eventId]/layout.tsx` | Apply role-based visibility |

---

## Dependencies

### Internal Dependencies
- Depends on: None
- Blocks: Story 13.7 (Seating Templates API)

---

## Testing Requirements

### Unit Tests
- [ ] Test permission matrix lookups
- [ ] Test hasPermission function
- [ ] Test role assignment mutation

### Integration Tests
- [ ] Test invite → accept flow
- [ ] Test role change updates permissions

### Manual Testing
- [ ] Invite staff by email
- [ ] Assign different roles
- [ ] Verify dashboard visibility changes

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Roles enforced server-side
- [ ] UI shows appropriate sections per role
- [ ] Tests passing
- [ ] Committed with: `feat(story-13-4): implement staff role system`

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   git checkout -b feat/story-13-4-staff-roles
   ```

2. Implementation order:
   - Schema changes (organizerStaff table)
   - Permission matrix
   - Queries and mutations
   - UI components
   - Layout integration

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-13-4): implement staff role system"
   git push origin feat/story-13-4-staff-roles
   ```

---

*Created by SM Agent | BMAD-METHOD*
