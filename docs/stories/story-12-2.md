# Story 12.2: PayPal Dispute Management

## Status
| Field | Value |
|-------|-------|
| Status | ✅ Done |
| Priority | P0 (Critical) |
| Estimate | L (8 pts) |
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

**As an** admin
**I want to** view and manage payment disputes from PayPal and Stripe
**So that** I can respond to chargebacks and protect revenue

---

## Description

### Background
Payment disputes (chargebacks) require immediate attention to prevent revenue loss. Admins need visibility into all disputes, their status, and tools to respond effectively within tight deadlines.

### Implementation Overview

The dispute management system consists of:
1. **Webhook Handlers** - Receive dispute events from PayPal/Stripe
2. **Database Schema** - Store dispute details and history
3. **Backend Queries/Mutations** - Admin operations
4. **Admin UI** - Dashboard for dispute management

---

## Acceptance Criteria

### Functional Requirements
- [x] PayPal dispute webhooks create records in database
- [x] Stripe dispute webhooks create records in database
- [x] Admin can view all disputes with filtering
- [x] Admin can add internal notes to disputes
- [x] Admin can mark evidence as submitted
- [x] Dashboard shows dispute statistics
- [x] Disputes show response deadline
- [x] Links to PayPal/Stripe resolution centers provided

### Technical Verification
- [x] `paymentDisputes` table in schema (line 3691)
- [x] PayPal webhook handlers (lines 357-518 in route.ts)
- [x] `createDispute` mutation for webhook processing
- [x] `resolveDispute` mutation for status updates
- [x] `getAdminDisputes` query with filtering
- [x] `getDisputeStats` query for dashboard
- [x] Admin disputes page at `/admin/disputes`

---

## Technical Implementation

### Database Schema
```typescript
// convex/schema.ts:3691
paymentDisputes: defineTable({
  externalId: v.string(),           // PayPal/Stripe dispute ID
  provider: v.union(v.literal("PAYPAL"), v.literal("STRIPE")),
  orderId: v.optional(v.id("orders")),
  ticketId: v.optional(v.id("tickets")),
  amount: v.number(),
  currency: v.string(),
  reason: v.string(),
  status: v.union(
    v.literal("OPEN"),
    v.literal("UNDER_REVIEW"),
    v.literal("RESOLVED"),
    v.literal("WON"),
    v.literal("LOST")
  ),
  responseDeadline: v.optional(v.number()),
  evidenceSubmitted: v.boolean(),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### Webhook Handler
```typescript
// src/app/api/webhooks/paypal/route.ts:357-518
// Handles CUSTOMER.DISPUTE.CREATED and related events
case "CUSTOMER.DISPUTE.CREATED":
  const dispute = await createDispute(ctx, {
    externalId: resource.dispute_id,
    provider: "PAYPAL",
    amount: parseFloat(resource.amount.value),
    currency: resource.amount.currency_code,
    reason: resource.reason,
    status: "OPEN",
    responseDeadline: new Date(resource.seller_response_due_date).getTime(),
  });
```

### Admin Queries
```typescript
// convex/paymentDisputes/queries.ts

// Get all disputes with optional filtering
export const getAdminDisputes = query({
  args: {
    status: v.optional(disputeStatusValidator),
    provider: v.optional(providerValidator),
  },
  handler: async (ctx, args) => {
    // Verifies admin role, returns filtered disputes
  },
});

// Dashboard statistics
export const getDisputeStats = query({
  args: {},
  handler: async (ctx) => {
    // Returns counts by status + at-risk amount
  },
});
```

### Admin Mutations
```typescript
// convex/paymentDisputes/mutations.ts

export const addDisputeNotes = mutation({
  args: {
    disputeId: v.id("paymentDisputes"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    // Appends notes with timestamp
  },
});

export const markEvidenceSubmitted = mutation({
  args: {
    disputeId: v.id("paymentDisputes"),
  },
  handler: async (ctx, args) => {
    // Sets evidenceSubmitted = true
  },
});
```

---

## File List

### Files Created
| File | Purpose |
|------|---------|
| `src/app/admin/disputes/page.tsx` | Admin disputes management UI (441 lines) |

### Files Already Implemented (Before Sprint 12)
| File | Purpose |
|------|---------|
| `convex/paymentDisputes/mutations.ts` | Backend mutations (288 lines) |
| `convex/paymentDisputes/queries.ts` | Backend queries (291 lines) |
| `src/app/api/webhooks/paypal/route.ts` | PayPal webhook handlers |
| `convex/schema.ts` | paymentDisputes table definition |

---

## Definition of Done

- [x] PayPal webhooks create dispute records
- [x] Stripe webhooks create dispute records
- [x] Admin can view disputes filtered by status/provider
- [x] Admin can add notes to disputes
- [x] Admin can mark evidence submitted
- [x] Dashboard shows statistics
- [x] Response deadlines displayed
- [x] Code reviewed by QA agent

---

## Admin UI Features

### Statistics Dashboard
| Stat | Description |
|------|-------------|
| Open Disputes | Count of status = "OPEN" |
| Under Review | Count of status = "UNDER_REVIEW" |
| Won | Count of status = "WON" |
| Lost | Count of status = "LOST" |
| At Risk | Sum of amounts for OPEN + UNDER_REVIEW |

### Filtering Options
- **Status**: All, Open, Under Review, Resolved, Won, Lost
- **Provider**: All, PayPal, Stripe

### Dispute Detail Panel
- Order information with link
- Amount and reason
- Response deadline with countdown
- Evidence submission status
- Internal notes with timestamps
- Action buttons: Add Notes, Mark Evidence Submitted

### External Links
- "View in PayPal" - Opens PayPal Resolution Center
- "View in Stripe" - Opens Stripe Dashboard Disputes

---

## Notes

### Dispute Lifecycle
1. **OPEN** - New dispute received via webhook
2. **UNDER_REVIEW** - Admin reviewing, gathering evidence
3. **RESOLVED** - Final status from provider pending
4. **WON** - Dispute resolved in seller's favor
5. **LOST** - Dispute resolved in buyer's favor (chargeback)

### Response Deadlines
- PayPal: Typically 10 days to respond
- Stripe: Typically 7-21 days depending on card network
- Deadlines displayed with visual urgency indicators

---

*Created by SM Agent | BMAD-METHOD*
*Backend implemented before Sprint 12, Admin UI added during Sprint 12*
