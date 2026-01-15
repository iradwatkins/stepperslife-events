# Story 14.5: Notification Bulk Delete

## Status
| Field | Value |
|-------|-------|
| Status | Draft |
| Priority | P1 |
| Estimate | S (3 pts) |
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
- [ ] Create feature branch: `git checkout -b feat/story-14-5-notification-bulk-delete`

---

## User Story

**As a** user
**I want to** delete all read notifications at once
**So that** I can keep my notification center clean without deleting one by one

---

## Description

### Background
The notifications page at `src/app/user/notifications/page.tsx` has UI for a "Clear read" button, but it's commented out (lines 142-154, 249-263) because the `deleteAllRead` mutation doesn't exist yet.

### Current State
```typescript
// src/app/user/notifications/page.tsx:142-154
// Note: deleteAllRead mutation is not yet implemented
// const handleDeleteAllRead = async () => {
//   setIsDeletingRead(true);
//   try {
//     const result = await deleteAllRead({});
//     toast.success(`Deleted ${result.count} read notifications`);
//   ...

// Lines 249-263 - Button commented out
// {/* Delete all read button - disabled until mutation is implemented */}
// {/* <Button ... */}
```

### User Flow
1. User views notifications page
2. User clicks "Clear read" button
3. System shows confirmation dialog
4. User confirms deletion
5. System deletes all read notifications
6. Toast shows count of deleted notifications
7. Notification list updates in real-time

---

## Acceptance Criteria

### Functional Requirements
- [ ] Create `deleteAllRead` mutation in `convex/notifications/mutations.ts`
- [ ] Mutation deletes all notifications where `isRead === true` for current user
- [ ] Return count of deleted notifications
- [ ] Enable "Clear read" button in notifications page (uncomment and wire up)
- [ ] Add confirmation dialog before bulk delete
- [ ] Show toast notification with count of deleted items
- [ ] Graceful handling when no read notifications exist (toast: "No read notifications to delete")

### Non-Functional Requirements
- [ ] Performance: Delete operation < 5 seconds for up to 1000 notifications
- [ ] Use batch delete for efficiency (Convex limit: 64 docs per mutation call)
- [ ] For large counts, implement pagination in delete
- [ ] Rate limiting: max 1 bulk delete per 10 seconds per user

---

## Technical Implementation

### Mutation Implementation
```typescript
// convex/notifications/mutations.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");

    // Get all read notifications for this user
    const readNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isRead"), true))
      .collect();

    if (readNotifications.length === 0) {
      return { count: 0 };
    }

    // Delete in batches of 64 (Convex limit)
    const batchSize = 64;
    let deletedCount = 0;

    for (let i = 0; i < readNotifications.length; i += batchSize) {
      const batch = readNotifications.slice(i, i + batchSize);
      await Promise.all(
        batch.map((notification) => ctx.db.delete(notification._id))
      );
      deletedCount += batch.length;
    }

    return { count: deletedCount };
  },
});
```

### Frontend Implementation
```typescript
// src/app/user/notifications/page.tsx
// Add mutation hook
const deleteAllRead = useMutation(api.notifications.mutations.deleteAllRead);

// Update handleDeleteAllRead
const handleDeleteAllRead = async () => {
  // Show confirmation dialog
  if (!confirm("Delete all read notifications? This cannot be undone.")) {
    return;
  }

  setIsDeletingRead(true);
  try {
    const result = await deleteAllRead({});
    if (result.count === 0) {
      toast.info("No read notifications to delete");
    } else {
      toast.success(`Deleted ${result.count} read notification${result.count !== 1 ? "s" : ""}`);
    }
  } catch (error) {
    toast.error("Failed to delete read notifications");
    console.error(error);
  } finally {
    setIsDeletingRead(false);
  }
};

// Uncomment the Button component (lines 249-263)
```

### Component Structure
```
convex/
├── notifications/
│   └── mutations.ts       # MODIFY - Add deleteAllRead
src/
├── app/user/notifications/
│   └── page.tsx           # MODIFY - Uncomment and wire up button
├── components/ui/
│   └── AlertDialog.tsx    # USE - For confirmation dialog
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| None | |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/notifications/mutations.ts` | Add deleteAllRead mutation |
| `src/app/user/notifications/page.tsx` | Enable bulk delete button, add confirmation |

### Files to Delete
| File | Reason |
|------|--------|
| None | |

---

## Dependencies

### External Packages
```bash
# No new packages required
# Uses existing shadcn/ui AlertDialog
```

### Internal Dependencies
- Depends on: None
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test deleteAllRead with no read notifications
- [ ] Test deleteAllRead with 1 read notification
- [ ] Test deleteAllRead with 100+ read notifications (batching)
- [ ] Test deleteAllRead doesn't delete unread notifications
- [ ] Test deleteAllRead only deletes current user's notifications

### Integration Tests
- [ ] Test full flow: read notification -> bulk delete -> verify gone
- [ ] Test UI updates in real-time after delete

### Manual Testing
- [ ] Click "Clear read" with read notifications
- [ ] Confirm dialog appears
- [ ] Verify correct count in success toast
- [ ] Click "Clear read" with no read notifications
- [ ] Verify "no notifications to delete" message
- [ ] Verify unread notifications remain

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Confirmation dialog implemented
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Bulk delete functional
- [ ] Rate limiting implemented
- [ ] Committed with: `feat(story-14-5): implement notification bulk delete`

---

## Notes for Dev Agent

### Important Considerations
1. **Batch Deletion** - Convex limits 64 operations per mutation, handle batching
2. **Confirmation** - Always confirm before destructive bulk actions
3. **Real-time Updates** - Convex will auto-update the notification list
4. **Edge Cases** - Handle 0 notifications gracefully

### Existing Code Reference
```typescript
// Existing delete single notification in mutations.ts
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    // Verify ownership before delete
    const notification = await ctx.db.get(args.notificationId);
    // ... ownership check
    await ctx.db.delete(args.notificationId);
  },
});
```

### UI Enhancement (Optional)
```typescript
// Consider using AlertDialog instead of confirm()
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

### Questions Resolved
| Question | Answer |
|----------|--------|
| Rate limit needed? | Yes, 1 per 10 seconds |
| Confirmation required? | Yes, always |
| Soft delete or hard delete? | Hard delete |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-14-5-notification-bulk-delete
   ```

2. Implementation order:
   - Add deleteAllRead mutation to convex/notifications/mutations.ts
   - Update notifications page to use mutation
   - Uncomment and wire up the Clear read button
   - Add confirmation dialog
   - Test batch deletion
   - Add unit tests

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-14-5): implement notification bulk delete"
   git push origin feat/story-14-5-notification-bulk-delete
   ```

4. Update this story status to Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
