# Product Requirements Document
## Sprint 13: Revenue & Reliability

### Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2026-01-15 |
| Status | Draft |
| Author | PM Agent (BMAD) |
| Sprint | 13 |
| Theme | Revenue & Reliability |

---

## 1. Overview

### 1.1 Product Summary
Sprint 13 focuses on unlocking premium subscription revenue and ensuring critical operational features (push notifications) are fully functional. This sprint directly impacts revenue generation and operational reliability - the two most critical concerns for an events ticketing platform.

### 1.2 Problem Statement
1. **Revenue Blocked**: Premium tier webhook handler is deferred (line 484 of stripe webhook), preventing subscription revenue processing
2. **Operations Unreliable**: Push notifications only log to console (line 168 of pushNotifications.ts), staff miss critical cash order alerts
3. **Technical Debt**: Event type mapping workaround, missing staff role assignments, incomplete seating templates API

### 1.3 Target Users
| User Type | Description | Primary Needs |
|-----------|-------------|---------------|
| Event Organizers | Create and manage events | Premium features, financial tools, staff management |
| Event Staff | Check-in, cash handling | Real-time alerts, role-based access |
| Platform Admins | Platform operations | Revenue tracking, system health |
| Attendees | Purchase tickets | Reliable notifications |

### 1.4 Success Metrics
| Metric | Target | Priority |
|--------|--------|----------|
| First premium subscription processed | End of Sprint | P0 |
| Push notification delivery rate | > 95% | P0 |
| Premium feature gate coverage | 100% of gated features | P0 |
| Staff role assignment completion | All active organizers | P1 |
| Unit test pass rate | 100% (102 tests) | P0 |
| E2E test pass rate | > 95% (200 tests) | P1 |

---

## 2. Technical Specifications

### 2.1 Infrastructure
| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | Next.js 15, React 19, TypeScript | App Router, Turbopack |
| Styling | Tailwind CSS v4, shadcn/ui | OKLCH colors |
| Database | Convex (self-hosted) | Real-time subscriptions |
| Auth | NextAuth + Convex Auth | Google OAuth, magic links |
| Payments | Stripe + PayPal | Webhooks for subscriptions |
| Email | Postal (self-hosted) | Transactional email |
| Deployment | Coolify on VPS | Auto-deploy from GitHub |
| CDN | Cloudflare | Zone: 83d14540a17e8d55fc44d33e043bb89d |

### 2.2 Project Assignment
| Field | Value |
|-------|-------|
| Local Folder | ~/Documents/projects/stepperslife-events |
| GitHub Repo | iradwatkins/stepperslife-events |
| Production Repo | iradwatkins/stepperslife |
| Dev Port | 3001 |
| Coolify UUID | awsgk0sk4ckw00go4c8w0ogg |
| Domain | stepperslife.com |

### 2.3 Integrations
| Integration | Purpose | Priority |
|-------------|---------|----------|
| Stripe | Payment processing, subscriptions | P0 |
| PayPal | Alternative payments | P1 |
| Postal | Transactional email | P0 |
| Web-Push / OneSignal | Push notifications | P0 |
| Convex | Real-time database | P0 |

---

## 3. Feature Requirements

### Epic 1: Premium Monetization (18 points)

#### Story 13.1: Push Notification Service Integration
**As a** platform operator
**I want** push notifications to actually deliver to devices
**So that** staff receive critical cash order alerts in real-time

**Current State:** `convex/notifications/pushNotifications.ts:168` - Only logs, doesn't send

**Acceptance Criteria:**
- [ ] Integrate web-push or OneSignal for cross-platform delivery
- [ ] Create HTTP action for push delivery (Convex requirement)
- [ ] Staff receives push within 30 seconds of cash order creation
- [ ] Notification payload includes: order ID, amount, event name, location
- [ ] Graceful fallback to in-app notification when push fails
- [ ] Unit tests for notification formatting and queue

**Technical Notes:**
- Convex requires HTTP actions for external service calls
- Consider OneSignal for easier cross-platform support
- Store push subscription tokens in user profile

**Priority:** P0 | **Estimate:** L (8 pts) | **Dependencies:** None

---

#### Story 13.2: Premium Tier Webhook Handler
**As a** platform
**I want** Stripe subscription webhooks processed correctly
**So that** premium subscriptions are activated for organizers

**Current State:** `src/app/api/webhooks/stripe/route.ts:484` - DEFERRED comment

**Acceptance Criteria:**
- [ ] Handle `customer.subscription.created` event
- [ ] Handle `customer.subscription.updated` event (upgrades/downgrades)
- [ ] Handle `customer.subscription.deleted` event (cancellation)
- [ ] Update organizer profile with: tier level, subscription ID, expiry date
- [ ] Webhook signature verification (security)
- [ ] Idempotency handling for duplicate webhooks
- [ ] Audit log entry for all tier changes

**Technical Notes:**
- Stripe webhook secret already in environment
- Use Convex mutation to update organizer tier
- Test with Stripe CLI webhook forwarding

**Priority:** P0 | **Estimate:** M (5 pts) | **Dependencies:** None

---

#### Story 13.3: Premium Feature Gate Implementation
**As an** organizer
**I want** premium features gated appropriately
**So that** I understand what I get by upgrading

**Acceptance Criteria:**
- [ ] Create `usePremiumFeatures()` hook returning tier and feature flags
- [ ] Gate features: custom branding, advanced analytics, priority support, unlimited events
- [ ] Show upgrade prompts when free-tier users access gated features
- [ ] Premium badge on organizer profile
- [ ] Feature comparison modal for upgrade flow
- [ ] Graceful handling of expired subscriptions (7-day grace period)

**Technical Notes:**
- Feature flags should be server-validated (not just client-side)
- Cache tier status to reduce Convex queries
- Consider feature flag service for future flexibility

**Priority:** P0 | **Estimate:** M (5 pts) | **Dependencies:** Story 13.2

---

### Epic 2: Organizer Tools (11 points)

#### Story 13.4: Staff Role Assignment System
**As an** event organizer
**I want** to assign roles to my staff
**So that** they have appropriate permissions for their duties

**Current State:** `src/app/organizer/layout.tsx:43` - Roles hardcoded to empty array

**Acceptance Criteria:**
- [ ] Define role types: OWNER, MANAGER, STAFF, VOLUNTEER
- [ ] Create role assignment UI in organizer settings
- [ ] Permission matrix: who can do what (scanning, cash, refunds)
- [ ] Role-based dashboard sections (hide irrelevant modules)
- [ ] Invitation flow for adding new staff members
- [ ] Role change audit log

**Technical Notes:**
- Roles stored on team member relationship, not user profile
- OWNER role auto-assigned to event creator
- Consider RBAC library for permission checking

**Priority:** P1 | **Estimate:** M (5 pts) | **Dependencies:** None

---

#### Story 13.5: Low-Price Discount Detection
**As a** platform
**I want** budget-friendly events identified automatically
**So that** we can offer reduced platform fees

**Current State:** `convex/paymentConfig/mutations.ts:188` - `lowPriceDiscount: false`

**Acceptance Criteria:**
- [ ] Define "low-price" threshold (configurable, default $15)
- [ ] Auto-detect qualifying events during creation
- [ ] Apply platform fee reduction (50% off processing fee)
- [ ] Visual indicator on event card ("Budget Friendly" badge)
- [ ] Organizer notification when discount auto-applied
- [ ] Admin toggle to enable/disable feature globally

**Technical Notes:**
- Threshold should be configurable in payment config
- Consider tiered discounts based on price ranges
- Document discount policy for organizers

**Priority:** P1 | **Estimate:** S (3 pts) | **Dependencies:** None

---

#### Story 13.6: Event Type Mapping Cleanup
**As a** developer
**I want** proper event types without workarounds
**So that** the codebase is clean and maintainable

**Current State:** `src/app/organizer/events/create/page.tsx:460` - GENERAL_POSTING → FREE_EVENT

**Acceptance Criteria:**
- [ ] Define proper event type enum: TICKETED, FREE, RSVP, GENERAL_POSTING
- [ ] Update event creation form with all valid types
- [ ] Migrate existing GENERAL_POSTING events to correct type
- [ ] Type-specific validation rules (e.g., FREE cannot have ticket prices)
- [ ] Update event cards to display type appropriately
- [ ] Remove workaround code

**Technical Notes:**
- Database migration needed for existing events
- Consider backward compatibility for API consumers
- Update TypeScript types across codebase

**Priority:** P1 | **Estimate:** S (3 pts) | **Dependencies:** None

---

### Epic 3: Platform Enhancement (11 points)

#### Story 13.7: Seating Templates API Foundation
**As an** organizer
**I want** to create and manage seating templates
**So that** I can quickly set up venue layouts for events

**Current State:** `src/app/organizer/templates/page.tsx:91` - Templates hardcoded to undefined

**Acceptance Criteria:**
- [ ] CRUD API for seating templates
- [ ] Template data model: name, venue type, sections, rows, seats
- [ ] Preset templates: theater, classroom, banquet, standing
- [ ] Clone template functionality
- [ ] Template preview in selection UI
- [ ] Permission check (OWNER/MANAGER only)
- [ ] Maximum 50 templates per organizer (prevent abuse)

**Technical Notes:**
- API foundation only; full seating chart UI is future sprint
- Store templates as JSON schema
- Depends on Story 13.4 for permission checking

**Priority:** P2 | **Estimate:** L (8 pts) | **Dependencies:** Story 13.4

---

#### Story 13.8: Push Notification Preferences UI
**As a** user
**I want** to control my notification preferences
**So that** I only receive notifications I want

**Acceptance Criteria:**
- [ ] Preferences page in user settings
- [ ] Toggle categories: order updates, event reminders, marketing, staff alerts
- [ ] Frequency options: immediate, daily digest, weekly digest
- [ ] "Mute all" emergency option
- [ ] Browser permission request flow with explanation
- [ ] Respect preferences in notification service

**Technical Notes:**
- Store preferences in user profile
- Default to opt-in for transactional, opt-out for marketing
- Consider quiet hours setting

**Priority:** P2 | **Estimate:** S (3 pts) | **Dependencies:** Story 13.1

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load: < 3 seconds (Core Web Vitals)
- API response: < 500ms for queries
- Push notification delivery: < 30 seconds
- Webhook processing: < 5 seconds

### 4.2 Security
- Webhook signature verification required
- Premium features server-validated
- Role-based access control enforced
- No sensitive data in push payloads

### 4.3 Scalability
- Expected premium subscribers: 100 in first quarter
- Push notifications: 10,000/day capacity
- Template storage: 50 per organizer

### 4.4 Reliability
- Push notification fallback to in-app
- Subscription webhook retry on failure
- Feature gates cache with invalidation

---

## 5. Dependencies

### 5.1 External Dependencies
| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| Stripe Webhooks | API | Low | Existing integration |
| Web-Push/OneSignal | Service | Medium | Spike first, backup option |
| Convex HTTP Actions | Platform | Low | Documented pattern |

### 5.2 Internal Dependencies
| Dependency | Owner | Status |
|------------|-------|--------|
| Story 13.2 (Webhooks) | Sprint 13 | Required for Story 13.3 |
| Story 13.1 (Push) | Sprint 13 | Required for Story 13.8 |
| Story 13.4 (Roles) | Sprint 13 | Required for Story 13.7 |

### 5.3 Dependency Graph
```
Story 13.1 (Push Notifications)
    └── Story 13.8 (Notification Preferences)

Story 13.2 (Premium Webhook)
    └── Story 13.3 (Feature Gates)

Story 13.4 (Staff Roles)
    └── Story 13.7 (Seating Templates)

Story 13.5 (Low-Price Discount) - Independent
Story 13.6 (Event Type Mapping) - Independent
```

---

## 6. Implementation Schedule

### 6.1 Recommended Execution Order

**Week 1 (P0 Focus - Parallel Tracks):**
| Track A | Track B |
|---------|---------|
| 13.1 Push Notifications (L) | 13.2 Premium Webhooks (M) |
| | 13.5 Low-Price Discount (S) |

**Week 2 (Dependencies + P1):**
| Track A | Track B |
|---------|---------|
| 13.3 Feature Gates (M) | 13.4 Staff Roles (M) |
| 13.8 Notification Prefs (S) | 13.6 Event Type Cleanup (S) |

**Week 3 (P2 + Buffer):**
| Focus |
|-------|
| 13.7 Seating Templates (L) |
| QA Review + Bug Fixes |
| Deployment + Verification |

### 6.2 Story Point Summary
| Priority | Stories | Points |
|----------|---------|--------|
| P0 | 3 | 18 |
| P1 | 3 | 11 |
| P2 | 2 | 11 |
| **Total** | **8** | **40** |

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Push notification integration complexity | Medium | High | Spike first day; OneSignal as backup |
| Stripe webhook testing in production | Low | High | Use test mode; comprehensive logging |
| Seating templates scope creep | High | Medium | Strict API-only scope; defer UI to Sprint 14 |
| Staff role migration issues | Medium | Medium | Feature flag rollout; backward compatibility |
| Premium feature edge cases | Medium | Medium | 7-day grace period; customer support runbook |

---

## 8. Open Questions

- [x] Push notification provider: Web-Push vs OneSignal? → **Recommend OneSignal for cross-platform**
- [x] Premium tier pricing structure? → **Defer to business decision; implement flexible tier system**
- [ ] Seating template preset list - what venue types to support?
- [ ] Low-price threshold - $15 default, should this be per-region?

---

## 9. Testing Requirements

### 9.1 Existing Test Coverage
- Unit tests: 102 passing (Vitest)
- E2E tests: 200 tests (Playwright)

### 9.2 New Tests Required
| Story | Test Type | Count |
|-------|-----------|-------|
| 13.1 | Unit + Integration | 5 |
| 13.2 | Webhook mock tests | 4 |
| 13.3 | Feature gate unit tests | 6 |
| 13.4 | RBAC permission tests | 8 |
| 13.5 | Price threshold tests | 3 |
| 13.6 | Migration tests | 2 |
| 13.7 | API CRUD tests | 6 |
| 13.8 | Preferences unit tests | 4 |

---

## 10. Appendix

### A. Glossary
| Term | Definition |
|------|------------|
| Premium Tier | Paid subscription level for organizers |
| Feature Gate | Server-side check that restricts access to paid features |
| Web-Push | Browser notification API for real-time alerts |
| RBAC | Role-Based Access Control |

### B. References
- Sprint 12 Plan: `~/.claude/plans/sprint-12-stepperslife.md`
- Architecture: `docs/stepperslife-architecture.md`
- Sprint 12 Stories: `docs/stories/story-12-*.md`

### C. Files to Modify
| File | Stories |
|------|---------|
| `convex/notifications/pushNotifications.ts` | 13.1, 13.8 |
| `src/app/api/webhooks/stripe/route.ts` | 13.2 |
| `src/app/organizer/layout.tsx` | 13.3, 13.4 |
| `convex/paymentConfig/mutations.ts` | 13.5 |
| `src/app/organizer/events/create/page.tsx` | 13.6 |
| `src/app/organizer/templates/page.tsx` | 13.7 |
| `src/app/settings/notifications/page.tsx` | 13.8 (new) |

---

*Created by PM Agent | BMAD-METHOD*
*Project: stepperslife-events | Repo: iradwatkins/stepperslife-events | Port: 3001*
