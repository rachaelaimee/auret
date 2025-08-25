# Architecture Overview

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │────│   Vercel CDN    │────│  Next.js App    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐            │
                       │  Stripe Connect │◄───────────┤
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │    Supabase     │◄───────────┤
                       │   (Postgres)    │            │
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │  Supabase Auth  │◄───────────┤
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │ Supabase Storage│◄───────────┤
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │     Pusher      │◄───────────┤
                       └─────────────────┘            │
                                                       │
                       ┌─────────────────┐            │
                       │     Resend      │◄───────────┘
                       └─────────────────┘
```

## Module Boundaries

### 1. Authentication Layer (`src/lib/auth/`)
- Supabase Auth integration
- Session management
- Role-based access control
- Server/client authentication helpers

### 2. Database Layer (`src/lib/db/`)
- Drizzle ORM schema definitions
- Database connection management
- Migration scripts
- RLS policies

### 3. API Layer (`src/app/api/`)
- RESTful endpoints
- Webhook handlers (Stripe)
- Server actions
- Middleware for auth/validation

### 4. Business Logic (`src/lib/services/`)
- User management
- Shop operations
- Product catalog
- Order processing
- Payment handling
- Forum operations

### 5. UI Components (`src/components/`)
- Reusable UI components
- Form components
- Layout components
- Feature-specific components

### 6. Types & Schemas (`src/types/`, `src/lib/validations/`)
- TypeScript type definitions
- Zod validation schemas
- API response types

## Request Flow Diagrams

### Product Purchase Flow (Digital)
```
User → Product Page → Add to Cart → Checkout → Stripe Payment
                                      │
Payment Success → Webhook → Order Created → Digital Download Token
                    │
                    └── Email Receipt → User Downloads File
```

### Seller Onboarding Flow  
```
User → Register → Create Shop → Stripe Connect Express → KYC
                                       │
                    Onboarding Complete → Can List Products
```

### Forum Interaction Flow
```
User → Forum Category → View Thread → Reply/Vote
                                        │
                          Real-time Update via Pusher → Other Users
```

## Data Flow Architecture

### 1. Authentication Flow
```
Client → Supabase Auth → JWT Token → RLS Policies → Database Access
```

### 2. Payment Flow
```
Client → Stripe Elements → Payment Intent → Webhook → Order Processing
                                             │
                          Platform Fee Calculation → Seller Payout Schedule
```

### 3. File Upload Flow
```
Client → Next.js API → Supabase Storage → Signed URL → Database Record
                                            │
                        (Digital Assets) → Watermarking → Download Tokens
```

## Security Architecture

### Row Level Security (RLS) Policies
- Users can only access their own data
- Sellers can only manage their own shops/products
- Buyers can only see their own orders
- Public read access for active products/shops
- Admin role bypass for moderation

### API Security
- CSRF protection on mutations
- Rate limiting on endpoints
- Input validation with Zod schemas
- Stripe webhook signature verification
- Idempotency keys for critical operations

### File Security
- Private storage buckets
- Signed URLs with expiration
- Download attempt tracking
- IP/device fingerprinting for piracy detection

## Performance Architecture

### Caching Strategy
- Next.js static generation for product pages
- Incremental Static Regeneration (ISR)
- Client-side caching with SWR/React Query (future)
- CDN caching via Vercel

### Database Optimization
- Indexes on commonly queried fields
- Full-text search on products/forum
- Connection pooling for serverless
- Query optimization with Drizzle

### Real-time Features
- Pusher Channels for forum live updates
- Server-Sent Events as fallback
- Optimistic UI updates
- Connection state management

## Scalability Considerations

### Database Scaling
- Read replicas for analytics (future)
- Partitioning for large tables (orders, logs)
- Archive strategy for old data

### Application Scaling
- Serverless functions auto-scale
- Edge functions for global performance
- Asset optimization and compression
- Code splitting for faster loads

### Third-party Service Limits
- Stripe Connect account limits
- Supabase free tier constraints
- Pusher connection limits
- Email service rate limits

## Error Handling & Monitoring

### Error Boundaries
- React error boundaries for UI crashes
- Global error handlers for API routes
- Webhook retry mechanisms
- User-friendly error messages

### Audit Logging
- All payment operations logged
- User permission changes tracked
- Critical business operations audited
- Compliance requirement fulfillment

### Monitoring Points
- Payment success/failure rates
- User authentication events
- Database query performance
- Real-time connection health