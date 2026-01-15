# Story 13.1: Push Notification Service Integration

## Status
| Field | Value |
|-------|-------|
| Status | 🟢 Approved |
| Priority | P0 (Critical) |
| Estimate | L (8 pts) |
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
- [ ] Create feature branch: `git checkout -b feat/story-13-1-push-notifications`

---

## User Story

**As a** platform operator
**I want to** push notifications to actually deliver to devices
**So that** staff receive critical cash order alerts in real-time

---

## Description

### Background
The current push notification system at `convex/notifications/pushNotifications.ts:168` only logs notifications to the console but never actually sends them to devices. This means staff members miss critical alerts about cash orders, check-ins, and other time-sensitive events.

### Current State
```typescript
// Line 168 - TODO: Call external web-push service or use HTTP action
// For now, just log the notification
console.log(`[PushNotification] Would send to ${userId}: ${title}`);
```

### User Flow
1. Event staff member subscribes to push notifications in browser
2. Subscription token is stored in user profile
3. Cash order is created at an event
4. System triggers push notification via HTTP action
5. Staff receives browser/mobile notification within 30 seconds
6. If push fails, in-app notification is created as fallback

---

## Acceptance Criteria

### Functional Requirements
- [ ] Integrate OneSignal for cross-platform push delivery
- [ ] Create Convex HTTP action for push delivery (Convex requirement)
- [ ] Staff receives push notification within 30 seconds of cash order
- [ ] Notification payload includes: order ID, amount, event name, location
- [ ] Graceful fallback to in-app notification when push fails
- [ ] Push subscription token stored in user profile

### Non-Functional Requirements
- [ ] Performance: Notification delivered < 30 seconds
- [ ] Security: No sensitive data (full card numbers, passwords) in push payload
- [ ] Reliability: Fallback to in-app notification on failure

---

## Technical Implementation

### Database Changes

#### Convex Schema Additions
```typescript
// convex/schema.ts - Add to users table
pushSubscription: v.optional(v.object({
  endpoint: v.string(),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
  provider: v.literal("onesignal"), // or "web-push"
  subscribedAt: v.number(),
})),
notificationPreferences: v.optional(v.object({
  orderUpdates: v.boolean(),
  eventReminders: v.boolean(),
  staffAlerts: v.boolean(),
  marketing: v.boolean(),
})),
```

### HTTP Action for Push Delivery
```typescript
// convex/notifications/pushActions.ts (NEW FILE)
import { httpAction } from "./_generated/server";

export const sendPushNotification = httpAction(async (ctx, request) => {
  const { userId, title, body, data } = await request.json();

  // Get user's push subscription
  const user = await ctx.runQuery(internal.users.getById, { id: userId });
  if (!user?.pushSubscription) {
    // Fallback to in-app notification
    await ctx.runMutation(internal.notifications.createInApp, {
      userId, title, body, data
    });
    return new Response(JSON.stringify({ fallback: true }));
  }

  // Send via OneSignal
  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${process.env.ONESIGNAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      include_player_ids: [user.pushSubscription.endpoint],
      headings: { en: title },
      contents: { en: body },
      data,
    }),
  });

  return new Response(JSON.stringify(await response.json()));
});
```

### Component Structure
```
convex/
├── notifications/
│   ├── pushNotifications.ts    # Update existing
│   ├── pushActions.ts          # NEW - HTTP action
│   └── mutations.ts            # Add subscription mutations
src/
├── components/
│   └── notifications/
│       └── PushSubscribeButton.tsx  # NEW
├── hooks/
│   └── usePushNotifications.ts      # NEW
└── lib/
    └── push/
        └── onesignal.ts             # NEW - OneSignal client
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `convex/notifications/pushActions.ts` | HTTP action for sending push |
| `src/components/notifications/PushSubscribeButton.tsx` | Subscribe to push UI |
| `src/hooks/usePushNotifications.ts` | Hook for push subscription management |
| `src/lib/push/onesignal.ts` | OneSignal client wrapper |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add pushSubscription to users table |
| `convex/notifications/pushNotifications.ts` | Call HTTP action instead of console.log |
| `convex/notifications/mutations.ts` | Add savePushSubscription mutation |
| `convex/http.ts` | Register push HTTP action |

### Files to Delete
| File | Reason |
|------|--------|
| None | |

---

## Dependencies

### External Packages
```bash
# 📍 Run in: Project Terminal
# OneSignal requires no npm package - uses REST API
# Web-push alternative:
npm install web-push
```

### Environment Variables
```bash
# Add to .env
ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_API_KEY=your-api-key
```

### Internal Dependencies
- Depends on: None
- Blocks: Story 13.8 (Push Notification Preferences UI)

---

## Testing Requirements

### Unit Tests
- [ ] Test notification formatting with various payloads
- [ ] Test fallback to in-app when push subscription missing
- [ ] Test subscription save/retrieve

### Integration Tests
- [ ] Test HTTP action responds correctly
- [ ] Test end-to-end notification delivery (mock OneSignal)

### Manual Testing
- [ ] Subscribe to push in browser
- [ ] Trigger cash order, verify notification received
- [ ] Test with subscription disabled, verify in-app fallback
- [ ] Test on mobile browser

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Push notifications delivered within 30 seconds
- [ ] Fallback to in-app working
- [ ] Committed with: `feat(story-13-1): implement push notification service`

---

## Notes for Dev Agent

### Important Considerations
1. **Convex HTTP Actions** - External API calls must use HTTP actions, not direct fetch in mutations
2. **OneSignal vs Web-Push** - OneSignal recommended for cross-platform; web-push is native but more complex
3. **VAPID Keys** - If using web-push, generate VAPID keys and store securely
4. **Service Worker** - Push requires a service worker for background delivery

### Related Code Examples
```typescript
// Existing notification pattern in convex/notifications/mutations.ts
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // This pattern should be extended for push
  },
});
```

### Questions Resolved
| Question | Answer |
|----------|--------|
| OneSignal vs Web-Push? | OneSignal recommended for easier cross-platform |
| Notification latency target? | < 30 seconds |
| Fallback strategy? | In-app notification if push fails |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   # 📍 Run in: Desktop Terminal
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-13-1-push-notifications
   ```

2. Implementation order:
   - Schema changes first (pushSubscription field)
   - HTTP action for push delivery
   - Client-side subscription hook
   - Update existing pushNotifications.ts
   - Tests

3. After completion:
   ```bash
   # 📍 Run in: Project Terminal
   git add .
   git commit -m "feat(story-13-1): implement push notification service"
   git push origin feat/story-13-1-push-notifications
   ```

4. Update this story status to 🟣 Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
