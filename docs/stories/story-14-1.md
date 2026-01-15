# Story 14.1: Associate Creation Backend

## Status
| Field | Value |
|-------|-------|
| Status | Draft |
| Priority | P0 (Critical) |
| Estimate | L (8 pts) |
| Epic | Sprint 14 - Platform Polish & Team Features |
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
- [ ] Create feature branch: `git checkout -b feat/story-14-1-associate-creation`

---

## User Story

**As a** team leader
**I want to** add associates to my sales team
**So that** they can sell tickets on my behalf and I can track their performance

---

## Description

### Background
The UI for adding associates exists at `src/app/team/my-associates/add/page.tsx`, but the backend mutation to actually create associates is missing. Line 27 contains a TODO comment indicating the mutation needs to be implemented.

### Current State
```typescript
// src/app/team/my-associates/add/page.tsx:27
// TODO: Add mutation to create associate when backend supports it
toast.success("Associate invitation sent!");
```

The form collects name, email, and phone, but data is never persisted.

### User Flow
1. Team leader navigates to My Associates > Add Associate
2. Team leader fills in associate name, email, and phone
3. Team leader clicks "Add Associate"
4. System validates email uniqueness and team limit
5. System creates associate record with PENDING status
6. System sends invitation email via Postal
7. Associate receives email and clicks link to accept
8. Associate creates account or links existing account
9. Associate status changes to ACTIVE

---

## Acceptance Criteria

### Functional Requirements
- [ ] Create `convex/associates/schema.ts` with associate data model
- [ ] Create `convex/associates/mutations.ts` with `createAssociate` mutation
- [ ] Associate fields: name, email, phone, status, invitedAt, joinedAt, invitedById, teamLeaderId
- [ ] Wire up `src/app/team/my-associates/add/page.tsx` to call createAssociate mutation
- [ ] Send invitation email via Postal when associate is created
- [ ] Associate statuses: PENDING, ACTIVE, SUSPENDED, REMOVED
- [ ] Validation: email uniqueness per team (same email can be on different teams)
- [ ] Validation: max 50 associates per team leader
- [ ] Create `acceptInvitation` mutation for associates to join
- [ ] Team leader can view pending vs active associates in list

### Non-Functional Requirements
- [ ] Performance: Associate creation < 2 seconds
- [ ] Security: Invitation tokens expire after 7 days
- [ ] Security: Only team leader can add/manage their associates
- [ ] Reliability: Fallback to in-app notification if email fails

---

## Technical Implementation

### Database Changes

#### Convex Schema - New Table
```typescript
// convex/associates/schema.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const associatesTable = defineTable({
  // Basic info
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),

  // Relationships
  teamLeaderId: v.id("users"),
  userId: v.optional(v.id("users")), // Set when they accept invitation
  invitedById: v.id("users"),

  // Status tracking
  status: v.union(
    v.literal("PENDING"),
    v.literal("ACTIVE"),
    v.literal("SUSPENDED"),
    v.literal("REMOVED")
  ),

  // Timestamps
  invitedAt: v.number(),
  joinedAt: v.optional(v.number()),
  suspendedAt: v.optional(v.number()),
  removedAt: v.optional(v.number()),

  // Invitation
  invitationToken: v.string(),
  invitationExpiresAt: v.number(),
})
  .index("by_team_leader", ["teamLeaderId"])
  .index("by_user", ["userId"])
  .index("by_email", ["email"])
  .index("by_invitation_token", ["invitationToken"]);
```

### Mutation Implementation
```typescript
// convex/associates/mutations.ts
export const createAssociate = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");

    // Check associate limit (50 max)
    const existingAssociates = await ctx.db
      .query("associates")
      .withIndex("by_team_leader", (q) => q.eq("teamLeaderId", user._id))
      .filter((q) => q.neq(q.field("status"), "REMOVED"))
      .collect();

    if (existingAssociates.length >= 50) {
      throw new Error("Maximum 50 associates per team");
    }

    // Check email uniqueness for this team
    const existingEmail = existingAssociates.find(
      (a) => a.email.toLowerCase() === args.email.toLowerCase()
    );
    if (existingEmail) {
      throw new Error("Associate with this email already exists on your team");
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    const invitationExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Create associate
    const associateId = await ctx.db.insert("associates", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      teamLeaderId: user._id,
      invitedById: user._id,
      status: "PENDING",
      invitedAt: Date.now(),
      invitationToken,
      invitationExpiresAt,
    });

    // Schedule email sending via HTTP action
    await ctx.scheduler.runAfter(0, internal.associates.sendInvitationEmail, {
      associateId,
      invitationToken,
      teamLeaderName: user.name || "A team leader",
    });

    return { success: true, associateId };
  },
});
```

### Component Structure
```
convex/
├── associates/
│   ├── schema.ts          # NEW - Associate table definition
│   ├── mutations.ts       # NEW - createAssociate, acceptInvitation
│   ├── queries.ts         # NEW - getMyAssociates, getAssociateById
│   └── internal.ts        # NEW - sendInvitationEmail
├── schema.ts              # MODIFY - Add associates table
src/
├── app/team/my-associates/
│   ├── add/page.tsx       # MODIFY - Wire up mutation
│   └── page.tsx           # MODIFY - Show pending vs active
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `convex/associates/schema.ts` | Associate table schema definition |
| `convex/associates/mutations.ts` | CRUD mutations for associates |
| `convex/associates/queries.ts` | Queries for listing associates |
| `convex/associates/internal.ts` | Internal functions (email sending) |
| `src/app/team/my-associates/[id]/page.tsx` | Associate detail/edit page |
| `src/app/invite/accept/page.tsx` | Invitation acceptance page |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add associates table import |
| `src/app/team/my-associates/add/page.tsx` | Wire up createAssociate mutation |
| `src/app/team/my-associates/page.tsx` | Display pending vs active status |

### Files to Delete
| File | Reason |
|------|--------|
| None | |

---

## Dependencies

### External Packages
```bash
# No new packages required
# Uses existing Postal integration for emails
```

### Environment Variables
```bash
# Existing - no new env vars needed
POSTAL_API_KEY=existing
POSTAL_API_URL=existing
```

### Internal Dependencies
- Depends on: None
- Blocks: Story 14.2 (Sales Leaderboard)

---

## Testing Requirements

### Unit Tests
- [ ] Test createAssociate with valid data
- [ ] Test createAssociate rejects when at 50 associate limit
- [ ] Test createAssociate rejects duplicate email on same team
- [ ] Test invitation token generation and expiration
- [ ] Test acceptInvitation links user account

### Integration Tests
- [ ] Test full flow: create associate -> send email -> accept invitation
- [ ] Test invitation expiration (7 days)
- [ ] Test associate status transitions

### Manual Testing
- [ ] Create associate from UI
- [ ] Verify invitation email received
- [ ] Accept invitation with existing account
- [ ] Accept invitation with new account
- [ ] View pending vs active in list
- [ ] Verify 50 associate limit error message

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Associate creation functional end-to-end
- [ ] Invitation emails sending correctly
- [ ] Associate list shows correct status
- [ ] Committed with: `feat(story-14-1): implement associate creation backend`

---

## Notes for Dev Agent

### Important Considerations
1. **Email Integration** - Use existing Postal setup in `src/lib/email/`
2. **Token Security** - Use crypto.randomUUID() for invitation tokens
3. **Status Flow** - PENDING -> ACTIVE or PENDING -> expired (7 days)
4. **Convex Scheduler** - Use scheduler.runAfter for async email sending

### Related Code Examples
```typescript
// Existing email pattern in convex/notifications/
await ctx.scheduler.runAfter(0, internal.email.sendEmail, {
  to: recipientEmail,
  subject: "Subject",
  html: htmlContent,
});
```

### Questions Resolved
| Question | Answer |
|----------|--------|
| Max associates per team? | 50 |
| Invitation expiration? | 7 days |
| Same email different teams? | Allowed |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-14-1-associate-creation
   ```

2. Implementation order:
   - Schema definition first (associates table)
   - Mutations (createAssociate, acceptInvitation)
   - Queries (getMyAssociates)
   - Wire up frontend page
   - Email sending integration
   - Tests

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-14-1): implement associate creation backend"
   git push origin feat/story-14-1-associate-creation
   ```

4. Update this story status to Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
