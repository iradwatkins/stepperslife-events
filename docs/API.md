# SteppersLife Events API Documentation

## Base URL
- Production: `https://events.stepperslife.com`
- Development: `http://localhost:3001`

---

## Authentication

### Session-Based Authentication
All authenticated endpoints require a valid session cookie (`session_token`).

### Endpoints

#### `POST /api/auth/register`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

#### `POST /api/auth/login`
Authenticate and create a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Cookies Set:**
- `session_token` - JWT session token (HttpOnly, Secure)
- `csrf_token` - CSRF protection token

---

#### `POST /api/auth/logout`
End the current session.

**Headers Required:**
- `x-csrf-token` - CSRF token from cookie

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### `GET /api/auth/me`
Get current user information.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "isAdmin": false
  }
}
```

---

#### `POST /api/auth/verify-email`
Verify email with code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

---

#### `POST /api/auth/forgot-password`
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

#### `POST /api/auth/reset-password`
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePassword123!"
}
```

---

## Events

### Convex Queries (Client-Side)
Events are fetched via Convex real-time queries.

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Get all published events
const events = useQuery(api.events.queries.getPublishedEvents);

// Get single event by ID
const event = useQuery(api.events.queries.getEventById, { eventId });

// Get events by organizer
const myEvents = useQuery(api.events.queries.getOrganizerEvents);
```

---

## Payments

### Stripe Integration

#### `POST /api/payments/create-intent`
Create a Stripe payment intent.

**Request Body:**
```json
{
  "eventId": "event_123",
  "ticketTierId": "tier_456",
  "quantity": 2
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

---

#### `POST /api/webhooks/stripe`
Stripe webhook endpoint (server-to-server only).

**Required Headers:**
- `stripe-signature` - Webhook signature

**Handled Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `charge.dispute.created`

---

### PayPal Integration

#### `POST /api/payments/paypal/create-order`
Create a PayPal order.

**Request Body:**
```json
{
  "eventId": "event_123",
  "ticketTierId": "tier_456",
  "quantity": 2
}
```

---

#### `POST /api/payments/paypal/capture-order`
Capture a PayPal order after approval.

**Request Body:**
```json
{
  "orderId": "paypal_order_id"
}
```

---

## Tickets

### Convex Mutations

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Create order
const createOrder = useMutation(api.orders.mutations.createOrder);

// Transfer ticket
const transferTicket = useMutation(api.tickets.mutations.transferTicket);
```

---

## Organizer APIs

### Staff Management

```typescript
// Add staff member
const addStaff = useMutation(api.staff.mutations.addStaffMember);

// Update staff
const updateStaff = useMutation(api.staff.mutations.updateStaffMember);

// Remove staff
const removeStaff = useMutation(api.staff.mutations.removeStaffMember);
```

---

### Event Management

```typescript
// Create event
const createEvent = useMutation(api.events.mutations.createEvent);

// Update event
const updateEvent = useMutation(api.events.mutations.updateEvent);

// Publish event
const publishEvent = useMutation(api.events.mutations.publishEvent);

// Create ticket tier
const createTier = useMutation(api.ticketTiers.mutations.createTicketTier);
```

---

## Admin APIs

### `POST /api/admin/setup`
Initial admin setup (one-time).

### `GET /api/admin/users`
List all users (admin only).

### `POST /api/admin/users/:id/role`
Update user role (admin only).

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/auth/*` | 10 req/min |
| `/api/payments/*` | 30 req/min |
| `/api/webhooks/*` | 100 req/min |
| General APIs | 60 req/min |

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `RATE_LIMITED` | Too many requests |
| `PAYMENT_FAILED` | Payment processing error |

---

## CORS

Allowed origins:
- `https://events.stepperslife.com`
- `https://stepperslife.com`
- `http://localhost:3001` (development)

---

## Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self' ...`
