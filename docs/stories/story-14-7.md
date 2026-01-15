# Story 14.7: Ticket Order Number Schema Fix

## Status
| Field | Value |
|-------|-------|
| Status | Draft |
| Priority | P1 |
| Estimate | M (5 pts) |
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
- [ ] Create feature branch: `git checkout -b feat/story-14-7-order-number-schema`

---

## User Story

**As a** support agent
**I want** ticket enrichment with order details to work
**So that** I can look up complete ticket information for customer support

---

## Description

### Background
The ticket queries at `convex/tickets/queries.ts` have disabled functionality because the `orderNumber` field doesn't exist in the orders schema. The `getTicketByOrderNumber` query (line 195) and ticket enrichment are currently non-functional.

### Current State
```typescript
// convex/tickets/queries.ts:195-203
export const getTicketByOrderNumber = query({
  args: {
    orderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Function temporarily disabled - orderNumber field doesn't exist in schema
    return null;
  },
});
```

The email templates at `src/lib/email/types.ts` reference `orderNumber`, but the field doesn't exist in the database schema.

### User Flow
1. Customer makes purchase and receives order confirmation
2. Order number displayed in email: ORD-20260115-A1B2
3. Customer contacts support with order number
4. Support agent searches by order number
5. System returns order and associated tickets

---

## Acceptance Criteria

### Functional Requirements
- [ ] Add `orderNumber` field to orders table in schema
- [ ] Generate unique order numbers on order creation (format: ORD-YYYYMMDD-XXXX)
- [ ] Add index on orderNumber for fast lookups
- [ ] Re-enable `getTicketByOrderNumber` query
- [ ] Re-enable ticket enrichment in ticket detail queries
- [ ] Create migration to add order numbers to existing orders
- [ ] Order number visible on customer receipt emails

### Non-Functional Requirements
- [ ] Performance: Order lookup by number < 200ms
- [ ] Format: ORD-YYYYMMDD-XXXX (4 random alphanumeric chars)
- [ ] Uniqueness: Order numbers must be globally unique
- [ ] Migration: Non-destructive, can run multiple times safely

---

## Technical Implementation

### Schema Changes
```typescript
// convex/schema.ts - Update orders table
orders: defineTable({
  // ... existing fields
  orderNumber: v.string(), // NEW: ORD-YYYYMMDD-XXXX format
})
  .index("by_order_number", ["orderNumber"]) // NEW index
  // ... existing indexes
```

### Order Number Generation
```typescript
// convex/orders/mutations.ts

function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${randomChars}`;
}

// In createOrder mutation
export const createOrder = mutation({
  // ... existing args
  handler: async (ctx, args) => {
    // Generate unique order number
    let orderNumber: string;
    let isUnique = false;

    while (!isUnique) {
      orderNumber = generateOrderNumber();
      const existing = await ctx.db
        .query("orders")
        .withIndex("by_order_number", (q) => q.eq("orderNumber", orderNumber))
        .first();
      isUnique = !existing;
    }

    const orderId = await ctx.db.insert("orders", {
      ...args,
      orderNumber,
      createdAt: Date.now(),
    });

    return { orderId, orderNumber };
  },
});
```

### Re-enabled Query
```typescript
// convex/tickets/queries.ts

export const getTicketByOrderNumber = query({
  args: {
    orderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Find order by order number
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q) => q.eq("orderNumber", args.orderNumber))
      .first();

    if (!order) return null;

    // Get ticket instances for this order
    const tickets = await ctx.db
      .query("ticketInstances")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();

    // Enrich tickets with order and event data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const ticketType = await ctx.db.get(ticket.ticketTypeId);
        const event = ticketType
          ? await ctx.db.get(ticketType.eventId)
          : null;

        return {
          ...ticket,
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
          },
          ticketType,
          event,
        };
      })
    );

    return {
      order,
      tickets: enrichedTickets,
    };
  },
});
```

### Migration Function
```typescript
// convex/migrations/addOrderNumbers.ts

import { internalMutation } from "../_generated/server";

export const addOrderNumbersToExistingOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all orders without order numbers
    const ordersWithoutNumber = await ctx.db
      .query("orders")
      .filter((q) =>
        q.or(
          q.eq(q.field("orderNumber"), undefined),
          q.eq(q.field("orderNumber"), null)
        )
      )
      .collect();

    let updated = 0;
    const existingNumbers = new Set<string>();

    // First, collect all existing order numbers
    const allOrders = await ctx.db.query("orders").collect();
    for (const order of allOrders) {
      if (order.orderNumber) {
        existingNumbers.add(order.orderNumber);
      }
    }

    // Generate unique numbers for orders without them
    for (const order of ordersWithoutNumber) {
      let orderNumber: string;
      do {
        const dateStr = new Date(order.createdAt)
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");
        const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
        orderNumber = `ORD-${dateStr}-${randomChars}`;
      } while (existingNumbers.has(orderNumber));

      existingNumbers.add(orderNumber);

      await ctx.db.patch(order._id, { orderNumber });
      updated++;
    }

    return { updated, total: ordersWithoutNumber.length };
  },
});
```

### Component Structure
```
convex/
├── schema.ts              # MODIFY - Add orderNumber field and index
├── orders/
│   └── mutations.ts       # MODIFY - Generate order number on creation
├── tickets/
│   └── queries.ts         # MODIFY - Re-enable getTicketByOrderNumber
├── migrations/
│   └── addOrderNumbers.ts # NEW - Migration for existing orders
src/
├── lib/email/
│   └── receipt-templates.ts # VERIFY - Uses orderNumber correctly
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `convex/migrations/addOrderNumbers.ts` | Migration for existing orders |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add orderNumber field and index to orders |
| `convex/orders/mutations.ts` | Generate order number on order creation |
| `convex/tickets/queries.ts` | Re-enable getTicketByOrderNumber and enrichment |

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
- Depends on: None
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test order number generation format (ORD-YYYYMMDD-XXXX)
- [ ] Test order number uniqueness check
- [ ] Test getTicketByOrderNumber with valid order number
- [ ] Test getTicketByOrderNumber with invalid order number
- [ ] Test migration handles empty case
- [ ] Test migration handles existing order numbers

### Integration Tests
- [ ] Test full flow: create order -> verify order number -> lookup by number
- [ ] Test order number appears in receipt email

### Manual Testing
- [ ] Create new order, verify order number generated
- [ ] Run migration on existing orders
- [ ] Search by order number in support view
- [ ] Verify receipt email shows order number

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Schema updated with orderNumber field
- [ ] Index created for fast lookups
- [ ] Order number generated on new orders
- [ ] Migration run for existing orders
- [ ] Query re-enabled and functional
- [ ] Unit tests written and passing
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Committed with: `feat(story-14-7): add order number schema and enable ticket queries`

---

## Notes for Dev Agent

### Important Considerations
1. **Schema Migration** - Convex handles schema changes gracefully, but test thoroughly
2. **Uniqueness** - Generate and check, don't rely on index alone
3. **Date in Order Number** - Use order creation date for historical orders in migration
4. **Idempotent Migration** - Migration should be safe to run multiple times

### Order Number Format
```
ORD-YYYYMMDD-XXXX
 |      |      |
 |      |      +-- 4 random alphanumeric characters (A-Z, 0-9)
 |      +-- Date in format YYYYMMDD
 +-- Prefix for easy identification
```

### Example Order Numbers
- ORD-20260115-A1B2
- ORD-20260115-X9Y8
- ORD-20251225-ZABC

### Questions Resolved
| Question | Answer |
|----------|--------|
| Order number format? | ORD-YYYYMMDD-XXXX |
| Include time in order number? | No, date only |
| Migration approach? | Non-destructive, idempotent |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-14-7-order-number-schema
   ```

2. Implementation order:
   - Update schema.ts with orderNumber field and index
   - Update createOrder mutation to generate order number
   - Re-enable getTicketByOrderNumber query
   - Create migration for existing orders
   - Run migration on dev/staging
   - Verify email templates use order number correctly
   - Tests

3. Running the migration:
   ```bash
   # In Convex dashboard or via CLI
   npx convex run migrations/addOrderNumbers:addOrderNumbersToExistingOrders
   ```

4. After completion:
   ```bash
   git add .
   git commit -m "feat(story-14-7): add order number schema and enable ticket queries"
   git push origin feat/story-14-7-order-number-schema
   ```

5. Update this story status to Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
