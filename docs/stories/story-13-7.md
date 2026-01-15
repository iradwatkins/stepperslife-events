# Story 13.7: Seating Templates API Foundation

## Status
| Field | Value |
|-------|-------|
| Status | 🟢 Approved |
| Priority | P2 (Medium) |
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
- [ ] Create feature branch: `git checkout -b feat/story-13-7-seating-templates`

---

## User Story

**As an** organizer
**I want to** create and manage seating templates
**So that** I can quickly set up venue layouts for events

---

## Description

### Background
The templates page at `src/app/organizer/templates/page.tsx:91` hardcodes floor plan templates to undefined because the API doesn't exist yet. This story creates the API foundation for seating templates.

### Current State
```typescript
// Line 91
const floorPlanTemplates: FloorPlanTemplate[] | undefined = undefined;
// TODO: api.seating.templates.getMyTemplates when available
```

### Scope
**API ONLY** - This story creates the CRUD API and basic template management UI. The full visual seating chart builder is deferred to Sprint 14+.

---

## Acceptance Criteria

### Functional Requirements
- [ ] CRUD API for seating templates
- [ ] Template data model: name, venue type, sections, rows, seats
- [ ] Preset templates: theater, classroom, banquet, standing
- [ ] Clone template functionality
- [ ] Template list UI with basic preview
- [ ] Permission check (OWNER/MANAGER only)
- [ ] Maximum 50 templates per organizer

### Non-Functional Requirements
- [ ] API response < 500ms
- [ ] Template JSON schema validated

---

## Technical Implementation

### Database Changes

#### Convex Schema
```typescript
// convex/schema.ts - Add seatingTemplates table

defineTable("seatingTemplates", {
  organizerId: v.id("users"),
  name: v.string(),
  venueType: v.union(
    v.literal("theater"),
    v.literal("classroom"),
    v.literal("banquet"),
    v.literal("standing"),
    v.literal("custom")
  ),
  description: v.optional(v.string()),
  layout: v.object({
    sections: v.array(v.object({
      id: v.string(),
      name: v.string(),
      rows: v.array(v.object({
        id: v.string(),
        label: v.string(),
        seats: v.array(v.object({
          id: v.string(),
          label: v.string(),
          type: v.union(v.literal("regular"), v.literal("vip"), v.literal("accessible")),
          x: v.number(),
          y: v.number(),
        })),
      })),
    })),
    stage: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      width: v.number(),
      height: v.number(),
    })),
    dimensions: v.object({
      width: v.number(),
      height: v.number(),
    }),
  }),
  isPreset: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_organizer", ["organizerId"])
.index("by_venueType", ["venueType"]),
```

### CRUD Mutations
```typescript
// convex/seating/templates.ts (NEW FILE)
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    venueType: v.string(),
    layout: v.any(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await getUserFromIdentity(ctx, identity);

    // Check limit (50 templates max)
    const count = await ctx.db
      .query("seatingTemplates")
      .withIndex("by_organizer", q => q.eq("organizerId", user._id))
      .collect();

    if (count.length >= 50) {
      throw new Error("Maximum 50 templates allowed");
    }

    return await ctx.db.insert("seatingTemplates", {
      organizerId: user._id,
      name: args.name,
      venueType: args.venueType as any,
      layout: args.layout,
      description: args.description,
      isPreset: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const clone = mutation({
  args: { templateId: v.id("seatingTemplates"), newName: v.string() },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const identity = await ctx.auth.getUserIdentity();
    const user = await getUserFromIdentity(ctx, identity);

    return await ctx.db.insert("seatingTemplates", {
      ...template,
      _id: undefined,
      name: args.newName,
      organizerId: user._id,
      isPreset: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getMyTemplates = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserFromIdentity(ctx, identity);

    return await ctx.db
      .query("seatingTemplates")
      .withIndex("by_organizer", q => q.eq("organizerId", user._id))
      .order("desc")
      .collect();
  },
});
```

### Preset Templates
```typescript
// convex/seating/presets.ts (NEW FILE)
export const PRESET_TEMPLATES = [
  {
    name: "Theater (100 seats)",
    venueType: "theater",
    layout: {
      sections: [{
        id: "main",
        name: "Main Floor",
        rows: Array.from({ length: 10 }, (_, i) => ({
          id: `row-${i}`,
          label: String.fromCharCode(65 + i),
          seats: Array.from({ length: 10 }, (_, j) => ({
            id: `seat-${i}-${j}`,
            label: `${j + 1}`,
            type: "regular",
            x: j * 40,
            y: i * 40,
          })),
        })),
      }],
      dimensions: { width: 400, height: 400 },
    },
  },
  // ... more presets
];
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `convex/seating/templates.ts` | CRUD mutations/queries |
| `convex/seating/presets.ts` | Preset template definitions |
| `src/components/seating/TemplateList.tsx` | Template list UI |
| `src/components/seating/TemplatePreview.tsx` | Simple preview |
| `src/components/seating/CreateTemplateModal.tsx` | Create/edit modal |

### Files to Modify
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add seatingTemplates table |
| `src/app/organizer/templates/page.tsx` | Wire up to API |

---

## Dependencies

### Internal Dependencies
- Depends on: Story 13.4 (Staff Roles - for permission check)
- Blocks: None (Full seating UI is Sprint 14+)

---

## Testing Requirements

### Unit Tests
- [ ] Test CRUD operations
- [ ] Test 50 template limit
- [ ] Test clone functionality

### Integration Tests
- [ ] Test permission enforcement
- [ ] Test preset templates load

### Manual Testing
- [ ] Create template from preset
- [ ] Clone existing template
- [ ] Delete template
- [ ] Verify 50 limit enforced

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] CRUD API functional
- [ ] Preset templates available
- [ ] Template list UI working
- [ ] Tests passing
- [ ] Committed with: `feat(story-13-7): implement seating templates API`

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   git checkout -b feat/story-13-7-seating-templates
   ```

2. Implementation order:
   - Schema first
   - Mutations/queries
   - Preset definitions
   - UI components
   - Wire up templates page

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-13-7): implement seating templates API"
   git push origin feat/story-13-7-seating-templates
   ```

---

*Created by SM Agent | BMAD-METHOD*
