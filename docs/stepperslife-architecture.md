# SteppersLife Multi-Subdomain Architecture

**Last Updated:** 2026-01-15
**Status:** Approved

---

## Overview

SteppersLife is a multi-portal ecosystem for the stepping dance community. Each subdomain serves as a specialized portal while sharing a single authentication system and database.

```
                    stepperslife.com (Hub)
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
   events.*           classes.*         restaurants.*
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    marketplace.*
                    services.*
```

---

## Project Structure

| Subdomain | Folder | Port | Status | Purpose |
|-----------|--------|------|--------|---------|
| stepperslife.com | stepperslife-landing | 3018 | SKELETON | Central hub, login, admin |
| events.stepperslife.com | stepperslife-events | 3001 | MATURE | Event discovery & organizer portal |
| classes.stepperslife.com | stepperslife-classes | 3020 | PARTIAL | Class discovery & instructor portal |
| restaurants.stepperslife.com | stepperslife-restaurants | 3016 | COMPLETE | Restaurant discovery & owner portal |
| marketplace.stepperslife.com | stepperslife-stores | 3017 | COMPLETE | Vendor marketplace |
| services.stepperslife.com | stepperslife-services | 3019 | SKELETON | Service provider directory |

---

## Shared Infrastructure

### Database
- **Platform:** Convex (self-hosted at convex.toolboxhosting.com)
- **Team:** expert-vulture-775
- **Project:** stepperslife
- **Architecture:** Single deployment shared by ALL apps

### Tech Stack (All Apps)
- Next.js 16 with Turbopack
- TypeScript
- Tailwind CSS + Radix UI
- Google OAuth + JWT authentication
- Stripe + PayPal payments

---

## Single Sign-On (SSO)

### How It Works

```
User visits events.stepperslife.com
       │
       ├── Has session_token cookie? ──NO──> Redirect to stepperslife.com/login
       │                                              │
       │                                              ▼
       │                                      User logs in
       │                                              │
       │                                              ▼
       │                                      Cookie set on .stepperslife.com
       │                                              │
       │                                              ▼
       │                                      Redirect back to origin
       │
       └── YES ──> Verify JWT ──> Show authenticated UI
```

### Key Configuration
- **Cookie Domain:** `.stepperslife.com` (readable by all subdomains)
- **Cookie Name:** `session_token`
- **JWT Expiration:** 30 days
- **Signing:** RS256 with shared JWKS

### Files to Keep in Sync
```
src/lib/auth/session-manager.ts  - Cookie domain setting
.env.local                       - JWT_SECRET must match
convex/auth.config.ts            - JWT provider config
```

---

## Role System

### Platform Roles

| Role | Primary Portal | Can Access |
|------|----------------|-----------|
| admin | stepperslife.com/admin | Everything (manage, not own) |
| organizer | events.stepperslife.com | Event creation & management |
| instructor | classes.stepperslife.com | Class creation & management |
| restaurateur | restaurants.stepperslife.com | Restaurant management |
| vendor | marketplace.stepperslife.com | Product listing & sales |
| user | All (consumer view) | Browse & purchase |

### Role-Based UI Pattern

Each portal shows different UI based on user role:

```typescript
// Example: events.stepperslife.com
if (user.role === 'organizer') {
  // Show organizer dashboard with create/manage features
} else {
  // Show consumer view with browse/discover features
}
```

### Multi-Role Users
Users can have multiple roles. Each portal checks if user has the provider role for that portal:

| User Visits | Has Provider Role? | Sees |
|-------------|-------------------|------|
| events.* | organizer: YES | Organizer dashboard |
| events.* | organizer: NO | Consumer/browse view |
| classes.* | instructor: YES | Instructor dashboard |
| classes.* | instructor: NO | Consumer/browse view |

---

## Admin Boundaries

### Principle: Admins Manage, Don't Own

Admins have platform oversight but **cannot create content as themselves**.

| Admin CAN | Admin CANNOT |
|-----------|--------------|
| View all events | Create events as self |
| Process refunds | Own tickets |
| Manage users | Create restaurants |
| Toggle feature flags | List products |
| View analytics | Act as a provider |

### Visual Admin Indicator
When admin is logged in, show:
- Red border around viewport
- "ADMIN MODE" badge
- Clear warning that actions affect real data

---

## Portal Navigation

### Unified Header

All portals include a consistent header with links to other portals:

```
┌──────────────────────────────────────────────────────────┐
│ [Logo]  Events  Classes  Dining  Shop     [User Menu]   │
└──────────────────────────────────────────────────────────┘
```

### Central Hub (stepperslife.com)

```
┌──────────────────────────────────────────────────────────┐
│                    SteppersLife                          │
│            "Your Steppin' Lifestyle Hub"                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│   │ Events  │  │ Classes │  │ Dining  │  │  Shop   │   │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                          │
│               [Sign In]  [Browse as Guest]               │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Auth Standardization
- [ ] Verify cookie domain in all apps
- [ ] Verify JWT_SECRET matches
- [ ] Verify logout clears shared cookie

### Phase 2: Landing Hub
- [ ] Portal navigation cards
- [ ] Central login/register
- [ ] Admin route group

### Phase 3: Unified Header
- [ ] Create shared header component
- [ ] Add to all portals

### Phase 4: Complete Classes
- [ ] Instructor dashboard
- [ ] Class discovery

### Phase 5: Services Definition
- [ ] Define purpose or merge

### Phase 6: SSO Testing
- [ ] Login once, access everywhere
- [ ] Logout once, logout everywhere

---

## Git Repositories

| App | Repository |
|-----|-----------|
| landing | iradwatkins/stepperslife-landing |
| events | iradwatkins/stepperslife-events |
| classes | iradwatkins/stepperslife-classes |
| restaurants | iradwatkins/stepperslife-restaurants |
| stores | iradwatkins/stepperslife-stores |
| services | iradwatkins/stepperslife-services |

---

## Deployment

All apps deployed via **Coolify** on VPS 72.60.28.175.

After each deploy, purge Cloudflare cache:
```bash
/deploy <site-name>
# or
/purge-cache <site-name>
```
