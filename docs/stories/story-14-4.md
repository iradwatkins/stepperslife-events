# Story 14.4: Terms of Service Page Content

## Status
| Field | Value |
|-------|-------|
| Status | Draft |
| Priority | P2 |
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
- [ ] Create feature branch: `git checkout -b feat/story-14-4-terms-of-service`

---

## User Story

**As a** platform user
**I want to** read the complete terms of service
**So that** I understand my rights and obligations when using the platform

---

## Description

### Background
The terms of service page at `src/app/terms/page.tsx` currently displays only a placeholder message "Terms of Service page coming soon." (line 16). This is a legal requirement for the platform.

### Current State
```typescript
// src/app/terms/page.tsx:16
<p className="text-muted-foreground dark:text-muted-foreground mb-4">
  Terms of Service page coming soon.
</p>
```

### User Flow
1. User navigates to /terms (from footer link or during signup)
2. User sees complete, legally formatted terms of service
3. User can navigate via table of contents
4. User sees last updated date and effective date

---

## Acceptance Criteria

### Functional Requirements
- [ ] Complete terms of service content covering all required sections
- [ ] Acceptance of terms section
- [ ] User accounts and responsibilities section
- [ ] Event organizer obligations section
- [ ] Ticket purchase terms section
- [ ] Refund policy section
- [ ] Prohibited content/activities section
- [ ] Intellectual property section
- [ ] Limitation of liability section
- [ ] Dispute resolution / arbitration section
- [ ] Termination section

### Content Requirements
- [ ] Proper legal formatting with numbered sections
- [ ] Last updated date displayed prominently
- [ ] Table of contents for easy navigation
- [ ] Links to related policies (Privacy, Refund)
- [ ] Mobile-responsive layout
- [ ] Arbitration clause as required

### Non-Functional Requirements
- [ ] SEO: Proper meta tags
- [ ] Accessibility: Screen reader friendly
- [ ] Performance: Page loads < 2 seconds

---

## Technical Implementation

### Page Structure
```typescript
// src/app/terms/page.tsx
"use client";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";

export default function TermsPage() {
  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-card dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-card rounded-lg shadow-sm p-8">
          <TermsOfServiceContent />
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
```

### Terms Sections
```typescript
// src/components/legal/TermsOfServiceContent.tsx
const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "eligibility", title: "2. Eligibility" },
  { id: "accounts", title: "3. User Accounts" },
  { id: "organizers", title: "4. Event Organizer Terms" },
  { id: "attendees", title: "5. Event Attendee Terms" },
  { id: "tickets", title: "6. Ticket Purchases" },
  { id: "refunds", title: "7. Refunds and Cancellations" },
  { id: "payments", title: "8. Payments and Fees" },
  { id: "content", title: "9. User Content" },
  { id: "prohibited", title: "10. Prohibited Activities" },
  { id: "intellectual-property", title: "11. Intellectual Property" },
  { id: "disclaimers", title: "12. Disclaimers" },
  { id: "limitation", title: "13. Limitation of Liability" },
  { id: "indemnification", title: "14. Indemnification" },
  { id: "arbitration", title: "15. Dispute Resolution" },
  { id: "termination", title: "16. Termination" },
  { id: "general", title: "17. General Provisions" },
  { id: "contact", title: "18. Contact Information" },
];
```

### Component Structure
```
src/
├── app/
│   └── terms/
│       └── page.tsx           # MODIFY - Add full content
├── components/
│   └── legal/
│       └── TermsOfServiceContent.tsx  # NEW - ToS content
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/legal/TermsOfServiceContent.tsx` | Full terms of service content |

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/terms/page.tsx` | Replace placeholder with full content |

### Files to Delete
| File | Reason |
|------|--------|
| None | |

---

## Content Sections (Draft)

### Section 1: Acceptance of Terms
- By using the service, you agree to these terms
- If you don't agree, don't use the service
- Changes notification process

### Section 2: Eligibility
- Must be 13+ years old
- Must have capacity to enter binding agreements
- Must comply with local laws

### Section 3: User Accounts
- Account creation requirements
- Account security responsibility
- One account per person
- Account sharing prohibited

### Section 4: Event Organizer Terms
- Organizer registration requirements
- Event content standards
- Pricing and fees
- Payout terms
- Tax responsibility
- Insurance recommendations

### Section 5: Event Attendee Terms
- Ticket purchase agreements
- Event attendance expectations
- Code of conduct

### Section 6: Ticket Purchases
- Ticket ownership and transfer
- QR code validity
- No resale at markup
- Event modifications/cancellations

### Section 7: Refunds and Cancellations
- Organizer-initiated cancellations (full refund)
- Attendee-requested refunds (organizer policy)
- Platform fee refund policy
- Timeframes

### Section 8: Payments and Fees
- Platform fees
- Payment processor fees
- Payout schedules
- Currency

### Section 9: User Content
- Content ownership
- License to platform
- Content standards
- Removal rights

### Section 10: Prohibited Activities
- Fraudulent events
- Spam and harassment
- Illegal activities
- Circumventing fees
- Data scraping

### Section 11: Intellectual Property
- Platform IP ownership
- User content license
- Trademark usage

### Section 12: Disclaimers
- Service provided "as is"
- No warranty of availability
- No guarantee of event quality

### Section 13: Limitation of Liability
- Cap on damages
- Exclusion of consequential damages
- Essential purpose

### Section 14: Indemnification
- User indemnifies platform
- Scope of indemnification

### Section 15: Dispute Resolution
- Informal resolution first
- Binding arbitration
- Class action waiver
- Small claims exception
- Opt-out procedure

### Section 16: Termination
- User termination rights
- Platform termination rights
- Effect of termination

### Section 17: General Provisions
- Entire agreement
- Severability
- Waiver
- Assignment
- Governing law (Delaware)

### Section 18: Contact Information
- Legal: legal@stepperslife.com
- Support: support@stepperslife.com
- Mailing address

---

## Dependencies

### External Packages
```bash
# No new packages required
```

### Internal Dependencies
- Depends on: Story 14.3 (for shared LegalPageLayout component)
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test table of contents navigation
- [ ] Test section anchors

### Integration Tests
- [ ] Test page renders completely
- [ ] Test links to privacy policy work

### Manual Testing
- [ ] Verify all sections display correctly
- [ ] Test table of contents links
- [ ] Test on mobile devices
- [ ] Verify cross-links to other policies
- [ ] Check accessibility

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All content sections complete
- [ ] Arbitration clause included
- [ ] Table of contents functional
- [ ] Links to related policies working
- [ ] Mobile responsive verified
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Committed with: `feat(story-14-4): add terms of service content`

---

## Notes for Dev Agent

### Important Considerations
1. **Legal Disclaimer** - Content should be reviewed by legal counsel before production
2. **Arbitration Clause** - This is a standard requirement for US-based platforms
3. **Effective Date** - Use January 15, 2026 as effective date
4. **Cross-links** - Link to Privacy Policy and Refund Policy where appropriate

### Reuse from Story 14.3
- Use same LegalPageLayout component
- Use same TableOfContents component
- Maintain consistent styling

### Questions Resolved
| Question | Answer |
|----------|--------|
| Arbitration required? | Yes, standard practice |
| Governing law? | Delaware |
| Class action waiver? | Yes, include |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-14-4-terms-of-service
   ```

2. Implementation order:
   - Verify Story 14.3 components are available
   - Create TermsOfServiceContent with all sections
   - Update terms page to use new component
   - Add cross-links to privacy policy
   - Test responsive layout

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-14-4): add terms of service content"
   git push origin feat/story-14-4-terms-of-service
   ```

4. Update this story status to Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
