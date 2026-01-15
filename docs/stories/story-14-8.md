# Story 14.8: Ticket Distribution to Team

## Status
| Field | Value |
|-------|-------|
| Status | Draft |
| Priority | P1 |
| Estimate | S (3 pts) |
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
- [ ] Create feature branch: `git checkout -b feat/story-14-8-ticket-distribution`

---

## User Story

**As an** event organizer
**I want to** distribute comp tickets to my team members
**So that** staff can have access to the event they're working

---

## Description

### Background
The ticket distribution page at `src/app/organizer/team/distribution/page.tsx` currently redirects to the team page with a "coming soon" comment. Organizers need to be able to give complimentary tickets to their staff/team members.

### Current State
```typescript
// src/app/organizer/team/distribution/page.tsx
export default function TicketDistributionPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main team page (ticket distribution feature coming soon)
    router.replace("/organizer/team");
  }, [router]);
  // ...
}
```

### User Flow
1. Organizer navigates to Team > Distribute Tickets
2. Organizer selects an event from their events
3. Organizer sees list of team members
4. Organizer selects ticket type and quantity per member
5. Organizer clicks "Distribute"
6. System creates comp tickets and notifies team members
7. Team members receive email with their tickets

---

## Acceptance Criteria

### Functional Requirements
- [ ] Create distribution page UI with event and team member selector
- [ ] Create `distributeTicketsToStaff` mutation
- [ ] Select event from organizer's active events
- [ ] Select ticket type and quantity per team member
- [ ] Track distributed tickets separately from sales (isComp: true)
- [ ] Email notification to staff when tickets assigned
- [ ] View distributed tickets from organizer dashboard
- [ ] Revoke/cancel distributed tickets if needed

### Non-Functional Requirements
- [ ] Performance: Distribution < 3 seconds for up to 20 tickets
- [ ] Limit: Max 50 comp tickets per event (configurable)
- [ ] Distributed tickets don't count toward sales metrics
- [ ] Distributed tickets are clearly marked as "Comp"

---

## Technical Implementation

### Schema Changes
```typescript
// convex/schema.ts - Add fields to ticketInstances table
ticketInstances: defineTable({
  // ... existing fields
  isComp: v.optional(v.boolean()), // NEW: true if comp ticket
  distributedAt: v.optional(v.number()), // NEW: when distributed
  distributedById: v.optional(v.id("users")), // NEW: who distributed
  distributedToEmail: v.optional(v.string()), // NEW: recipient email
})
  // ... existing indexes
  .index("by_comp", ["isComp"]) // NEW: filter comp tickets
```

### Mutation Implementation
```typescript
// convex/tickets/mutations.ts

export const distributeTicketsToStaff = mutation({
  args: {
    eventId: v.id("events"),
    distributions: v.array(
      v.object({
        email: v.string(),
        name: v.string(),
        ticketTypeId: v.id("ticketTypes"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");

    // Verify organizer owns this event
    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized to distribute tickets for this event");
    }

    // Check comp ticket limit
    const existingCompTickets = await ctx.db
      .query("ticketInstances")
      .filter((q) =>
        q.and(
          q.eq(q.field("eventId"), args.eventId),
          q.eq(q.field("isComp"), true)
        )
      )
      .collect();

    const totalNewTickets = args.distributions.reduce(
      (sum, d) => sum + d.quantity,
      0
    );

    if (existingCompTickets.length + totalNewTickets > 50) {
      throw new Error(
        `Comp ticket limit exceeded. ${existingCompTickets.length} already distributed, max 50.`
      );
    }

    const createdTickets: string[] = [];

    for (const distribution of args.distributions) {
      const ticketType = await ctx.db.get(distribution.ticketTypeId);
      if (!ticketType) continue;

      for (let i = 0; i < distribution.quantity; i++) {
        // Generate unique ticket number
        const ticketNumber = `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const ticketId = await ctx.db.insert("ticketInstances", {
          eventId: args.eventId,
          ticketTypeId: distribution.ticketTypeId,
          ticketNumber,
          status: "VALID",
          isComp: true,
          distributedAt: Date.now(),
          distributedById: user._id,
          distributedToEmail: distribution.email,
          createdAt: Date.now(),
        });

        createdTickets.push(ticketId);
      }

      // Send notification email
      await ctx.scheduler.runAfter(0, internal.email.sendCompTicketEmail, {
        recipientEmail: distribution.email,
        recipientName: distribution.name,
        eventName: event.title,
        ticketCount: distribution.quantity,
        ticketType: ticketType.name,
        organizerName: user.name || "Event Organizer",
      });
    }

    return {
      success: true,
      ticketsCreated: createdTickets.length,
    };
  },
});

export const revokeCompTicket = mutation({
  args: {
    ticketId: v.id("ticketInstances"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (!ticket.isComp) throw new Error("Can only revoke comp tickets");

    // Verify organizer owns the event
    const event = await ctx.db.get(ticket.eventId);
    if (!event || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.ticketId, {
      status: "REVOKED",
      revokedAt: Date.now(),
      revokedById: user._id,
    });

    return { success: true };
  },
});
```

### Query for Distributed Tickets
```typescript
// convex/tickets/queries.ts

export const getDistributedTickets = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user) return [];

    // Verify organizer owns event
    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizerId !== user._id) return [];

    const compTickets = await ctx.db
      .query("ticketInstances")
      .filter((q) =>
        q.and(
          q.eq(q.field("eventId"), args.eventId),
          q.eq(q.field("isComp"), true)
        )
      )
      .collect();

    // Group by recipient email
    const grouped = compTickets.reduce((acc, ticket) => {
      const email = ticket.distributedToEmail || "unknown";
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(ticket);
      return acc;
    }, {} as Record<string, typeof compTickets>);

    return Object.entries(grouped).map(([email, tickets]) => ({
      email,
      tickets,
      totalTickets: tickets.length,
      validTickets: tickets.filter((t) => t.status === "VALID").length,
    }));
  },
});
```

### Component Structure
```
convex/
├── schema.ts              # MODIFY - Add comp ticket fields
├── tickets/
│   ├── mutations.ts       # MODIFY - Add distributeTicketsToStaff, revokeCompTicket
│   └── queries.ts         # MODIFY - Add getDistributedTickets
├── email/
│   └── internal.ts        # MODIFY - Add sendCompTicketEmail
src/
├── app/organizer/team/distribution/
│   └── page.tsx           # MODIFY - Full distribution UI
├── components/organizer/
│   └── TicketDistributionForm.tsx  # NEW - Distribution form component
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/organizer/TicketDistributionForm.tsx` | Distribution form component |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add comp ticket fields to ticketInstances |
| `convex/tickets/mutations.ts` | Add distributeTicketsToStaff, revokeCompTicket |
| `convex/tickets/queries.ts` | Add getDistributedTickets |
| `convex/email/internal.ts` | Add sendCompTicketEmail |
| `src/app/organizer/team/distribution/page.tsx` | Full distribution UI |

### Files to Delete
| File | Reason |
|------|--------|
| None | |

---

## Dependencies

### External Packages
```bash
# No new packages required
```

### Internal Dependencies
- Depends on: None (independent of Story 14.1)
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test distributeTicketsToStaff with valid data
- [ ] Test comp ticket limit enforcement (50 max)
- [ ] Test distributeTicketsToStaff rejects non-organizer
- [ ] Test revokeCompTicket only revokes comp tickets
- [ ] Test getDistributedTickets groups by email

### Integration Tests
- [ ] Test full distribution flow: select -> distribute -> verify
- [ ] Test email notification sent after distribution

### Manual Testing
- [ ] Distribute tickets to team member
- [ ] Verify email received with ticket info
- [ ] View distributed tickets in dashboard
- [ ] Revoke a distributed ticket
- [ ] Verify ticket status shows "REVOKED"
- [ ] Try to exceed 50 comp ticket limit

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Distribution page functional
- [ ] Comp tickets tracked separately
- [ ] Email notifications working
- [ ] Revocation working
- [ ] Unit tests written and passing
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Committed with: `feat(story-14-8): implement ticket distribution to team`

---

## Notes for Dev Agent

### Important Considerations
1. **Comp vs Paid** - Clearly differentiate comp tickets from purchased tickets
2. **Sales Metrics** - Comp tickets should NOT appear in sales reports
3. **Ticket Numbers** - Use COMP- prefix for easy identification
4. **Email Templates** - Create friendly comp ticket notification email

### UI Design Notes
```typescript
// Distribution form structure
<Card>
  <CardHeader>
    <CardTitle>Distribute Tickets</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Event selector */}
    <Select ... />

    {/* Team member list with ticket allocation */}
    {teamMembers.map(member => (
      <div key={member.email}>
        <span>{member.name}</span>
        <Select ticketType />
        <Input quantity />
      </div>
    ))}

    <Button>Distribute Tickets</Button>
  </CardContent>
</Card>
```

### Questions Resolved
| Question | Answer |
|----------|--------|
| Comp ticket limit per event? | 50 (configurable) |
| Count toward sales? | No |
| Can be revoked? | Yes, by organizer |
| Email notification? | Yes, when distributed |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-14-8-ticket-distribution
   ```

2. Implementation order:
   - Update schema with comp ticket fields
   - Create distributeTicketsToStaff mutation
   - Create getDistributedTickets query
   - Create revokeCompTicket mutation
   - Add email notification for comp tickets
   - Build distribution page UI
   - Tests

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-14-8): implement ticket distribution to team"
   git push origin feat/story-14-8-ticket-distribution
   ```

4. Update this story status to Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
