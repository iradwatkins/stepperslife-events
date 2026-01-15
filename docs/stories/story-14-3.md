# Story 14.3: Privacy Policy Page Content

## Status
| Field | Value |
|-------|-------|
| Status | Draft |
| Priority | P0 (Critical) |
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
- [ ] Create feature branch: `git checkout -b feat/story-14-3-privacy-policy`

---

## User Story

**As a** platform user
**I want to** read the complete privacy policy
**So that** I understand how my data is collected, used, and protected

---

## Description

### Background
The privacy policy page at `src/app/privacy/page.tsx` currently displays only a placeholder message "Privacy Policy page coming soon." (line 13). This is a legal compliance requirement that must be addressed before the platform can scale.

### Current State
```typescript
// src/app/privacy/page.tsx:13
<p className="text-muted-foreground dark:text-muted-foreground mb-4">
  Privacy Policy page coming soon.
</p>
```

### User Flow
1. User navigates to /privacy (from footer link or directly)
2. User sees complete, legally compliant privacy policy
3. User can navigate via table of contents
4. User sees last updated date prominently displayed

---

## Acceptance Criteria

### Functional Requirements
- [ ] Complete privacy policy content covering all required sections
- [ ] Data collection section (what data we collect)
- [ ] Data usage section (how we use collected data)
- [ ] Data sharing section (third parties: Stripe, PayPal, Google Analytics, Convex)
- [ ] User rights section (access, deletion, portability, CCPA rights)
- [ ] Cookie policy section
- [ ] Children's privacy section (13+ requirement)
- [ ] Contact information section
- [ ] Security measures section
- [ ] Policy changes notification section

### Content Requirements
- [ ] Proper legal formatting with numbered sections
- [ ] Last updated date displayed prominently at top
- [ ] Table of contents for easy navigation
- [ ] Effective date clearly stated
- [ ] CCPA compliance (California residents section)
- [ ] Mobile-responsive layout
- [ ] Print-friendly formatting

### Non-Functional Requirements
- [ ] SEO: Proper meta tags and structured data
- [ ] Accessibility: Screen reader friendly
- [ ] Performance: Page loads < 2 seconds

---

## Technical Implementation

### Page Structure
```typescript
// src/app/privacy/page.tsx
"use client";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-card dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-card rounded-lg shadow-sm p-8">
          <PrivacyPolicyContent />
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
```

### Privacy Policy Sections
```typescript
// src/components/legal/PrivacyPolicyContent.tsx
const sections = [
  { id: "introduction", title: "1. Introduction" },
  { id: "information-collected", title: "2. Information We Collect" },
  { id: "how-we-use", title: "3. How We Use Your Information" },
  { id: "information-sharing", title: "4. Information Sharing" },
  { id: "cookies", title: "5. Cookies and Tracking" },
  { id: "data-security", title: "6. Data Security" },
  { id: "your-rights", title: "7. Your Rights" },
  { id: "ccpa", title: "8. California Privacy Rights (CCPA)" },
  { id: "children", title: "9. Children's Privacy" },
  { id: "international", title: "10. International Users" },
  { id: "changes", title: "11. Changes to This Policy" },
  { id: "contact", title: "12. Contact Us" },
];
```

### Component Structure
```
src/
├── app/
│   └── privacy/
│       └── page.tsx           # MODIFY - Add full content
├── components/
│   └── legal/
│       ├── PrivacyPolicyContent.tsx  # NEW - Privacy policy content
│       ├── LegalPageLayout.tsx       # NEW - Shared layout for legal pages
│       └── TableOfContents.tsx       # NEW - Navigation component
```

---

## File List

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/legal/PrivacyPolicyContent.tsx` | Full privacy policy content |
| `src/components/legal/LegalPageLayout.tsx` | Shared layout for legal pages |
| `src/components/legal/TableOfContents.tsx` | Navigation sidebar |

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/privacy/page.tsx` | Replace placeholder with full content |

### Files to Delete
| File | Reason |
|------|--------|
| None | |

---

## Content Sections (Draft)

### Section 1: Introduction
- Company name: SteppersLife, LLC
- Purpose of policy
- Scope of policy (website, mobile apps, services)
- Agreement to terms by using service

### Section 2: Information We Collect
- Account information (name, email, phone)
- Payment information (processed via Stripe/PayPal)
- Event information (for organizers)
- Usage data (analytics)
- Device information
- Location data (optional, for event discovery)

### Section 3: How We Use Your Information
- Provide and improve services
- Process transactions
- Send communications (receipts, updates)
- Marketing (with opt-out)
- Analytics and research
- Legal compliance

### Section 4: Information Sharing
- Third-party service providers:
  - Stripe (payment processing)
  - PayPal (payment processing)
  - Google Analytics (usage analytics)
  - Convex (database services)
  - Postal (email delivery)
- Event organizers (for ticket purchases)
- Legal requirements
- Business transfers

### Section 5: Cookies and Tracking
- Types of cookies used
- Analytics tracking
- How to manage cookies
- Do Not Track signals

### Section 6: Data Security
- Encryption in transit (HTTPS)
- Encryption at rest
- Access controls
- Regular security audits

### Section 7: Your Rights
- Access your data
- Correct your data
- Delete your data
- Export your data
- Opt-out of marketing
- Withdraw consent

### Section 8: California Privacy Rights (CCPA)
- Right to know
- Right to delete
- Right to opt-out of sale
- Right to non-discrimination
- How to exercise rights
- Verification process

### Section 9: Children's Privacy
- 13+ requirement
- No knowingly collecting from children
- Parent/guardian contact

### Section 10: International Users
- Data transfers
- EU/UK users (GDPR reference)
- Privacy Shield

### Section 11: Changes to This Policy
- Notification of changes
- Continued use = acceptance
- Review history

### Section 12: Contact Us
- Privacy questions: privacy@stepperslife.com
- General support: support@stepperslife.com
- Mailing address

---

## Dependencies

### External Packages
```bash
# No new packages required
```

### Internal Dependencies
- Depends on: None
- Blocks: None

---

## Testing Requirements

### Unit Tests
- [ ] Test table of contents navigation
- [ ] Test section anchors work correctly

### Integration Tests
- [ ] Test page renders completely
- [ ] Test responsive layout

### Manual Testing
- [ ] Verify all sections display correctly
- [ ] Test table of contents links
- [ ] Test on mobile devices
- [ ] Verify print layout
- [ ] Check accessibility (screen reader)
- [ ] Verify last updated date displays

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All content sections complete
- [ ] CCPA compliance section included
- [ ] Table of contents functional
- [ ] Mobile responsive verified
- [ ] Accessibility tested
- [ ] Code reviewed by QA agent
- [ ] No console errors/warnings
- [ ] Committed with: `feat(story-14-3): add privacy policy content`

---

## Notes for Dev Agent

### Important Considerations
1. **Legal Disclaimer** - Content should be reviewed by legal counsel before production
2. **CCPA Compliance** - California law requires specific disclosures
3. **Effective Date** - Use January 15, 2026 as effective date
4. **Version Tracking** - Consider adding version history at bottom

### Design Guidelines
- Use clear, readable typography
- Maintain consistent section spacing
- Use semantic HTML for accessibility
- Include print styles for clean printing

### Questions Resolved
| Question | Answer |
|----------|--------|
| Legal review required? | Yes, before production deployment |
| Include version history? | Yes, at bottom of page |
| Effective date? | January 15, 2026 |

---

## Dev Agent Instructions

1. Before starting:
   ```bash
   cd ~/Documents/projects/stepperslife-events
   pwd  # Verify: /Users/irawatkins/Documents/projects/stepperslife-events
   git remote -v  # Verify: iradwatkins/stepperslife-events
   git checkout -b feat/story-14-3-privacy-policy
   ```

2. Implementation order:
   - Create LegalPageLayout component
   - Create TableOfContents component
   - Create PrivacyPolicyContent with all sections
   - Update privacy page to use new components
   - Test responsive layout
   - Test accessibility

3. After completion:
   ```bash
   git add .
   git commit -m "feat(story-14-3): add privacy policy content"
   git push origin feat/story-14-3-privacy-policy
   ```

4. Update this story status to Review and invoke:
   ```
   *agent qa
   ```

---

*Created by SM Agent | BMAD-METHOD*
*Story ready for Dev Agent implementation*
