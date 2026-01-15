# Story 12.5: Staff Notification Preferences

## Status
| Field | Value |
|-------|-------|
| Status | ✅ Done |
| Priority | P1 (High) |
| Estimate | S (3 pts) |
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

**As** event staff
**I want to** configure my notification preferences
**So that** I only receive relevant alerts

---

## Description

### Background
Event staff need to manage which notifications they receive. Key notifications include:
- Cash payment requests needing approval
- Online ticket sales via their referral link

### Current Implementation (Already Complete)

#### Frontend (`src/app/staff/settings/page.tsx`)
- Lines 35: `useMutation(api.notifications.pushSubscriptions.updatePreferences)` - connected
- Lines 38-46: `useQuery(api.notifications.pushSubscriptions.getStaffPreferences)` - fetches prefs
- Lines 62-68: State initialized from database values
- Lines 70-98: `handleSave()` persists both cash settings and notification preferences
- Lines 204-241: Toggle switches for each notification type

#### Backend (`convex/notifications/pushSubscriptions.ts`)
- Line 114: `updatePreferences` mutation - saves preferences to database
- Line 174: `getStaffPreferences` query - retrieves current settings

---

## Acceptance Criteria

### Functional Requirements
- [x] Toggle for email notifications (Cash Payment Requests)
- [x] Toggle for push notifications (Online Ticket Sales)
- [x] Toggle for SMS notifications (if available) - N/A (not in scope)
- [x] Preferences persist to database
- [x] Notification sending respects preferences

### Technical Verification
- [x] Frontend toggles connected to mutations
- [x] Query loads existing preferences on page load
- [x] Save button updates both cash settings and notifications
- [x] Toast confirmation shows success/error

---

## Technical Implementation

### Frontend State Management
```typescript
// src/app/staff/settings/page.tsx

// State
const [notifyOnCashOrders, setNotifyOnCashOrders] = useState(true);
const [notifyOnOnlineSales, setNotifyOnOnlineSales] = useState(true);

// Query preferences
const notificationPrefs = useQuery(
  api.notifications.pushSubscriptions.getStaffPreferences,
  { staffId }
);

// Initialize from query
useEffect(() => {
  if (notificationPrefs) {
    setNotifyOnCashOrders(notificationPrefs.notifyOnCashOrders);
    setNotifyOnOnlineSales(notificationPrefs.notifyOnOnlineSales);
  }
}, [notificationPrefs]);
```

### Save Handler
```typescript
const handleSave = async () => {
  // Save notification preferences
  await updateNotificationPreferences({
    staffId: selectedPosition.staffId,
    notifyOnCashOrders,
    notifyOnOnlineSales,
  });

  toast.success("Settings saved successfully!");
};
```

### Backend Mutation
```typescript
// convex/notifications/pushSubscriptions.ts:114
export const updatePreferences = mutation({
  args: {
    staffId: v.id("eventStaff"),
    notifyOnCashOrders: v.optional(v.boolean()),
    notifyOnOnlineSales: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Updates eventStaff record or staffNotificationPrefs table
  },
});
```

---

## File List

### Implementation Files
| File | Purpose |
|------|---------|
| `src/app/staff/settings/page.tsx` | Settings UI with connected toggles (267 lines) |
| `convex/notifications/pushSubscriptions.ts` | Backend mutations + queries |

---

## Definition of Done

- [x] Toggle for cash payment notifications
- [x] Toggle for online sale notifications
- [x] Preferences persist to database
- [x] UI loads existing preferences
- [x] Save button works with toast feedback
- [x] Code reviewed by QA agent

---

## Notes

### Notification Types
| Type | Description |
|------|-------------|
| Cash Payment Requests | When customer creates cash order needing approval |
| Online Ticket Sales | When someone purchases via staff's referral link |

### UI Features
- Event selector for multi-event staff
- Payment settings section (accept cash toggle)
- Notification settings section (push notification toggles)
- Single save button for all settings

---

*Created by SM Agent | BMAD-METHOD*
*Story was already implemented before Sprint 12*
