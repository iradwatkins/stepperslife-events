# Story 14.2: Sales Leaderboard Implementation

## Status
| Field | Value |
|-------|-------|
| Status | Draft |
| Priority | P2 |
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
- [ ] Create feature branch: `git checkout -b feat/story-14-2-sales-leaderboard`

---

## User Story

**As a** team leader
**I want to** see my team's sales performance ranked
**So that** I can identify top performers and motivate the team

---

## Description

### Background
The leaderboard page exists at `src/app/team/sales-performance/leaderboard/page.tsx`, but currently shows a placeholder message "Leaderboard coming soon" (line 29). The page needs to display real sales data aggregated by associate.

### Current State
```typescript
// src/app/team/sales-performance/leaderboard/page.tsx:29
<div className="text-center py-12 text-muted-foreground">
  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
  <p>Leaderboard coming soon</p>
  <p className="text-sm mt-2">Track top performers across events</p>
</div>
```

### User Flow
1. Team leader navigates to Performance > Leaderboard
2. System queries and aggregates sales data by associate
3. Leaderboard displays ranked list with sales metrics
4. Team leader can filter by time period (week/month/all time)
5. Team leader can see trend indicators (up/down from previous period)

---

## Acceptance Criteria

### Functional Requirements
- [ ] Create `convex/leaderboard/queries.ts` with `getTeamLeaderboard` query
- [ ] Aggregate sales data by associate for current month
- [ ] Display metrics: total sales count, ticket count, revenue generated
- [ ] Rank associates 1st, 2nd, 3rd with visual indicators (gold/silver/bronze)
- [ ] Filter by time period: this week, this month, all time
- [ ] Show trend indicator (up/down arrow from previous period)
- [ ] Empty state when no sales data exists
- [ ] Link to individual associate detail view

### Non-Functional Requirements
- [ ] Performance: Query response < 500ms for teams up to 50 associates
- [ ] Consider caching aggregated data for performance
- [ ] Real-time updates when new sales come in

---

## Technical Implementation

### Database Queries

#### Leaderboard Query
```typescript
// convex/leaderboard/queries.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getTeamLeaderboard = query({
  args: {
    period: v.union(v.literal("week"), v.literal("month"), v.literal("all")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user) return [];

    // Get all associates for this team leader
    const associates = await ctx.db
      .query("associates")
      .withIndex("by_team_leader", (q) => q.eq("teamLeaderId", user._id))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .collect();

    if (associates.length === 0) return [];

    // Calculate time period boundaries
    const now = Date.now();
    let periodStart: number;
    let previousPeriodStart: number;
    let previousPeriodEnd: number;

    if (args.period === "week") {
      periodStart = now - 7 * 24 * 60 * 60 * 1000;
      previousPeriodStart = periodStart - 7 * 24 * 60 * 60 * 1000;
      previousPeriodEnd = periodStart;
    } else if (args.period === "month") {
      periodStart = now - 30 * 24 * 60 * 60 * 1000;
      previousPeriodStart = periodStart - 30 * 24 * 60 * 60 * 1000;
      previousPeriodEnd = periodStart;
    } else {
      periodStart = 0;
      previousPeriodStart = 0;
      previousPeriodEnd = 0;
    }

    // Aggregate sales for each associate
    const leaderboardData = await Promise.all(
      associates.map(async (associate) => {
        if (!associate.userId) {
          return {
            associateId: associate._id,
            name: associate.name,
            email: associate.email,
            totalSales: 0,
            ticketCount: 0,
            revenue: 0,
            trend: "neutral" as const,
            previousRevenue: 0,
          };
        }

        // Get current period sales
        const currentOrders = await ctx.db
          .query("orders")
          .withIndex("by_sold_by_staff", (q) => q.eq("soldByStaffId", associate.userId!))
          .filter((q) =>
            args.period === "all"
              ? q.eq(true, true)
              : q.gte(q.field("createdAt"), periodStart)
          )
          .collect();

        // Get previous period sales for trend
        let previousOrders: typeof currentOrders = [];
        if (args.period !== "all") {
          previousOrders = await ctx.db
            .query("orders")
            .withIndex("by_sold_by_staff", (q) => q.eq("soldByStaffId", associate.userId!))
            .filter((q) =>
              q.and(
                q.gte(q.field("createdAt"), previousPeriodStart),
                q.lt(q.field("createdAt"), previousPeriodEnd)
              )
            )
            .collect();
        }

        const currentRevenue = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const currentTickets = currentOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);

        let trend: "up" | "down" | "neutral" = "neutral";
        if (previousRevenue > 0) {
          if (currentRevenue > previousRevenue) trend = "up";
          else if (currentRevenue < previousRevenue) trend = "down";
        }

        return {
          associateId: associate._id,
          name: associate.name,
          email: associate.email,
          totalSales: currentOrders.length,
          ticketCount: currentTickets,
          revenue: currentRevenue,
          trend,
          previousRevenue,
        };
      })
    );

    // Sort by revenue descending
    return leaderboardData.sort((a, b) => b.revenue - a.revenue);
  },
});
```

### Component Structure
```
convex/
├── leaderboard/
│   └── queries.ts         # NEW - getTeamLeaderboard
src/
├── app/team/sales-performance/
│   └── leaderboard/
│       └── page.tsx       # MODIFY - Replace placeholder with leaderboard
├── components/team/
│   └── LeaderboardCard.tsx # NEW - Individual leaderboard entry card
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `convex/leaderboard/queries.ts` | Leaderboard aggregation query |
| `src/components/team/LeaderboardCard.tsx` | Reusable leaderboard entry component |

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/team/sales-performance/leaderboard/page.tsx` | Replace placeholder with real leaderboard |

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
- Depends on: Story 14.1 (Associate Creation Backend) - needs associates table
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test leaderboard query with empty associates
- [ ] Test leaderboard query with no sales
- [ ] Test period filtering (week/month/all)
- [ ] Test trend calculation (up/down/neutral)
- [ ] Test sorting by revenue

### Integration Tests
- [ ] Test leaderboard updates when new sale is recorded
- [ ] Test leaderboard with multiple associates

### Manual Testing
- [ ] View leaderboard with active associates
- [ ] Toggle between time periods
- [ ] Verify trend indicators match expected behavior
- [ ] Test empty state display
- [ ] Verify rank badges (gold/silver/bronze)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Leaderboard displaying real data
- [ ] Time period filter working
- [ ] Trend indicators accurate
- [ ] Committed with: `feat(story-14-2): implement sales leaderboard`

---

## Notes for Dev Agent

### Important Considerations
1. **Performance** - Consider caching for large teams
2. **Real-time** - Convex queries auto-update when data changes
3. **Edge Cases** - Handle associates with no userId (not yet accepted invitation)
4. **Index Usage** - May need to add `by_sold_by_staff` index on orders table

### UI Design Notes
```typescript
// Rank badges
const rankBadges = {
  1: { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-100" },
  2: { icon: Medal, color: "text-gray-400", bg: "bg-gray-100" },
  3: { icon: Award, color: "text-amber-600", bg: "bg-amber-100" },
};

// Trend indicator
const trendIcons = {
  up: { icon: ArrowUp, color: "text-green-500" },
  down: { icon: ArrowDown, color: "text-red-500" },
  neutral: { icon: Minus, color: "text-gray-400" },
};
```

### Questions Resolved
| Question | Answer |
|----------|--------|
| Include team leader in leaderboard? | No, associates only |
| Show associates with 0 sales? | Yes, show with $0 revenue |
| All time period start? | Beginning of data (no limit) |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-14-2-sales-leaderboard
   ```

2. Implementation order:
   - Verify Story 14.1 is complete (associates table exists)
   - Create leaderboard query
   - Create LeaderboardCard component
   - Update leaderboard page
   - Add period filter functionality
   - Tests

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-14-2): implement sales leaderboard"
   git push origin feat/story-14-2-sales-leaderboard
   ```

4. Update this story status to Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
