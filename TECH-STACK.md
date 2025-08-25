# Tech Stack

## Overview

Auret is built as a modern, scalable marketplace using Vercel's Next.js platform with Supabase for backend services.

## Core Technologies

### Frontend & Framework
- **Next.js 14.2** - App Router for modern React development
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** + **Radix UI** - Accessible component library
- **React Hook Form** + **Zod** - Form handling and validation

### Backend & Database
- **Supabase** - Postgres database, auth, storage, and real-time features
- **Drizzle ORM** - Type-safe database queries and migrations
- **Row Level Security (RLS)** - Database-level access control

### Payments & Marketplace
- **Stripe Connect Express** - Marketplace payments and seller onboarding
- **Stripe Elements** - Secure payment processing
- **Webhooks** - Payment event handling with idempotency

### Real-time & Communication
- **Pusher Channels** - Real-time forum updates (WebSocket alternative for Vercel)
- **Resend** - Transactional email delivery
- **Server-Sent Events (SSE)** - Fallback for real-time features

### Deployment & Hosting
- **Vercel** - Frontend hosting and serverless functions
- **Vercel Edge Runtime** - Global performance optimization
- **Environment-based deployments** - dev, staging, prod

## Why These Choices

### Vercel + Next.js
- **Pros**: Excellent DX, automatic deployments, edge optimization, serverless scaling
- **Cons**: No persistent WebSocket connections, function timeout limits
- **Trade-offs**: Use Pusher for real-time features instead of raw WebSockets

### Supabase vs Alternatives
- **Supabase**: Integrated auth, storage, real-time, generous free tier, Postgres
- **Alternative**: Neon + Clerk + UploadThing (considered but more complex setup)
- **Choice**: Supabase for integrated experience and faster MVP development

### Drizzle vs Prisma
- **Drizzle**: Better TypeScript inference, lighter runtime, SQL-first approach
- **Prisma**: More mature ecosystem, better tooling, GraphQL integration
- **Choice**: Drizzle for performance and TypeScript experience

### Stripe Connect Express vs Standard
- **Express**: Faster onboarding, Stripe handles compliance
- **Standard**: More control, custom experiences
- **Choice**: Express for MVP speed, can migrate to Standard later

## Limits & Constraints

### Vercel Limitations
- **Function timeout**: 10 seconds on hobby, 60s on pro
- **No WebSockets**: Use Pusher or SSE instead
- **Cold starts**: Edge functions have ~50ms, Node.js ~200ms cold start
- **File uploads**: 4.5MB limit via API routes, use Supabase Storage

### Supabase Limitations
- **Free tier**: 500MB storage, 2GB bandwidth, 50K monthly active users
- **Connection pooling**: Use transaction mode for serverless
- **RLS complexity**: Can impact performance with complex policies

### Performance Budgets
- **Core Web Vitals**: LCP < 2.5s, CLS < 0.1, FID < 100ms
- **JavaScript bundle**: < 200KB initial load
- **Image optimization**: Use Next.js Image component + Supabase transforms

## Development Tools

### Code Quality
- **ESLint** - Code linting
- **TypeScript strict mode** - Maximum type safety
- **Prettier** (recommended) - Code formatting

### Testing
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **@testing-library/react** - Component testing

### Monitoring (Future)
- **Sentry** - Error tracking
- **PostHog** - Analytics and feature flags
- **Vercel Analytics** - Web vitals monitoring

## Environment Variables

See `.env.example` for all required configuration variables.

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in values
2. Run `npm install` to install dependencies
3. Set up Supabase project and update environment variables
4. Run `npm run db:generate && npm run db:migrate` to set up database
5. Run `npm run dev` to start development server

## Deployment

The application is designed for deployment on Vercel with automatic preview deployments on pull requests and production deployments on main branch pushes.