# Story 13.2: Premium Tier Webhook Handler

## Status
| Field | Value |
|-------|-------|
| Status | 🟢 Approved |
| Priority | P0 (Critical) |
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
- [ ] Create feature branch: `git checkout -b feat/story-13-2-premium-webhooks`

---

## User Story

**As a** platform
**I want** Stripe subscription webhooks processed correctly
**So that** premium subscriptions are activated for organizers

---

## Description

### Background
The Stripe webhook handler at `src/app/api/webhooks/stripe/route.ts:484` has a DEFERRED comment for premium feature activation. This means when organizers subscribe to premium plans, their tier is never updated, blocking all premium subscription revenue.

### Current State
```typescript
// Line 484-485
// TODO: DEFERRED - Implement premium feature activation when system is built
```

### User Flow
1. Organizer selects premium subscription plan
2. Stripe processes payment successfully
3. Stripe sends `customer.subscription.created` webhook
4. Webhook handler updates organizer tier in Convex
5. Organizer immediately gains access to premium features
6. On cancellation, tier reverts after grace period

---

## Acceptance Criteria

### Functional Requirements
- [ ] Handle `customer.subscription.created` event
- [ ] Handle `customer.subscription.updated` event (upgrades/downgrades)
- [ ] Handle `customer.subscription.deleted` event (cancellation)
- [ ] Update organizer profile with: tier level, subscription ID, expiry date
- [ ] Webhook signature verification (security requirement)
- [ ] Idempotency handling for duplicate webhooks
- [ ] Audit log entry for all tier changes

### Non-Functional Requirements
- [ ] Performance: Webhook processed < 5 seconds
- [ ] Security: Signature verification on all requests
- [ ] Reliability: Retry logic for failed tier updates

---

## Technical Implementation

### Database Changes

#### Convex Schema Additions
```typescript
// convex/schema.ts - Add to users table (organizer profile)
premiumTier: v.optional(v.object({
  tier: v.union(v.literal("free"), v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
  stripeSubscriptionId: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  updatedAt: v.number(),
})),

// New table for audit log
defineTable("premiumTierChanges", {
  userId: v.id("users"),
  previousTier: v.string(),
  newTier: v.string(),
  reason: v.string(), // "subscription_created", "subscription_updated", "subscription_deleted"
  stripeEventId: v.string(),
  createdAt: v.number(),
}),
```

### Webhook Handler Updates
```typescript
// src/app/api/webhooks/stripe/route.ts - Add cases

case "customer.subscription.created": {
  const subscription = event.data.object as Stripe.Subscription;
  const tier = mapPriceToTier(subscription.items.data[0].price.id);

  await convex.mutation(api.users.updatePremiumTier, {
    stripeCustomerId: subscription.customer as string,
    tier,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    reason: "subscription_created",
    stripeEventId: event.id,
  });
  break;
}

case "customer.subscription.updated": {
  // Handle upgrades/downgrades
  const subscription = event.data.object as Stripe.Subscription;
  const tier = mapPriceToTier(subscription.items.data[0].price.id);

  await convex.mutation(api.users.updatePremiumTier, {
    stripeCustomerId: subscription.customer as string,
    tier,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    reason: "subscription_updated",
    stripeEventId: event.id,
  });
  break;
}

case "customer.subscription.deleted": {
  const subscription = event.data.object as Stripe.Subscription;

  await convex.mutation(api.users.updatePremiumTier, {
    stripeCustomerId: subscription.customer as string,
    tier: "free",
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    reason: "subscription_deleted",
    stripeEventId: event.id,
  });
  break;
}
```

### Price to Tier Mapping
```typescript
// src/lib/stripe/tiers.ts (NEW FILE)
export const PRICE_TO_TIER: Record<string, string> = {
  "price_starter_monthly": "starter",
  "price_starter_yearly": "starter",
  "price_pro_monthly": "pro",
  "price_pro_yearly": "pro",
  "price_enterprise_monthly": "enterprise",
  "price_enterprise_yearly": "enterprise",
};

export function mapPriceToTier(priceId: string): string {
  return PRICE_TO_TIER[priceId] || "free";
}
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `src/lib/stripe/tiers.ts` | Price ID to tier mapping |
| `convex/users/premiumTier.ts` | Premium tier mutations |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add premiumTier to users, add premiumTierChanges table |
| `src/app/api/webhooks/stripe/route.ts` | Add subscription event handlers |

### Files to Delete
| File | Reason |
|------|--------|
| None | |

---

## Dependencies

### External Packages
```bash
# Already installed
# stripe (existing)
```

### Environment Variables
```bash
# Already configured
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Internal Dependencies
- Depends on: None
- Blocks: Story 13.3 (Premium Feature Gates)

---

## Testing Requirements

### Unit Tests
- [ ] Test price to tier mapping
- [ ] Test tier update mutation
- [ ] Test audit log creation

### Integration Tests
- [ ] Test webhook signature verification
- [ ] Test idempotency (same event twice)
- [ ] Mock webhook payloads for each event type

### Manual Testing
- [ ] Use Stripe CLI to forward webhooks locally
- [ ] Test subscription creation → tier upgrade
- [ ] Test subscription cancellation → tier downgrade

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Webhook signature verification working
- [ ] Audit log capturing all tier changes
- [ ] Tests written and passing
- [ ] Code reviewed by QA agent
- [ ] Committed with: `feat(story-13-2): implement premium tier webhooks`

---

## Notes for Dev Agent

### Important Considerations
1. **Webhook Signature** - ALWAYS verify signature before processing
2. **Idempotency** - Check if event already processed by stripeEventId
3. **Customer ID Lookup** - User may not exist yet; handle gracefully
4. **Grace Period** - Don't immediately revoke on cancellation

### Stripe CLI Testing
```bash
# Forward webhooks to local
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### Questions Resolved
| Question | Answer |
|----------|--------|
| Grace period duration? | 7 days after subscription ends |
| Tier names? | free, starter, pro, enterprise |
| Price IDs format? | price_[tier]_[monthly/yearly] |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify correct folder
   git remote -v  # Verify correct repo
   git checkout -b feat/story-13-2-premium-webhooks
   ```

2. Implementation order:
   - Schema changes first
   - Tier mutations in Convex
   - Price mapping utility
   - Webhook handler updates
   - Tests

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-13-2): implement premium tier webhooks"
   git push origin feat/story-13-2-premium-webhooks
   ```

4. Update status to 🟣 Review and invoke `*agent qa`

---

*Created by SM Agent | BMAD-METHOD*
