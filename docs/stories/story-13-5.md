# Story 13.5: Low-Price Discount Detection

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
- [ ] Create feature branch: `git checkout -b feat/story-13-5-low-price-discount`

---

## User Story

**As a** platform
**I want** budget-friendly events identified automatically
**So that** we can offer reduced platform fees to encourage community events

---

## Description

### Background
The payment config at `convex/paymentConfig/mutations.ts:188` has `lowPriceDiscount: false` stubbed out. Community events with low ticket prices should receive reduced platform fees to encourage organizers to use the platform for free/cheap events.

### Current State
```typescript
// Line 188
lowPriceDiscount: false, // TODO: Implement low-price detection
```

### Discount Logic
- Events with max ticket price ≤ $15 qualify
- Platform fee reduced by 50% (e.g., 5% → 2.5%)
- "Budget Friendly" badge shown on event card
- Organizer notified when discount auto-applied

---

## Acceptance Criteria

### Functional Requirements
- [ ] Define "low-price" threshold (configurable, default $15)
- [ ] Auto-detect qualifying events during creation
- [ ] Apply platform fee reduction (50% off processing fee)
- [ ] Visual indicator on event card ("Budget Friendly" badge)
- [ ] Organizer notification when discount auto-applied
- [ ] Admin toggle to enable/disable feature globally

### Non-Functional Requirements
- [ ] Performance: Detection < 100ms during event creation
- [ ] Flexibility: Threshold configurable per-region (future)

---

## Technical Implementation

### Database Changes

#### Convex Schema Additions
```typescript
// convex/schema.ts - Add to events table
lowPriceDiscount: v.optional(v.object({
  applied: v.boolean(),
  originalFeePercent: v.number(),
  discountedFeePercent: v.number(),
  threshold: v.number(),
  detectedAt: v.number(),
})),

// Add to platformConfig table
lowPriceDiscountConfig: v.optional(v.object({
  enabled: v.boolean(),
  thresholdCents: v.number(), // Default 1500 ($15)
  discountPercent: v.number(), // Default 50
})),
```

### Detection Logic
```typescript
// convex/events/mutations.ts - Add to createEvent

// Check for low-price discount eligibility
const platformConfig = await ctx.db.query("platformConfig").first();
const lowPriceConfig = platformConfig?.lowPriceDiscountConfig || {
  enabled: true,
  thresholdCents: 1500,
  discountPercent: 50,
};

if (lowPriceConfig.enabled) {
  const maxTicketPrice = Math.max(...ticketTypes.map(t => t.priceCents));

  if (maxTicketPrice <= lowPriceConfig.thresholdCents) {
    const originalFee = platformConfig?.platformFeePercent || 5;
    const discountedFee = originalFee * (1 - lowPriceConfig.discountPercent / 100);

    eventData.lowPriceDiscount = {
      applied: true,
      originalFeePercent: originalFee,
      discountedFeePercent: discountedFee,
      threshold: lowPriceConfig.thresholdCents,
      detectedAt: Date.now(),
    };

    // Create notification for organizer
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      userId: organizerId,
      type: "low_price_discount_applied",
      title: "Budget Friendly Discount Applied!",
      message: `Your event qualifies for reduced platform fees (${discountedFee}% instead of ${originalFee}%).`,
    });
  }
}
```

### Badge Component
```typescript
// src/components/events/BudgetFriendlyBadge.tsx (NEW FILE)
export function BudgetFriendlyBadge({ event }) {
  if (!event.lowPriceDiscount?.applied) return null;

  return (
    <Badge variant="secondary" className="bg-green-100 text-green-800">
      <Sparkles className="w-3 h-3 mr-1" />
      Budget Friendly
    </Badge>
  );
}
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/events/BudgetFriendlyBadge.tsx` | Badge component |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add lowPriceDiscount to events, config to platformConfig |
| `convex/events/mutations.ts` | Add detection logic in createEvent |
| `convex/paymentConfig/mutations.ts` | Update lowPriceDiscount handling |
| `src/components/events/EventCard.tsx` | Add BudgetFriendlyBadge |
| `src/app/admin/settings/page.tsx` | Add toggle for feature |

---

## Dependencies

### Internal Dependencies
- Depends on: None
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test threshold detection (edge cases: $14.99, $15.00, $15.01)
- [ ] Test discount calculation
- [ ] Test badge rendering

### Manual Testing
- [ ] Create event with $10 tickets → verify discount applied
- [ ] Create event with $20 tickets → verify no discount
- [ ] Verify badge appears on event card
- [ ] Admin disable feature → verify no new discounts

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Detection working in event creation
- [ ] Badge displaying on qualifying events
- [ ] Notification sent to organizer
- [ ] Admin toggle functional
- [ ] Tests passing
- [ ] Committed with: `feat(story-13-5): implement low-price discount`

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   git checkout -b feat/story-13-5-low-price-discount
   ```

2. Implementation order:
   - Schema changes
   - Detection logic in createEvent
   - Badge component
   - Admin toggle
   - Tests

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-13-5): implement low-price discount"
   git push origin feat/story-13-5-low-price-discount
   ```

---

*Created by SM Agent | BMAD-METHOD*
