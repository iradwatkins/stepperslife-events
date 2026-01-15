# Product Requirements Document
## Sprint 14: Platform Polish & Team Features

### Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2026-01-15 |
| Status | Draft |
| Author | PM Agent (BMAD) |
| Sprint | 14 |
| Theme | Platform Polish & Team Features |

---

## 1. Overview

### 1.1 Product Summary
Sprint 14 focuses on completing partially-implemented features, addressing legal compliance gaps, and enabling team-based sales functionality. This sprint addresses critical backend gaps in features where UI already exists but mutations are missing, ensuring the platform is production-ready for scaling.

### 1.2 Problem Statement
1. **Team Features Blocked**: Associate/team member UI exists but cannot save data - no backend mutation (`team/my-associates/add/page.tsx:27`)
2. **Legal Compliance Risk**: Privacy Policy and Terms of Service pages display placeholder text only
3. **Notification UX Incomplete**: Bulk delete for read notifications not implemented (`user/notifications/page.tsx:142`)
4. **Radio DJ Settings Non-Functional**: 4 key settings buttons disabled - station info save, logo upload, banner upload, social links save
5. **Team Performance Tracking**: Sales leaderboard shows placeholder, no real data

### 1.3 Target Users
| User Type | Description | Primary Needs |
|-----------|-------------|---------------|
| Event Organizers | Create and manage events | Team management, ticket distribution, sales tracking |
| Sales Associates | Sell tickets on behalf of organizers | Account setup, performance visibility |
| Radio DJs | Broadcast on SteppersLife Radio | Station customization, go-live functionality |
| Platform Users | All users | Legal compliance, notification management |
| Platform Admins | Platform operations | Legal documentation, system health |

### 1.4 Success Metrics
| Metric | Target | Priority |
|--------|--------|----------|
| Associate creation flow functional | End of Sprint | P0 |
| Privacy/Terms pages legally compliant | End of Sprint | P0 |
| Notification bulk delete working | End of Sprint | P1 |
| DJ station settings 100% functional | End of Sprint | P1 |
| Sales leaderboard displaying real data | End of Sprint | P2 |
| All disabled buttons enabled | End of Sprint | P1 |

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

### 2.3 Sprint 13 Completion Status
| Story | Status | Points |
|-------|--------|--------|
| 13.1 Push Notifications | ✅ Complete | 8 |
| 13.2 Premium Webhooks | ✅ Complete | 5 |
| 13.3 Feature Gates | ✅ Complete | 5 |
| 13.4 Staff Roles | ✅ Complete | 5 |
| 13.5 Low-Price Discount | ✅ Complete | 3 |
| 13.6 Event Type Cleanup | ✅ Complete | 3 |
| 13.7 Seating Templates | ✅ Complete | 8 |
| 13.8 Push Preferences UI | ✅ Complete | 3 |

**Sprint 13 Total: 40 points - 100% COMPLETE** (Deployed January 15, 2026)

---

## 3. Feature Requirements

### Epic 1: Team & Associate Features (13 points)

#### Story 14.1: Associate Creation Backend
**As a** team leader
**I want** to add associates to my sales team
**So that** they can sell tickets on my behalf and I can track their performance

**Current State:** `src/app/team/my-associates/add/page.tsx:27` - TODO comment, no mutation call

**Acceptance Criteria:**
- [ ] Create `convex/associates/mutations.ts` with `createAssociate` mutation
- [ ] Create `convex/associates/schema.ts` defining associate data model
- [ ] Associate fields: name, email, phone, status, invitedAt, joinedAt, invitedById
- [ ] Send invitation email via Postal when associate is created
- [ ] Associate can accept invitation and link to their user account
- [ ] Team leader can view pending vs active associates
- [ ] Validation: email uniqueness per team, max 50 associates per leader

**Technical Notes:**
- Associates table links to users table once they accept invitation
- Use existing Postal integration for invitation emails
- Consider associate status: PENDING, ACTIVE, SUSPENDED, REMOVED

**Priority:** P0 | **Estimate:** L (8 pts) | **Dependencies:** None

---

#### Story 14.2: Sales Leaderboard Implementation
**As a** team leader
**I want** to see my team's sales performance ranked
**So that** I can identify top performers and motivate the team

**Current State:** `src/app/team/sales-performance/leaderboard/page.tsx:29` - Placeholder "Leaderboard coming soon"

**Acceptance Criteria:**
- [ ] Create `convex/leaderboard/queries.ts` with `getTeamLeaderboard` query
- [ ] Aggregate sales data by associate for current month
- [ ] Display metrics: total sales, ticket count, revenue generated
- [ ] Rank associates 1st, 2nd, 3rd with visual indicators (gold/silver/bronze)
- [ ] Filter by time period: this week, this month, all time
- [ ] Show trend indicator (up/down from previous period)
- [ ] Empty state when no sales data exists

**Technical Notes:**
- Query orders table where `soldByStaffId` matches team associates
- Consider caching aggregated data for performance
- Link to individual associate detail view

**Priority:** P2 | **Estimate:** M (5 pts) | **Dependencies:** Story 14.1

---

### Epic 2: Legal & Compliance (8 points)

#### Story 14.3: Privacy Policy Page Content
**As a** platform user
**I want** to read the complete privacy policy
**So that** I understand how my data is collected, used, and protected

**Current State:** `src/app/privacy/page.tsx:13` - "Privacy Policy page coming soon."

**Acceptance Criteria:**
- [ ] Complete privacy policy content covering:
  - Data collection (what we collect)
  - Data usage (how we use it)
  - Data sharing (third parties: Stripe, PayPal, analytics)
  - User rights (access, deletion, portability)
  - Cookie policy
  - Children's privacy (13+ requirement)
  - Contact information
- [ ] Proper legal formatting with sections and subsections
- [ ] Last updated date displayed prominently
- [ ] Table of contents for easy navigation
- [ ] Mobile-responsive layout

**Technical Notes:**
- Content should be reviewed by legal counsel before production
- Consider MDX for easier content management
- Add structured data for SEO

**Priority:** P0 | **Estimate:** M (5 pts) | **Dependencies:** None

---

#### Story 14.4: Terms of Service Page Content
**As a** platform user
**I want** to read the complete terms of service
**So that** I understand my rights and obligations when using the platform

**Current State:** `src/app/terms/page.tsx:16` - "Terms of Service page coming soon."

**Acceptance Criteria:**
- [ ] Complete terms of service content covering:
  - Acceptance of terms
  - User accounts and responsibilities
  - Event organizer obligations
  - Ticket purchase terms
  - Refund policy
  - Prohibited content/activities
  - Intellectual property
  - Limitation of liability
  - Dispute resolution
  - Termination
- [ ] Proper legal formatting with numbered sections
- [ ] Last updated date displayed prominently
- [ ] Links to related policies (Privacy, Refund)
- [ ] Mobile-responsive layout

**Technical Notes:**
- Content should be reviewed by legal counsel before production
- Consider shared component for legal page layout
- Add version history for compliance tracking

**Priority:** P0 | **Estimate:** S (3 pts) | **Dependencies:** None

---

### Epic 3: User Experience Polish (8 points)

#### Story 14.5: Notification Bulk Delete
**As a** user
**I want** to delete all read notifications at once
**So that** I can keep my notification center clean without deleting one by one

**Current State:** `src/app/user/notifications/page.tsx:142-154` - Mutation commented out, UI hidden

**Acceptance Criteria:**
- [ ] Create `deleteAllRead` mutation in `convex/notifications/mutations.ts`
- [ ] Mutation deletes all notifications where `isRead === true` for current user
- [ ] Return count of deleted notifications
- [ ] Enable "Clear read" button in notifications page
- [ ] Confirmation dialog before bulk delete
- [ ] Toast notification showing number deleted
- [ ] Graceful handling if no read notifications exist

**Technical Notes:**
- Use batch delete for efficiency (Convex limit: 64 docs per mutation)
- For large notification counts, implement pagination in delete
- Add rate limiting to prevent abuse

**Priority:** P1 | **Estimate:** S (3 pts) | **Dependencies:** None

---

#### Story 14.6: Radio DJ Station Settings
**As a** radio DJ
**I want** to update my station's information, logo, banner, and social links
**So that** my station page reflects my brand and listeners can find me on social media

**Current State:** `src/app/radio/dj-dashboard/settings/page.tsx` - 4 buttons disabled (lines 120, 147, 181, 204, 276)

**Acceptance Criteria:**
- [ ] Create `updateStationInfo` mutation (name, djName, genre, description)
- [ ] Create `uploadStationLogo` mutation with Convex file storage
- [ ] Create `uploadStationBanner` mutation with Convex file storage
- [ ] Create `updateSocialLinks` mutation (instagram, twitter, facebook, website)
- [ ] Enable all save buttons on the settings page
- [ ] Image validation: max 5MB, PNG/JPG only
- [ ] Preview images before upload
- [ ] Success/error toast notifications
- [ ] Station name change requires admin approval (keep disabled with note)

**Technical Notes:**
- Use Convex storage API for image uploads
- Resize images server-side to optimize storage
- Station name remains admin-only change (contact support)

**Priority:** P1 | **Estimate:** M (5 pts) | **Dependencies:** None

---

### Epic 4: Payment & Platform Enhancement (8 points)

#### Story 14.7: Ticket Order Number Schema Fix
**As a** support agent
**I want** ticket enrichment with order details to work
**So that** I can look up complete ticket information for customer support

**Current State:** `convex/tickets/queries.ts` - Function disabled due to schema mismatch: "orderNumber field doesn't exist in schema"

**Acceptance Criteria:**
- [ ] Add `orderNumber` field to orders table in schema
- [ ] Generate unique order numbers on order creation (format: ORD-YYYYMMDD-XXXX)
- [ ] Re-enable `getTicketByOrderNumber` query
- [ ] Re-enable ticket enrichment in ticket detail queries
- [ ] Update existing orders with generated order numbers (migration)
- [ ] Order number visible on customer receipt emails

**Technical Notes:**
- Use timestamp + random suffix for unique order numbers
- Add index on orderNumber for fast lookups
- Migration should be non-destructive

**Priority:** P1 | **Estimate:** M (5 pts) | **Dependencies:** None

---

#### Story 14.8: Ticket Distribution to Team
**As an** event organizer
**I want** to distribute comp tickets to my team members
**So that** staff can have access to the event they're working

**Current State:** `src/app/organizer/team/distribution/page.tsx` - Redirects with "coming soon" comment

**Acceptance Criteria:**
- [ ] Create distribution page UI with team member selector
- [ ] Create `distributeTicketsToStaff` mutation
- [ ] Select ticket type and quantity per team member
- [ ] Track distributed tickets separately from sales
- [ ] Email notification to staff when tickets assigned
- [ ] View/revoke distributed tickets from dashboard

**Technical Notes:**
- Distributed tickets should not count toward sales metrics
- Add `distributedAt` and `distributedBy` fields to tickets
- Consider limit on comp tickets per event

**Priority:** P1 | **Estimate:** S (3 pts) | **Dependencies:** None

---

## 4. Stories Not Included (Backlog)

The following items from the analysis are deferred to future sprints:

| Item | Reason | Target Sprint |
|------|--------|---------------|
| PayPal Payment Flow Completion | Requires PayPal partnership finalization | Sprint 15 |
| Live Chat Support Integration | Requires third-party service selection | Sprint 16 |
| Radio Go-Live Broadcasting | Requires AzuraCast configuration | Sprint 16 |
| Job Applications Module | Large feature scope | Sprint 16+ |
| Class Enrollment System | Depends on class scheduling features | Sprint 15 |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load: < 3 seconds (Core Web Vitals)
- API response: < 500ms for queries
- Image upload: < 10 seconds for 5MB file
- Bulk delete: < 5 seconds for 1000 notifications

### 5.2 Security
- Associate invitations expire after 7 days
- Image uploads scanned for malware patterns
- Legal pages cannot be modified without deploy
- Rate limiting on bulk operations

### 5.3 Scalability
- Associates per team leader: 50 max
- Notifications per user: 1000 max (oldest auto-deleted)
- Image storage: 10MB per station (logo + banner)

### 5.4 Legal Compliance
- Privacy policy meets CCPA requirements
- Terms of service include arbitration clause
- Both pages versioned with effective dates

---

## 6. Dependencies

### 6.1 External Dependencies
| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| Legal review | Human | High | Draft content first, legal review parallel |
| Postal email | Service | Low | Already integrated |
| Convex storage | Platform | Low | Documented pattern |

### 6.2 Internal Dependencies
| Dependency | Owner | Status |
|------------|-------|--------|
| Story 14.1 (Associates) | Sprint 14 | Required for Story 14.2 |
| Story 13.2 (Premium Webhooks) | Sprint 13 | Complete - enables Story 14.7 |

### 6.3 Dependency Graph
```
Story 14.1 (Associate Creation)
    └── Story 14.2 (Sales Leaderboard)

Story 14.3 (Privacy Policy) - Independent
Story 14.4 (Terms of Service) - Independent
Story 14.5 (Notification Bulk Delete) - Independent
Story 14.6 (DJ Station Settings) - Independent
Story 14.7 (Order Number Schema Fix) - Independent
Story 14.8 (Ticket Distribution) - Independent
```

---

## 7. Implementation Schedule

### 7.1 Recommended Execution Order

**Week 1 (P0 Focus - Parallel Tracks):**
| Track A | Track B |
|---------|---------|
| 14.1 Associate Creation (L) | 14.3 Privacy Policy (M) |
| | 14.4 Terms of Service (S) |

**Week 2 (P1 + P0 Dependencies):**
| Track A | Track B |
|---------|---------|
| 14.7 Premium Feature Gates (M) | 14.5 Notification Bulk Delete (S) |
| 14.8 Staff Role Assignment (M) | 14.6 DJ Station Settings (M) |

**Week 3 (P2 + QA):**
| Focus |
|-------|
| 14.2 Sales Leaderboard (M) |
| QA Review + Bug Fixes |
| Legal Review Integration |
| Deployment + Verification |

### 7.2 Story Point Summary
| Priority | Stories | Points |
|----------|---------|--------|
| P0 | 2 (14.1, 14.3) | 13 |
| P1 | 4 (14.5, 14.6, 14.7, 14.8) | 16 |
| P2 | 2 (14.2, 14.4) | 8 |
| **Total** | **8** | **37** |

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Legal content delay | High | High | Draft technical content first; legal polish later |
| Associate schema changes | Medium | Medium | Design schema flexibly for future features |
| Image upload size issues | Medium | Low | Client-side validation before upload |
| Leaderboard performance | Medium | Medium | Cache aggregations; paginate results |
| Premium feature edge cases | Medium | Medium | 7-day grace period; customer support runbook |

---

## 9. Open Questions

- [ ] What is the maximum number of associates per team leader? (proposed: 50)
- [ ] Should associate invitations require organizer approval after acceptance?
- [ ] Legal counsel contact for Privacy/Terms review?
- [ ] DJ station name changes - admin-only or organizer self-service with approval?
- [ ] Notification retention period before auto-deletion?

---

## 10. Testing Requirements

### 10.1 Existing Test Coverage
- Unit tests: 102 passing (Vitest)
- E2E tests: 200 tests (Playwright)

### 10.2 New Tests Required
| Story | Test Type | Count |
|-------|-----------|-------|
| 14.1 | Associate CRUD + invitation | 6 |
| 14.2 | Leaderboard query + aggregation | 4 |
| 14.3 | Privacy page rendering | 2 |
| 14.4 | Terms page rendering | 2 |
| 14.5 | Bulk delete mutation | 3 |
| 14.6 | Station settings + uploads | 5 |
| 14.7 | Feature gate logic | 6 |
| 14.8 | RBAC permission checks | 8 |

---

## 11. Appendix

### A. Glossary
| Term | Definition |
|------|------------|
| Associate | Sales team member who sells tickets on behalf of a team leader |
| Team Leader | Organizer who manages a group of associates |
| Premium Tier | Paid subscription level for organizers (starter/pro/enterprise) |
| Feature Gate | Server-side check that restricts access to paid features |
| RBAC | Role-Based Access Control |

### B. References
- Sprint 13 PRD: `docs/sprint-13-prd.md`
- Sprint 13 Progress: `docs/sprint-13-progress.md`
- Architecture: `docs/stepperslife-architecture.md`

### C. Files to Modify/Create
| File | Stories |
|------|---------|
| `convex/associates/mutations.ts` | 14.1 (new) |
| `convex/associates/queries.ts` | 14.1, 14.2 (new) |
| `convex/schema.ts` | 14.1 (add associates table), 14.7 (add orderNumber) |
| `src/app/team/my-associates/add/page.tsx` | 14.1 |
| `src/app/team/sales-performance/leaderboard/page.tsx` | 14.2 |
| `src/app/privacy/page.tsx` | 14.3 |
| `src/app/terms/page.tsx` | 14.4 |
| `convex/notifications/mutations.ts` | 14.5 |
| `src/app/user/notifications/page.tsx` | 14.5 |
| `convex/radioStreaming/mutations.ts` | 14.6 |
| `src/app/radio/dj-dashboard/settings/page.tsx` | 14.6 |
| `convex/tickets/queries.ts` | 14.7 |
| `convex/orders/mutations.ts` | 14.7 |
| `convex/tickets/mutations.ts` | 14.8 |
| `src/app/organizer/team/distribution/page.tsx` | 14.8 |

### D. UI Components Affected
| Component | Change |
|-----------|--------|
| AddAssociatePage | Connect to mutation, add success flow |
| LeaderboardPage | Replace placeholder with real data |
| PrivacyPage | Add full legal content |
| TermsPage | Add full legal content |
| NotificationsPage | Enable bulk delete button |
| SettingsPage (Radio) | Enable all 4 save buttons |
| OrganizerLayout | Implement role-based navigation |

---

*Created by PM Agent | BMAD-METHOD*
*Project: stepperslife-events | Repo: iradwatkins/stepperslife-events | Port: 3001*
