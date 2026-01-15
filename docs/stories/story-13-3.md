# Story 13.3: Premium Feature Gates

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
- [ ] Create feature branch: `git checkout -b feat/story-13-3-feature-gates`

---

## User Story

**As an** organizer
**I want** premium features gated appropriately
**So that** I understand what I get by upgrading

---

## Description

### Background
After implementing premium webhooks (Story 13.2), we need to actually gate features based on the organizer's tier. This includes showing upgrade prompts, feature comparison modals, and gracefully handling expired subscriptions.

### Gated Features by Tier
| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| Events/month | 3 | 10 | Unlimited | Unlimited |
| Custom branding | ❌ | ✅ | ✅ | ✅ |
| Advanced analytics | ❌ | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ❌ | ✅ |

### User Flow
1. Free-tier organizer tries to access "Advanced Analytics"
2. System checks tier via `usePremiumFeatures()` hook
3. Gate blocks access, shows upgrade prompt
4. Organizer clicks "Upgrade" → navigates to pricing page
5. After upgrading, feature becomes accessible

---

## Acceptance Criteria

### Functional Requirements
- [ ] Create `usePremiumFeatures()` hook returning tier and feature flags
- [ ] Gate features: custom branding, advanced analytics, priority support, unlimited events
- [ ] Show upgrade prompts when free-tier users access gated features
- [ ] Premium badge on organizer profile
- [ ] Feature comparison modal for upgrade flow
- [ ] Graceful handling of expired subscriptions (7-day grace period)

### Non-Functional Requirements
- [ ] Performance: Feature check < 50ms (cached)
- [ ] Security: Server-side validation (not just client-side)
- [ ] UX: Non-intrusive upgrade prompts

---

## Technical Implementation

### Feature Flags Hook
```typescript
// src/hooks/usePremiumFeatures.ts (NEW FILE)
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface PremiumFeatures {
  tier: "free" | "starter" | "pro" | "enterprise";
  features: {
    customBranding: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    unlimitedEvents: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
  };
  limits: {
    eventsPerMonth: number;
  };
  isExpired: boolean;
  gracePeriodEnd: number | null;
}

export function usePremiumFeatures(): PremiumFeatures | null {
  const user = useQuery(api.users.getCurrentUser);

  if (!user) return null;

  const tier = user.premiumTier?.tier || "free";
  const isExpired = user.premiumTier?.currentPeriodEnd
    ? Date.now() > user.premiumTier.currentPeriodEnd
    : false;

  // 7-day grace period
  const gracePeriodEnd = isExpired && user.premiumTier?.currentPeriodEnd
    ? user.premiumTier.currentPeriodEnd + (7 * 24 * 60 * 60 * 1000)
    : null;

  const inGracePeriod = gracePeriodEnd ? Date.now() < gracePeriodEnd : false;
  const effectiveTier = (isExpired && !inGracePeriod) ? "free" : tier;

  return {
    tier: effectiveTier,
    features: {
      customBranding: ["starter", "pro", "enterprise"].includes(effectiveTier),
      advancedAnalytics: ["pro", "enterprise"].includes(effectiveTier),
      prioritySupport: ["pro", "enterprise"].includes(effectiveTier),
      unlimitedEvents: ["pro", "enterprise"].includes(effectiveTier),
      apiAccess: effectiveTier === "enterprise",
      whiteLabel: effectiveTier === "enterprise",
    },
    limits: {
      eventsPerMonth: effectiveTier === "free" ? 3 : effectiveTier === "starter" ? 10 : Infinity,
    },
    isExpired,
    gracePeriodEnd,
  };
}
```

### Feature Gate Component
```typescript
// src/components/premium/FeatureGate.tsx (NEW FILE)
"use client";

import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { UpgradeModal } from "./UpgradeModal";

interface FeatureGateProps {
  feature: keyof PremiumFeatures["features"];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const premium = usePremiumFeatures();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!premium) return null;

  if (premium.features[feature]) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback || (
        <div className="p-4 border rounded-lg bg-muted">
          <p>This feature requires a premium subscription.</p>
          <Button onClick={() => setShowUpgrade(true)}>Upgrade</Button>
        </div>
      )}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
```

### Server-Side Validation
```typescript
// convex/users/premiumFeatures.ts (NEW FILE)
import { query } from "./_generated/server";

export const checkFeatureAccess = query({
  args: { feature: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { allowed: false, reason: "unauthenticated" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return { allowed: false, reason: "user_not_found" };

    const tier = user.premiumTier?.tier || "free";
    const featureAccess = getFeatureAccess(tier);

    return {
      allowed: featureAccess[args.feature] || false,
      tier,
      reason: featureAccess[args.feature] ? "allowed" : "tier_insufficient",
    };
  },
});
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/usePremiumFeatures.ts` | Client-side feature check hook |
| `src/components/premium/FeatureGate.tsx` | Gate wrapper component |
| `src/components/premium/UpgradeModal.tsx` | Upgrade prompt modal |
| `src/components/premium/PremiumBadge.tsx` | Badge for premium users |
| `src/components/premium/FeatureComparison.tsx` | Tier comparison table |
| `convex/users/premiumFeatures.ts` | Server-side feature validation |

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/organizer/layout.tsx` | Add premium badge to header |
| `src/app/organizer/analytics/page.tsx` | Wrap with FeatureGate |
| `src/app/organizer/branding/page.tsx` | Wrap with FeatureGate |

---

## Dependencies

### Internal Dependencies
- Depends on: Story 13.2 (Premium Tier Webhook Handler)
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test feature flag calculation for each tier
- [ ] Test grace period logic
- [ ] Test FeatureGate component rendering

### Integration Tests
- [ ] Test server-side feature check
- [ ] Test upgrade flow navigation

### Manual Testing
- [ ] Free user → blocked from analytics
- [ ] Pro user → can access analytics
- [ ] Expired user in grace period → still has access
- [ ] Expired user after grace → reverted to free

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Feature gates working for all gated features
- [ ] Upgrade modal displays correctly
- [ ] Grace period handling works
- [ ] Tests passing
- [ ] Committed with: `feat(story-13-3): implement premium feature gates`

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   git checkout -b feat/story-13-3-feature-gates
   ```

2. Implementation order:
   - Hook first (usePremiumFeatures)
   - Gate component
   - Modal and comparison components
   - Server-side validation
   - Wrap existing pages

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-13-3): implement premium feature gates"
   git push origin feat/story-13-3-feature-gates
   ```

---

*Created by SM Agent | BMAD-METHOD*
