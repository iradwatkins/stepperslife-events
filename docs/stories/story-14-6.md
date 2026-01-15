# Story 14.6: Radio DJ Station Settings

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
- [ ] Create feature branch: `git checkout -b feat/story-14-6-dj-station-settings`

---

## User Story

**As a** radio DJ
**I want to** update my station's information, logo, banner, and social links
**So that** my station page reflects my brand and listeners can find me on social media

---

## Description

### Background
The DJ station settings page at `src/app/radio/dj-dashboard/settings/page.tsx` has 4 disabled save buttons because the backend mutations don't exist. The UI is complete but non-functional.

### Current State
```typescript
// src/app/radio/dj-dashboard/settings/page.tsx
// Line 147 - Station info save (disabled)
<Button disabled className="w-full">
  <Save className="w-4 h-4 mr-2" />
  Save Changes
</Button>

// Line 181 - Logo upload (disabled)
<Button variant="outline" disabled>
  Upload Logo
</Button>

// Line 204 - Banner upload (disabled)
<Button variant="outline" disabled className="w-full">
  Upload Banner
</Button>

// Line 276 - Social links save (disabled)
<Button disabled className="w-full mt-6">
  <Save className="w-4 h-4 mr-2" />
  Save Social Links
</Button>
```

### User Flow
1. DJ navigates to Settings page
2. DJ updates station info (DJ name, genre, description)
3. DJ clicks Save Changes - info is saved
4. DJ uploads logo - preview shown, then saved
5. DJ uploads banner - preview shown, then saved
6. DJ enters social links
7. DJ clicks Save Social Links - links are saved
8. Toast notifications confirm each action

---

## Acceptance Criteria

### Functional Requirements
- [ ] Create `updateStationInfo` mutation (djName, genre, description)
- [ ] Create `uploadStationLogo` mutation with Convex file storage
- [ ] Create `uploadStationBanner` mutation with Convex file storage
- [ ] Create `updateSocialLinks` mutation (instagram, twitter, facebook, website)
- [ ] Enable all 4 save/upload buttons on the settings page
- [ ] Image validation: max 5MB, PNG/JPG only
- [ ] Preview images before upload
- [ ] Success/error toast notifications for each action
- [ ] Station name remains disabled (admin-only change with note)

### Non-Functional Requirements
- [ ] Performance: Image upload < 10 seconds for 5MB file
- [ ] Image storage: Max 10MB total per station (logo + banner)
- [ ] Resize images server-side for optimization (optional future enhancement)
- [ ] Security: Only station owner can modify settings

---

## Technical Implementation

### Mutation Implementations
```typescript
// convex/radioStreaming/mutations.ts

export const updateStationInfo = mutation({
  args: {
    stationId: v.id("radioStations"),
    djName: v.string(),
    genre: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user || station.ownerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.stationId, {
      djName: args.djName,
      genre: args.genre,
      description: args.description,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateSocialLinks = mutation({
  args: {
    stationId: v.id("radioStations"),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    facebook: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user || station.ownerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.stationId, {
      socialLinks: {
        instagram: args.instagram,
        twitter: args.twitter,
        facebook: args.facebook,
        website: args.website,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

export const updateStationLogo = mutation({
  args: {
    stationId: v.id("radioStations"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user || station.ownerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Delete old logo if exists
    if (station.logoStorageId) {
      await ctx.storage.delete(station.logoStorageId);
    }

    // Get the URL for the new logo
    const logoUrl = await ctx.storage.getUrl(args.storageId);

    await ctx.db.patch(args.stationId, {
      logoStorageId: args.storageId,
      logoUrl: logoUrl,
      updatedAt: Date.now(),
    });

    return { success: true, logoUrl };
  },
});

export const updateStationBanner = mutation({
  args: {
    stationId: v.id("radioStations"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (!user || station.ownerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Delete old banner if exists
    if (station.bannerStorageId) {
      await ctx.storage.delete(station.bannerStorageId);
    }

    // Get the URL for the new banner
    const bannerUrl = await ctx.storage.getUrl(args.storageId);

    await ctx.db.patch(args.stationId, {
      bannerStorageId: args.storageId,
      bannerUrl: bannerUrl,
      updatedAt: Date.now(),
    });

    return { success: true, bannerUrl };
  },
});
```

### Frontend Upload Hook
```typescript
// src/hooks/useImageUpload.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useImageUpload() {
  const generateUploadUrl = useMutation(api.radioStreaming.generateUploadUrl);

  const uploadImage = async (file: File): Promise<string> => {
    // Validate file
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      throw new Error("Only PNG and JPG images are allowed");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image must be less than 5MB");
    }

    // Get upload URL
    const uploadUrl = await generateUploadUrl({});

    // Upload file
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    const { storageId } = await result.json();
    return storageId;
  };

  return { uploadImage };
}
```

### Component Structure
```
convex/
├── radioStreaming/
│   └── mutations.ts       # MODIFY - Add 4 mutations
src/
├── app/radio/dj-dashboard/settings/
│   └── page.tsx           # MODIFY - Wire up mutations, enable buttons
├── hooks/
│   └── useImageUpload.ts  # NEW - Reusable image upload hook
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useImageUpload.ts` | Reusable image upload with validation |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/radioStreaming/mutations.ts` | Add updateStationInfo, updateSocialLinks, updateStationLogo, updateStationBanner |
| `convex/schema.ts` | Add logoStorageId, bannerStorageId fields to radioStations |
| `src/app/radio/dj-dashboard/settings/page.tsx` | Wire up mutations, enable buttons |

### Files to Delete
| File | Reason |
|------|--------|
| None | |

---

## Dependencies

### External Packages
```bash
# No new packages required
# Uses Convex storage API
```

### Internal Dependencies
- Depends on: None
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test updateStationInfo with valid data
- [ ] Test updateStationInfo rejects non-owner
- [ ] Test updateSocialLinks with all links
- [ ] Test updateSocialLinks with partial links
- [ ] Test image validation (size, type)

### Integration Tests
- [ ] Test full upload flow: select file -> preview -> upload -> save
- [ ] Test replacing existing image deletes old one

### Manual Testing
- [ ] Update DJ name, genre, description - verify saved
- [ ] Upload logo (400x400) - verify displays
- [ ] Upload banner (1200x400) - verify displays
- [ ] Add all social links - verify saved
- [ ] Try uploading >5MB file - verify error
- [ ] Try uploading non-image - verify error
- [ ] Test as non-owner - verify access denied

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All 4 save/upload buttons functional
- [ ] Image validation working
- [ ] Image preview before upload
- [ ] Unit tests written and passing
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Committed with: `feat(story-14-6): implement dj station settings`

---

## Notes for Dev Agent

### Important Considerations
1. **Convex Storage** - Use ctx.storage API for file uploads
2. **Image Cleanup** - Delete old images when replaced
3. **Preview** - Show local preview before upload (URL.createObjectURL)
4. **Station Name** - Keep disabled, add tooltip explaining admin contact

### Schema Update Needed
```typescript
// Add to radioStations table in schema.ts
logoStorageId: v.optional(v.id("_storage")),
bannerStorageId: v.optional(v.id("_storage")),
```

### Questions Resolved
| Question | Answer |
|----------|--------|
| Station name editable? | No, admin-only |
| Max image sizes? | Logo: 400x400, Banner: 1200x400 (recommendations) |
| Image resize server-side? | Optional future enhancement |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-14-6-dj-station-settings
   ```

2. Implementation order:
   - Add schema fields for storage IDs
   - Create mutations in radioStreaming/mutations.ts
   - Create useImageUpload hook
   - Update settings page with form state management
   - Wire up mutations to buttons
   - Add image preview functionality
   - Tests

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-14-6): implement dj station settings"
   git push origin feat/story-14-6-dj-station-settings
   ```

4. Update this story status to Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
