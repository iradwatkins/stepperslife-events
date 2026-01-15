# SteppersLife Events

Event organizer portal for the SteppersLife platform.

**Domain:** events.stepperslife.com
**Port:** 3001
**Role:** Creator portal for event organizers

## Purpose

Event organizers use this portal to:
- Create and manage events
- Set up ticket tiers and pricing
- Manage event staff and sales
- Configure seating charts
- Track ticket sales and revenue
- Process payouts

Also contains the **Admin Panel** at `/admin` for platform management.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Convex (shared backend)
- Stripe + PayPal payments
- Tailwind CSS 4 + Radix UI

## Development

```bash
npm install
npm run dev          # http://localhost:3001
```

## Build & Deploy

```bash
npm run build:with-convex   # Build with Convex deploy
```

Deploy via Coolify, then purge Cloudflare cache.

## Testing

```bash
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:payment:all  # Payment tests
```

## Related

- Platform docs: `~/.claude/references/stepperslife-platform.md`
- Main aggregator: stepperslife-landing
