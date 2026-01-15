# Story 13.8: Push Notification Preferences UI

## Status
| Field | Value |
|-------|-------|
| Status | 🟢 Approved |
| Priority | P2 (Medium) |
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
- [ ] Create feature branch: `git checkout -b feat/story-13-8-notification-prefs`

---

## User Story

**As a** user
**I want to** control my notification preferences
**So that** I only receive notifications I want

---

## Description

### Background
After implementing push notifications (Story 13.1), users need a way to control which notifications they receive. This prevents notification fatigue and builds trust.

### Notification Categories
| Category | Default | Description |
|----------|---------|-------------|
| Order Updates | ON | Ticket purchases, refunds, status changes |
| Event Reminders | ON | Upcoming events, start time alerts |
| Staff Alerts | ON | Cash orders, check-in requests (staff only) |
| Marketing | OFF | Promotions, new events, platform updates |

### User Flow
1. User goes to Settings → Notifications
2. Sees toggle for each notification category
3. Can enable/disable push notifications entirely
4. Can request browser permission if not granted
5. Changes save automatically

---

## Acceptance Criteria

### Functional Requirements
- [ ] Preferences page in user settings
- [ ] Toggle categories: order updates, event reminders, staff alerts, marketing
- [ ] Frequency options: immediate, daily digest, weekly digest
- [ ] "Mute all" emergency option
- [ ] Browser permission request flow with explanation
- [ ] Respect preferences in notification service

### Non-Functional Requirements
- [ ] UX: Auto-save on toggle change
- [ ] Performance: Preferences cached client-side

---

## Technical Implementation

### Database Changes
```typescript
// Already added in Story 13.1 - just use it
// convex/schema.ts - In users table
notificationPreferences: v.optional(v.object({
  orderUpdates: v.boolean(),
  eventReminders: v.boolean(),
  staffAlerts: v.boolean(),
  marketing: v.boolean(),
  frequency: v.union(v.literal("immediate"), v.literal("daily"), v.literal("weekly")),
  muteAll: v.boolean(),
  muteUntil: v.optional(v.number()),
})),
```

### Preferences Page
```typescript
// src/app/settings/notifications/page.tsx (NEW FILE)
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Mail, Calendar, DollarSign, Megaphone } from "lucide-react";

export default function NotificationPreferencesPage() {
  const preferences = useQuery(api.users.getNotificationPreferences);
  const updatePreferences = useMutation(api.users.updateNotificationPreferences);

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Subscribe to push (from Story 13.1)
      await subscribeToPush();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>

      {/* Browser Permission */}
      {Notification.permission !== "granted" && (
        <Card className="mb-6 bg-blue-50">
          <CardContent className="p-4">
            <p className="mb-2">Enable browser notifications to receive alerts</p>
            <Button onClick={requestPermission}>
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mute All Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg mb-6">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <div>
            <Label>Mute All Notifications</Label>
            <p className="text-sm text-muted-foreground">Temporarily pause all notifications</p>
          </div>
        </div>
        <Switch
          checked={preferences?.muteAll || false}
          onCheckedChange={(v) => handleToggle("muteAll", v)}
        />
      </div>

      {/* Category Toggles */}
      <div className="space-y-4">
        <PreferenceToggle
          icon={<DollarSign />}
          label="Order Updates"
          description="Ticket purchases, refunds, status changes"
          checked={preferences?.orderUpdates ?? true}
          onChange={(v) => handleToggle("orderUpdates", v)}
          disabled={preferences?.muteAll}
        />

        <PreferenceToggle
          icon={<Calendar />}
          label="Event Reminders"
          description="Upcoming events, start time alerts"
          checked={preferences?.eventReminders ?? true}
          onChange={(v) => handleToggle("eventReminders", v)}
          disabled={preferences?.muteAll}
        />

        <PreferenceToggle
          icon={<Bell />}
          label="Staff Alerts"
          description="Cash orders, check-in requests"
          checked={preferences?.staffAlerts ?? true}
          onChange={(v) => handleToggle("staffAlerts", v)}
          disabled={preferences?.muteAll}
        />

        <PreferenceToggle
          icon={<Megaphone />}
          label="Marketing"
          description="Promotions, new events, platform updates"
          checked={preferences?.marketing ?? false}
          onChange={(v) => handleToggle("marketing", v)}
          disabled={preferences?.muteAll}
        />
      </div>

      {/* Frequency Selector */}
      <div className="mt-6">
        <Label>Notification Frequency</Label>
        <Select
          value={preferences?.frequency || "immediate"}
          onValueChange={(v) => handleToggle("frequency", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate</SelectItem>
            <SelectItem value="daily">Daily Digest</SelectItem>
            <SelectItem value="weekly">Weekly Summary</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

### Respect Preferences in Service
```typescript
// convex/notifications/pushNotifications.ts - Update

export async function shouldSendNotification(
  ctx: any,
  userId: string,
  category: string
): Promise<boolean> {
  const user = await ctx.db.get(userId);
  const prefs = user?.notificationPreferences;

  // Check mute all
  if (prefs?.muteAll) {
    if (prefs.muteUntil && Date.now() < prefs.muteUntil) {
      return false;
    }
  }

  // Check category
  switch (category) {
    case "order": return prefs?.orderUpdates ?? true;
    case "reminder": return prefs?.eventReminders ?? true;
    case "staff": return prefs?.staffAlerts ?? true;
    case "marketing": return prefs?.marketing ?? false;
    default: return true;
  }
}
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `src/app/settings/notifications/page.tsx` | Preferences page |
| `src/components/settings/PreferenceToggle.tsx` | Reusable toggle component |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/users/mutations.ts` | Add updateNotificationPreferences |
| `convex/notifications/pushNotifications.ts` | Add shouldSendNotification check |
| `src/app/settings/layout.tsx` | Add notifications link to nav |

---

## Dependencies

### Internal Dependencies
- Depends on: Story 13.1 (Push Notification Service)
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test preference toggle saves
- [ ] Test shouldSendNotification logic
- [ ] Test mute all behavior

### Manual Testing
- [ ] Toggle each preference
- [ ] Verify notification respects preference
- [ ] Test mute all
- [ ] Request browser permission

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Preferences page functional
- [ ] Notification service respects preferences
- [ ] Browser permission flow working
- [ ] Tests passing
- [ ] Committed with: `feat(story-13-8): implement notification preferences`

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   git checkout -b feat/story-13-8-notification-prefs
   ```

2. Implementation order:
   - Mutations first
   - Preferences page UI
   - Integration with notification service
   - Tests

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-13-8): implement notification preferences"
   git push origin feat/story-13-8-notification-prefs
   ```

---

*Created by SM Agent | BMAD-METHOD*
