# Story 12.1: Seat Reservation Auto-Release

## Status
| Field | Value |
|-------|-------|
| Status | ✅ Done |
| Priority | P1 (High) |
| Estimate | M (5 pts) |
| Epic | Sprint 12 - Core Features & Code Quality |
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

---

## User Story

**As an** event attendee
**I want to** have expired seat holds automatically released
**So that** I can book seats that were abandoned by others

---

## Description

### Background
When users select seats during checkout, those seats are temporarily held for 15 minutes to prevent double-booking. If a user abandons checkout or doesn't complete their purchase, those seats should be released automatically so other attendees can book them.

### Current Implementation (Already Complete)

The seat reservation auto-release system is fully implemented across multiple layers:

#### Backend (Cron Job)
- `convex/crons.ts:45-53` - Cron job configured to run every 5 minutes
- `convex/seating/seatHoldsCron.ts` - Full implementation of `releaseExpiredSeatHolds()`

#### Backend (Mutations)
- `convex/seating/mutations.ts:481-554` - `holdSeatsForSession()` creates 15-minute holds
- `convex/seating/mutations.ts:559-619` - `releaseSessionHolds()` for manual release
- `convex/seating/mutations.ts:624-673` - `cleanupExpiredSessionHolds()` on-demand cleanup

#### Frontend (Real-time Updates)
- `src/components/seating/InteractiveSeatingChart.tsx:102-116` - Runs cleanup every 30 seconds
- Convex real-time subscriptions automatically update UI when seats are released

---

## Acceptance Criteria

### Functional Requirements
- [x] Seats held longer than 15 minutes are auto-released
- [x] Cron job runs every 5 minutes to check expired holds
- [x] Released seats become available immediately
- [x] User notified if their hold expires (via real-time UI update)

### Technical Verification
- [x] `seatHoldsCron.ts:37` - Checks `seat.sessionExpiry < now`
- [x] `seatHoldsCron.ts:45` - Sets `status: "AVAILABLE"` on release
- [x] `crons.ts:49` - Cron interval set to 5 minutes
- [x] Real-time subscriptions update UI automatically

---

## Technical Implementation

### Cron Job Configuration
```typescript
// convex/crons.ts:45-53
crons.interval(
  "release-expired-seat-holds",
  { minutes: 5 }, // Check every 5 minutes
  internal.seating.seatHoldsCron.releaseExpiredSeatHolds
);
```

### Release Logic
```typescript
// convex/seating/seatHoldsCron.ts (simplified)
export const releaseExpiredSeatHolds = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    for (const chart of seatingCharts) {
      for (const seat of chart.sections.tables.seats) {
        if (seat.status === "RESERVED" &&
            seat.sessionExpiry &&
            seat.sessionExpiry < now) {
          // Release the hold
          seat.status = "AVAILABLE";
          seat.sessionId = undefined;
          seat.sessionExpiry = undefined;
        }
      }
    }
  }
});
```

### Hold Creation (15-minute expiry)
```typescript
// convex/seating/mutations.ts:502
const expiryTime = Date.now() + 15 * 60 * 1000; // 15 minutes from now
```

### Frontend Cleanup
```typescript
// InteractiveSeatingChart.tsx:102-116
useEffect(() => {
  // Run cleanup every 30 seconds (in addition to cron)
  cleanupIntervalRef.current = setInterval(() => {
    cleanupExpired({ eventId }).catch(console.error);
  }, 30000);

  return () => {
    // Release all seats when component unmounts
    releaseSeats({ eventId, sessionId });
  };
}, [eventId, sessionId]);
```

---

## File List

### Implementation Files
| File | Purpose |
|------|---------|
| `convex/crons.ts` | Cron job configuration (lines 45-53) |
| `convex/seating/seatHoldsCron.ts` | Release expired holds logic |
| `convex/seating/mutations.ts` | holdSeatsForSession, releaseSessionHolds, cleanupExpiredSessionHolds |
| `src/components/seating/InteractiveSeatingChart.tsx` | Frontend cleanup + real-time updates |

---

## Definition of Done

- [x] Auth check implemented (session-based for cart holds)
- [x] 15-minute hold expiry configured
- [x] Cron job runs every 5 minutes
- [x] Released seats become available immediately
- [x] Real-time UI updates notify users
- [x] Code reviewed by QA agent

---

## Notes

### Why Session-Based (Not User-Based)
Seat holds use `sessionId` instead of `userId` because:
1. Allows anonymous users to hold seats during checkout
2. Standard shopping cart pattern (Amazon, Ticketmaster, etc.)
3. User notification happens via Convex real-time UI updates
4. No need for push notifications for cart timeout

### UX Flow
1. User selects seat → `holdSeatsForSession()` creates 15-minute hold
2. Frontend shows seat as "selected"
3. If user completes checkout → seat becomes permanently reserved
4. If user abandons → cron releases after 15 minutes
5. Convex real-time updates other users' UI to show seat available

---

*Created by SM Agent | BMAD-METHOD*
*Story was already implemented before Sprint 12*
