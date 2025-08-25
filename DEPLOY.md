# Deployment Guide

This guide walks through deploying Auret to production using Vercel and Supabase.

## Prerequisites

- Node.js 18+ installed locally
- Git repository set up
- Vercel account
- Supabase account  
- Stripe account

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Note your project URL and API keys from Settings → API

### 1.2 Set Up Database
1. In Supabase Dashboard, go to SQL Editor
2. Copy and paste the entire contents of `SCHEMA.sql`
3. Click "Run" to create all tables and policies
4. Verify tables were created in the Table Editor

### 1.3 Configure Auth
1. Go to Authentication → Settings
2. Enable email authentication
3. Add your domain to "Site URL" (will update after Vercel deployment)
4. Configure email templates (optional)

### 1.4 Set Up Storage
1. Go to Storage and create a bucket named `files`
2. Make it private (not publicly accessible)
3. Set up appropriate storage policies for secure file access

## Step 2: Stripe Connect Setup

### 2.1 Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Go to Developers → API Keys and note your keys

### 2.2 Configure Connect
1. Go to Connect → Settings
2. Enable Express accounts
3. Set up your platform profile
4. Configure webhooks (will add endpoint after deployment)

## Step 3: Third-Party Services

### 3.1 Pusher Setup
1. Create account at [pusher.com](https://pusher.com)
2. Create a new Channels app
3. Note App ID, Key, Secret, and Cluster

### 3.2 Resend Setup
1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Generate API key

## Step 4: Environment Variables

Create `.env.local` with the following variables:

```env
# App
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NODE_ENV=production

# Supabase
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Real-time
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=your-cluster
NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=your-cluster

# Security
NEXTAUTH_SECRET=generate-32-char-secret
ENCRYPTION_KEY=generate-32-char-key
```

## Step 5: Vercel Deployment

### 5.1 Connect to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login` and authenticate
3. Run `vercel` in your project directory
4. Follow prompts to create new project

### 5.2 Configure Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from your `.env.local`
3. Make sure to set appropriate environments (Production, Preview, Development)

### 5.3 Deploy
1. Push code to your Git repository
2. Vercel will automatically deploy on push to main branch
3. Note your production URL

## Step 6: Configure Webhooks

### 6.1 Stripe Webhooks
1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `payout.paid`
   - `payout.failed`
4. Copy webhook signing secret and add to environment variables

### 6.2 Update Supabase Site URL
1. Go to Supabase → Authentication → Settings
2. Update Site URL to your Vercel domain
3. Add redirect URLs for OAuth

## Step 7: Database Migrations

Run migrations on production:
```bash
# From your local machine with production DATABASE_URL
npm run db:migrate
```

## Step 8: Seed Data (Optional)

Create initial data:
```bash
# Run seed script (create this if needed)
npm run db:seed
```

## Step 9: Testing Deployment

### 9.1 Health Check
- Visit your deployed site
- Check that the homepage loads
- Verify database connection in logs

### 9.2 Payment Testing
- Use Stripe test cards to verify payment flow
- Check webhook delivery in Stripe dashboard

### 9.3 Authentication Testing
- Test user registration and login
- Verify email delivery

## Step 10: Monitoring & Analytics

### 10.1 Set Up Monitoring
1. Configure Vercel Analytics (built-in)
2. Set up error tracking (Sentry - optional)
3. Monitor Core Web Vitals

### 10.2 Performance Testing
- Test Core Web Vitals with PageSpeed Insights
- Verify LCP < 2.5s target is met
- Check mobile performance

## Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify DATABASE_URL format
- Check Supabase project region
- Ensure connection pooling is configured

**Webhook Failures**
- Check webhook URLs are correct
- Verify signing secrets match
- Review Vercel function logs

**Authentication Issues**
- Verify Site URL in Supabase
- Check redirect URLs
- Confirm API keys are correct

**File Upload Issues**
- Verify Supabase Storage bucket exists
- Check storage policies
- Confirm bucket is private

### Environment-Specific Settings

**Development**
- Use Stripe test keys
- Point to local Supabase or development project
- Enable debug logging

**Staging**
- Use separate Supabase project
- Configure staging webhooks
- Test with production-like data

**Production**
- Use live Stripe keys
- Enable all monitoring
- Configure proper error handling

## Security Checklist

- [ ] All API keys are in environment variables (not committed)
- [ ] Stripe webhooks have signature verification
- [ ] Database RLS policies are properly configured
- [ ] File storage uses signed URLs only
- [ ] HTTPS is enforced everywhere
- [ ] Rate limiting is enabled on API routes
- [ ] User input is properly validated

## Post-Deployment

1. **Test Core Flows**:
   - User registration/login
   - Product creation and purchase
   - Digital file download
   - Payment processing

2. **Set Up Alerts**:
   - Payment failures
   - Database errors
   - High response times
   - Security incidents

3. **Performance Monitoring**:
   - Core Web Vitals
   - API response times
   - Database query performance
   - Real-time connection health

4. **Backup Strategy**:
   - Regular database backups
   - File storage backups
   - Configuration backups

Your Auret marketplace is now deployed and ready for users!