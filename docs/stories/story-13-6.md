# Story 13.6: Event Type Mapping Cleanup

## Status
| Field | Value |
|-------|-------|
| Status | 🟢 Approved |
| Priority | P1 (High) |
| Estimate | S (3 pts) |
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
- [ ] Create feature branch: `git checkout -b feat/story-13-6-event-types`

---

## User Story

**As a** developer
**I want** proper event types without workarounds
**So that** the codebase is clean and maintainable

---

## Description

### Background
The event creation page at `src/app/organizer/events/create/page.tsx:460` has a temporary workaround that maps GENERAL_POSTING to FREE_EVENT. This creates inconsistency and technical debt.

### Current State
```typescript
// Line 460-461
// TODO: Remove this mapping once convex/events/mutations.ts is deployed with GENERAL_POSTING support
const backendEventType = eventType === "GENERAL_POSTING" ? "FREE_EVENT" : eventType;
```

### Proper Event Types
| Type | Description | Has Tickets | Has Price |
|------|-------------|-------------|-----------|
| TICKETED | Standard paid event | ✅ | ✅ |
| FREE | Free event with registration | ✅ | ❌ |
| RSVP | RSVP-only, no tickets | ❌ | ❌ |
| GENERAL_POSTING | Information only, no registration | ❌ | ❌ |

---

## Acceptance Criteria

### Functional Requirements
- [ ] Define proper event type enum: TICKETED, FREE, RSVP, GENERAL_POSTING
- [ ] Update Convex schema to support all types
- [ ] Update event creation form with all valid types
- [ ] Migrate existing mistyped events (if any)
- [ ] Type-specific validation rules (FREE cannot have ticket prices)
- [ ] Update event cards to display type appropriately
- [ ] Remove workaround code from frontend

### Non-Functional Requirements
- [ ] Backward compatibility for existing events
- [ ] TypeScript types updated across codebase

---

## Technical Implementation

### Database Changes

#### Convex Schema Update
```typescript
// convex/schema.ts - Update eventType

export const eventTypes = v.union(
  v.literal("TICKETED"),      // Paid event with tickets
  v.literal("FREE"),          // Free event with registration
  v.literal("RSVP"),          // RSVP only, no ticket system
  v.literal("GENERAL_POSTING"), // Info only, no registration
  v.literal("CLASS"),         // Class/workshop (instructor-led)
);

// Update events table
eventType: eventTypes,
```

### Validation Rules
```typescript
// convex/events/validation.ts (NEW FILE)
export function validateEventByType(eventType: string, data: any): string[] {
  const errors: string[] = [];

  switch (eventType) {
    case "TICKETED":
      if (!data.ticketTypes?.length) {
        errors.push("Ticketed events must have at least one ticket type");
      }
      if (data.ticketTypes?.some(t => t.priceCents <= 0)) {
        errors.push("Ticketed events must have prices > $0");
      }
      break;

    case "FREE":
      if (data.ticketTypes?.some(t => t.priceCents > 0)) {
        errors.push("Free events cannot have ticket prices");
      }
      break;

    case "RSVP":
      if (data.ticketTypes?.length) {
        errors.push("RSVP events do not use ticket types");
      }
      break;

    case "GENERAL_POSTING":
      if (data.ticketTypes?.length || data.maxAttendees) {
        errors.push("General postings do not support registration");
      }
      break;
  }

  return errors;
}
```

### Migration Script
```typescript
// convex/migrations/fixEventTypes.ts (NEW FILE)
import { internalMutation } from "./_generated/server";

export const migrateEventTypes = internalMutation({
  handler: async (ctx) => {
    // Find any events that might have been mapped incorrectly
    const events = await ctx.db.query("events").collect();

    let fixed = 0;
    for (const event of events) {
      // Check if FREE_EVENT should actually be GENERAL_POSTING
      if (event.eventType === "FREE_EVENT" && !event.ticketTypes?.length && !event.maxAttendees) {
        await ctx.db.patch(event._id, { eventType: "GENERAL_POSTING" });
        fixed++;
      }
    }

    return { fixed };
  },
});
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `convex/events/validation.ts` | Type-specific validation |
| `convex/migrations/fixEventTypes.ts` | Migration script |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add GENERAL_POSTING to eventTypes |
| `convex/events/mutations.ts` | Add validation by type |
| `src/app/organizer/events/create/page.tsx` | Remove workaround, add all types |
| `src/components/events/EventCard.tsx` | Display type appropriately |
| `src/components/events/EventTypeSelector.tsx` | Include all types |

---

## Dependencies

### Internal Dependencies
- Depends on: None
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test validation for each event type
- [ ] Test type-specific rules (FREE no prices, etc.)

### Integration Tests
- [ ] Test event creation for each type
- [ ] Test migration script

### Manual Testing
- [ ] Create event of each type
- [ ] Verify type displays correctly
- [ ] Run migration on staging

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All event types supported
- [ ] Workaround code removed
- [ ] Migration script tested
- [ ] Tests passing
- [ ] Committed with: `feat(story-13-6): clean up event type mapping`

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   git checkout -b feat/story-13-6-event-types
   ```

2. Implementation order:
   - Schema update first
   - Validation logic
   - Migration script
   - Frontend updates
   - Remove workaround

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-13-6): clean up event type mapping"
   git push origin feat/story-13-6-event-types
   ```

---

*Created by SM Agent | BMAD-METHOD*
