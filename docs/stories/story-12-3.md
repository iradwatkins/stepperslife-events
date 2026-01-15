# Story 12.3: Financial Reports

## Status
| Field | Value |
|-------|-------|
| Status | ✅ Done |
| Priority | P1 (High) |
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

**As an** event organizer
**I want to** view comprehensive financial reports
**So that** I can understand my revenue and make informed decisions

---

## Description

### Background
Event organizers need visibility into their financial performance across all events. This includes revenue trends, per-event breakdowns, attendance metrics, and exportable data for accounting.

### Implementation Overview

The financial reports system consists of:
1. **Reports Hub** - Central navigation for all report types
2. **Sales Reports** - Revenue analysis with charts
3. **Financial Reports** - Detailed financial breakdowns
4. **Attendee Reports** - Attendance and check-in tracking
5. **Analytics Backend** - Convex queries for data aggregation

---

## Acceptance Criteria

### Functional Requirements
- [x] View total revenue across all events
- [x] Revenue breakdown by individual event
- [x] Revenue over time chart (7d, 30d, 90d, 365d)
- [x] Ticket sales statistics
- [x] Attendance/check-in rates
- [x] Event performance table
- [x] CSV export functionality
- [x] Date range filtering

### Technical Verification
- [x] `getOrganizerRevenueStats` query - lines 26-65
- [x] `getOrganizerTicketStats` query - lines 68-106
- [x] `getOrganizerAttendeeStats` query - lines 108-145
- [x] `getRevenueOverTime` query - lines 147-192
- [x] `getTicketSalesOverTime` query - lines 194-234
- [x] `getEventPerformanceBreakdown` query - lines 236-286

---

## Technical Implementation

### Backend Analytics Queries

```typescript
// convex/analytics/queries.ts

// Revenue statistics
export const getOrganizerRevenueStats = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all orders for organizer's events
    // Sum totalCents, return formatted totals
    return {
      totalRevenue,
      totalRevenueFormatted,
      revenueByEvent,
    };
  },
});

// Revenue over time for charts
export const getRevenueOverTime = query({
  args: { organizerId: v.id("users"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Aggregate orders by date for time series
    return dataPoints; // [{date, revenue}, ...]
  },
});

// Event performance breakdown
export const getEventPerformanceBreakdown = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get revenue, tickets, attendees per event
    return performance; // Sorted by revenue desc
  },
});
```

### Reports Hub Page
```typescript
// src/app/organizer/reports/page.tsx (113 lines)
- Links to Sales, Attendee, Financial reports
- Summary stats from backend queries
- Card-based navigation
```

### Sales Reports Page
```typescript
// src/app/organizer/reports/sales/page.tsx (335 lines)
- 4 summary cards (Revenue, Tickets, Events, Avg)
- Revenue Over Time bar chart
- Date range selector (7d, 30d, 90d, 365d)
- Event Performance table
- Revenue by Event progress bars
- CSV Export button
```

### Attendee Reports Page
```typescript
// src/app/organizer/reports/attendees/page.tsx (351 lines)
- 4 summary cards (Tickets, Check-ins, Rate, Events)
- Ticket Sales Over Time chart
- Event Attendance table with rates
- Check-ins by Event breakdown
- CSV Export button
```

### Financial Reports Page
```typescript
// src/app/organizer/reports/financial/page.tsx (177 lines)
- 3 summary cards (Total Revenue, Events, Avg/Event)
- Revenue by Event table
- Per-event breakdown with status
```

---

## File List

### Backend Files
| File | Purpose | Lines |
|------|---------|-------|
| `convex/analytics/queries.ts` | All analytics queries | 287 |

### Frontend Files
| File | Purpose | Lines |
|------|---------|-------|
| `src/app/organizer/reports/page.tsx` | Reports hub | 113 |
| `src/app/organizer/reports/sales/page.tsx` | Sales reports | 335 |
| `src/app/organizer/reports/attendees/page.tsx` | Attendee reports | 351 |
| `src/app/organizer/reports/financial/page.tsx` | Financial breakdown | 177 |

**Total: 1,263 lines of code**

---

## Features

### Charts
| Chart | Data Source | Options |
|-------|-------------|---------|
| Revenue Over Time | `getRevenueOverTime` | 7d, 30d, 90d, 365d |
| Ticket Sales Over Time | `getTicketSalesOverTime` | 7d, 30d, 90d, 365d |
| Revenue by Event | `getOrganizerRevenueStats` | Progress bars |
| Check-ins by Event | `getOrganizerAttendeeStats` | Progress bars |

### Data Tables
| Table | Columns |
|-------|---------|
| Event Performance | Name, Status, Revenue, Tickets, Attendees, Date |
| Event Attendance | Name, Status, Tickets, Check-ins, Rate, Date |

### Export
| Format | Content |
|--------|---------|
| CSV (Sales) | Event Name, Status, Revenue, Tickets, Attendees, Date |
| CSV (Attendees) | Event Name, Status, Tickets, Check-ins, Rate, Date |

---

## Definition of Done

- [x] Revenue statistics query implemented
- [x] Ticket sales statistics query implemented
- [x] Attendance statistics query implemented
- [x] Time series queries for charts implemented
- [x] Reports hub page with navigation
- [x] Sales reports page with charts
- [x] Attendee reports page with charts
- [x] Financial breakdown page
- [x] CSV export functionality
- [x] Date range filtering
- [x] Code reviewed by QA agent

---

## Notes

### Data Calculations
- **Revenue**: Sum of `order.totalCents` for COMPLETED/PENDING_PAYMENT orders
- **Tickets Sold**: Count of tickets with VALID/SCANNED status
- **Attendees**: Count of tickets with SCANNED status (checked in)
- **Check-in Rate**: (Attendees / Tickets Sold) × 100

### Chart Implementation
Uses native CSS bar charts (flex containers with percentage heights) for:
- Simple, lightweight rendering
- No external charting library dependency
- Responsive design
- Hover tooltips for exact values

### Performance
All queries filter by organizer ID for data isolation. Each query iterates through organizer's events to aggregate data. Suitable for typical organizer volumes (< 100 events).

---

*Created by SM Agent | BMAD-METHOD*
*Story was already implemented before Sprint 12*
