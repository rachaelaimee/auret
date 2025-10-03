# Auret - Creator-First Marketplace

A creator-first marketplace for handmade goods and digital craft assets. Built with Next.js, Supabase, and Stripe Connect.

## Features

- **Lower Fees**: 3.5% for physical goods, 4.5% for digital (no listing fees or forced ads)
- **Predictable Payouts**: T+2 payouts with no blanket reserves on digital goods
- **Built-in Community**: Integrated forum for sharing techniques and building trust
- **Secure Digital Delivery**: Watermarked downloads with attempt tracking
- **Stripe Connect Express**: Fast seller onboarding with KYC handled by Stripe

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Payments**: Stripe Connect Express
- **Real-time**: Pusher Channels
- **Email**: Resend
- **Deployment**: Vercel

## Quick Start

1. **Clone and Install**:

   ```bash
   git clone <your-repo>
   cd auret
   npm install
   ```

2. **Set up Environment**:

   ```bash
   cp .env.example .env.local
   # Fill in your API keys and database URLs
   ```

3. **Database Setup**:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
   ebase
4. **Start Development**:

   ```bash
   npm run dev
   ```

5. **Open**: http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
├── components/             # Reusable UI components
├── lib/
│   ├── db/                # Database schema and connection
│   ├── services/          # Business logic layer
│   └── validations/       # Zod validation schemas
└── types/                 # TypeScript type definitions
```

## Development Commands

```bash
npm run dev                # Start development server
npm run build             # Build for production
npm run type-check        # Run TypeScript compiler
npm run lint              # Run ESLint
npm run db:generate       # Generate database migrations
npm run db:migrate        # Run database migrations
npm run db:studio         # Open Drizzle Studio
```

## Documentation

- [Tech Stack Details](./TECH-STACK.md) - Architecture decisions and trade-offs
- [Architecture Overview](./ARCHITECTURE.md) - System design and data flows
- [Deployment Guide](./DEPLOY.md) - Step-by-step production deployment
- [Database Schema](./SCHEMA.sql) - Complete PostgreSQL schema
- [Development Guide](./CLAUDE.md) - Comprehensive development information

## Key Features Implementation

### Marketplace Payments

- Stripe Connect Express for seller onboarding
- Application fees (3.5% physical, 4.5% digital)
- Webhook handling for payments and payouts
- Dispute management and evidence upload

### Digital Asset Security

- Private file storage with signed URLs
- Per-order download tokens with expiration
- Watermarking for PDFs and images
- Download attempt tracking and IP logging

### Community Forum

- Real-time updates via Pusher Channels
- Voting system with accepted answers
- Moderation tools and content flagging
- Unified identity with marketplace accounts

### Row Level Security (RLS)

- Database-level access control
- Users can only access their own data
- Public read access for active content
- Admin roles for platform management

## MVP Acceptance Criteria

A seller can:

- ✅ Onboard and create a shop
- ✅ List both digital and physical products
- ✅ Receive orders and process payments
- ✅ Deliver digital downloads securely
- ✅ Ship physical products with tracking
- ✅ Receive payouts without admin intervention

A buyer can:

- ✅ Search and filter products
- ✅ Purchase items with secure checkout
- ✅ Download digital assets safely
- ✅ Leave reviews and ratings
- ✅ Participate in community forum

## License

This project is licensed under the MIT License.DEPLOYMENT_TRIGGER_1756120735
