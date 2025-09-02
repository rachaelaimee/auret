# Stripe Webhook Implementation Guide

## What We've Implemented

### ✅ **Webhook Infrastructure**

- **Webhook Endpoint**: `/api/webhooks/stripe`
- **Security**: Stripe signature verification
- **Database Logging**: All webhook events stored in `webhooks` table
- **Error Handling**: Comprehensive error logging and retry logic

### ✅ **Payment Event Handlers**

- `payment_intent.succeeded` - Creates orders and processes completion
- `payment_intent.payment_failed` - Updates order status to failed
- `payment_intent.canceled` - Marks orders as canceled
- `payment_intent.requires_action` - Handles 3D Secure requirements

### ✅ **Order Processing**

- **Multi-Shop Support**: Creates separate orders per shop
- **Digital Downloads**: Automatic token generation for digital products
- **Order Items**: Proper line item creation with price snapshots
- **Address Handling**: Shipping address storage

### ✅ **Digital Product Downloads**

- **Token-Based Access**: Secure download tokens with expiration
- **Download Limits**: Configurable attempt limits per purchase
- **Access Tracking**: IP and user agent logging
- **Download API**: `/api/download/[token]` endpoint

## Configuration Required

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Stripe Webhook Secret (get from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Stripe Dashboard Configuration

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.requires_action`
5. Copy the **Signing secret** to your environment variables

### 3. Payment Intent Updates

The payment form now includes:

- User ID in metadata for order attribution
- Enhanced product information (type, variant)
- Proper error handling and user feedback

## Testing the Webhook

### Option 1: Stripe CLI (Recommended)

```bash
# Install Stripe CLI
# Forward events to local development
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test with a payment
stripe trigger payment_intent.succeeded
```

### Option 2: Test Page

Visit `/test-stripe` to test the full payment flow including webhook processing.

### Option 3: ngrok (For external testing)

```bash
# Install ngrok and expose local server
ngrok http 3000

# Use the ngrok URL in Stripe webhook configuration
# https://your-ngrok-url.ngrok.io/api/webhooks/stripe
```

## Database Schema Updates

The webhook implementation works with your existing schema:

- `orders` table for order records
- `order_items` table for line items
- `downloads` table for digital product access
- `webhooks` table for event logging

## What Happens After Payment

1. **Payment Succeeds** → Stripe sends webhook
2. **Webhook Verified** → Signature validation passes
3. **Orders Created** → Separate orders per shop
4. **Digital Downloads** → Tokens generated for digital items
5. **Notifications** → Email confirmations (TODO: implement with Resend)
6. **Seller Alerts** → Shop owners notified (TODO: implement)

## Security Features

- ✅ Webhook signature verification
- ✅ Token-based download access
- ✅ Download attempt limits
- ✅ Token expiration (30 days)
- ✅ IP and user agent tracking
- ✅ Secure metadata handling

## Next Steps

1. **Test the webhook** with Stripe CLI or test payments
2. **Configure environment variables** with your webhook secret
3. **Set up webhook endpoint** in Stripe Dashboard
4. **Implement email notifications** with Resend
5. **Add seller notifications** for new orders
6. **Test digital downloads** end-to-end

## Troubleshooting

### Common Issues:

1. **Webhook signature verification fails**

   - Check `STRIPE_WEBHOOK_SECRET` environment variable
   - Ensure you're using the correct signing secret from Stripe

2. **Orders not being created**

   - Check webhook logs in your database
   - Verify user ID is being passed in payment metadata

3. **Digital downloads not working**
   - Check that products have `type: 'digital'` in cart items
   - Verify download tokens are being created

### Debugging:

- Check server logs for webhook processing
- Query `webhooks` table for event history
- Use Stripe Dashboard webhook logs for delivery status

