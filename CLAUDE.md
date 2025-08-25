# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auret is a creator-first marketplace for handmade goods and digital craft assets. Built with Next.js, Supabase, Stripe Connect, and deployed on Vercel.

## Development Commands

### Setup & Installation
```bash
npm install                    # Install dependencies
cp .env.example .env.local    # Copy environment variables
```

### Database Management
```bash
npm run db:generate           # Generate Drizzle migrations from schema changes
npm run db:migrate           # Run pending migrations
npm run db:studio            # Open Drizzle Studio (database GUI)
```

### Development
```bash
npm run dev                  # Start development server (localhost:3000)
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # Run ESLint
npm run type-check          # Run TypeScript compiler check
```

### Testing
```bash
npm run test                # Run unit tests with Vitest
npm run test:e2e           # Run E2E tests with Playwright
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage)
- **ORM**: Drizzle with Row Level Security (RLS)
- **Payments**: Stripe Connect Express for marketplace
- **Real-time**: Pusher Channels (forum updates)
- **Email**: Resend for transactional emails
- **Deployment**: Vercel

### Core Business Logic

#### Marketplace Fees
- Digital goods: 4.5% platform fee
- Physical goods: 3.5% platform fee
- No listing fees, no forced ads
- Calculated in `src/lib/utils.ts:calculatePlatformFee()`

#### User Roles & Permissions
- **Buyer**: Can purchase, review, participate in forum
- **Seller**: Can create shops, list products, manage orders
- **Admin**: Full access for moderation and platform management

#### Product Types
- **Digital**: Files with secure download tokens, watermarking
- **Physical**: Inventory management, shipping tracking

### Key Database Tables

#### Users & Auth
- `users` - User accounts and roles
- `profiles` - Extended user profile information

#### Marketplace
- `shops` - Seller storefronts with Stripe Connect integration
- `products` - Product catalog with variants and digital assets
- `orders` - Purchase transactions with status tracking
- `order_items` - Individual items within orders

#### Community
- `forum_categories` - Forum organization
- `forum_threads` - Discussion topics
- `forum_posts` - Thread replies with voting

### Security Implementation

#### Row Level Security (RLS)
- Users can only access their own data
- Shop owners manage their products/orders
- Public read access for active content
- Admin bypass for moderation
- Defined in `SCHEMA.sql` with comprehensive policies

#### Payment Security
- Stripe webhooks with signature verification
- Idempotency keys for critical operations
- Secure file downloads with signed URLs
- Download attempt tracking and limits

### File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes and webhooks
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # Seller dashboard
│   ├── forum/            # Community forum
│   └── shop/[handle]/    # Individual shop pages
├── components/           # Reusable UI components
├── lib/
│   ├── db/              # Database schema and connection
│   ├── services/        # Business logic layer
│   └── validations/     # Zod schemas
└── types/               # TypeScript type definitions
```

### Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - Supabase Postgres connection
- `SUPABASE_*` - Supabase project credentials
- `STRIPE_*` - Stripe API keys and webhooks
- `RESEND_API_KEY` - Email service
- `PUSHER_*` - Real-time messaging
- `NEXTAUTH_SECRET` - Auth encryption key

### Development Workflow

1. **Database Changes**: Update `src/lib/db/schema.ts` → `npm run db:generate` → `npm run db:migrate`
2. **API Routes**: Follow RESTful patterns in `src/app/api/`
3. **Components**: Use shadcn/ui + Tailwind for consistent styling
4. **Validation**: Define Zod schemas in `src/lib/validations/`
5. **Types**: Keep TypeScript strict mode enabled

### Testing Strategy
- Unit tests for business logic (`*.test.ts`)
- Integration tests for API endpoints
- E2E tests for critical user flows (purchase, onboarding)

### Stripe Connect Integration
- Express accounts for fast seller onboarding
- Application fee collection (3.5%/4.5%)
- Webhook handling for payments and payouts
- KYC status tracking in shops table

### Digital Asset Delivery
- Files stored in Supabase Storage (private buckets)
- Download tokens with expiration and attempt limits
- Per-order watermarking for PDFs/images
- IP and device tracking for abuse prevention

### Forum Implementation
- Built into same Next.js app (no separate server)
- Real-time updates via Pusher Channels
- Voting system with accepted answers
- Moderation tools and content flagging

### Performance Considerations
- Next.js static generation for product pages
- Database indexes on search and filter fields
- Image optimization via Next.js Image component
- Core Web Vitals monitoring (LCP < 2.5s target)

### Common Patterns

#### Error Handling
- Use `ApiResponse<T>` type for consistent API responses
- Implement proper HTTP status codes
- User-friendly error messages in UI

#### Authentication Checks
```typescript
// Server component
const user = await getCurrentUser();
if (!user) redirect('/auth/signin');

// API route
const user = await verifyAuth(request);
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

#### Database Queries
```typescript
// Use Drizzle ORM with proper typing
const products = await db.select().from(products).where(eq(products.shopId, shopId));
```

#### Form Validation
```typescript
// Use Zod + React Hook Form
const form = useForm<FormData>({
  resolver: zodResolver(validationSchema)
});
```