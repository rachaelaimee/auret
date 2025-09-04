import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderItem {
  id: string
  title: string
  quantity: number
  unitPriceCents: number
  type: 'digital' | 'physical'
  downloadUrl?: string
}

interface Order {
  id: string
  totalCents: number
  currency: string
  status: string
  createdAt: Date
  items: OrderItem[]
  customerEmail: string
  customerName?: string
  shippingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

interface Shop {
  id: string
  name: string
  handle: string
  ownerEmail: string
  ownerName?: string
}

export class EmailService {
  private formatPrice(cents: number, currency: string = 'GBP'): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100)
  }

  async sendOrderConfirmation(order: Order): Promise<void> {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Auret <orders@auret.shop>',
        to: [order.customerEmail],
        subject: `Order Confirmation #${order.id.slice(-8)} - Thank you for your purchase!`,
        html: this.generateOrderConfirmationHTML(order),
      })

      if (error) {
        console.error('Failed to send order confirmation email:', error)
        throw error
      }

      console.log('Order confirmation email sent:', data)
    } catch (error) {
      console.error('Error sending order confirmation email:', error)
      throw error
    }
  }

  async sendSellerNotification(order: Order, shop: Shop): Promise<void> {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Auret <notifications@auret.shop>',
        to: [shop.ownerEmail],
        subject: `New Order #${order.id.slice(-8)} for ${shop.name}!`,
        html: this.generateSellerNotificationHTML(order, shop),
      })

      if (error) {
        console.error('Failed to send seller notification email:', error)
        throw error
      }

      console.log('Seller notification email sent:', data)
    } catch (error) {
      console.error('Error sending seller notification email:', error)
      throw error
    }
  }

  private generateOrderConfirmationHTML(order: Order): string {
    const itemsHTML = order.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">
            ${item.title}
          </div>
          <div style="font-size: 14px; color: #64748b;">
            ${item.type === 'digital' ? '📱 Digital Product' : '📦 Physical Product'} • Qty: ${item.quantity}
          </div>
          ${item.type === 'digital' && item.downloadUrl ? `
            <div style="margin-top: 8px;">
              <a href="${item.downloadUrl}" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 6px 12px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                📥 Download
              </a>
            </div>
          ` : ''}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e293b;">
          ${this.formatPrice(item.unitPriceCents * item.quantity, order.currency)}
        </td>
      </tr>
    `).join('')

    const shippingHTML = order.shippingAddress ? `
      <div style="margin-top: 32px; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">Shipping Address</h3>
        <div style="color: #475569; font-size: 14px; line-height: 1.5;">
          <div>${order.shippingAddress.name}</div>
          <div>${order.shippingAddress.line1}</div>
          ${order.shippingAddress.line2 ? `<div>${order.shippingAddress.line2}</div>` : ''}
          <div>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postal_code}</div>
          <div>${order.shippingAddress.country}</div>
        </div>
      </div>
    ` : ''

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
          <div style="max-width: 600px; margin: 0 auto; background: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Thank you for your order!
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Order #${order.id.slice(-8)}
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Hi ${order.customerName || 'there'}! Your order has been confirmed and is being processed. 
                ${order.items.some(item => item.type === 'digital') ? 'Your digital downloads are available immediately below.' : ''}
              </p>

              <!-- Order Items -->
              <div style="margin: 24px 0;">
                <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px;">Order Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  ${itemsHTML}
                  <tr>
                    <td style="padding: 16px 0 0 0; font-weight: 700; color: #1e293b; font-size: 18px;">
                      Total
                    </td>
                    <td style="padding: 16px 0 0 0; text-align: right; font-weight: 700; color: #1e293b; font-size: 18px;">
                      ${this.formatPrice(order.totalCents, order.currency)}
                    </td>
                  </tr>
                </table>
              </div>

              ${shippingHTML}

              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">
                  Questions about your order? Reply to this email or visit our support center.
                </p>
                <a href="https://auret.shop/orders" 
                   style="display: inline-block; background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  View Order Status
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © ${new Date().getFullYear()} Auret - Creator-First Marketplace
              </p>
              <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">
                <a href="https://auret.shop" style="color: #3b82f6; text-decoration: none;">auret.shop</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateSellerNotificationHTML(order: Order, shop: Shop): string {
    const itemsHTML = order.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">
            ${item.title}
          </div>
          <div style="font-size: 14px; color: #64748b;">
            ${item.type === 'digital' ? '📱 Digital Product' : '📦 Physical Product'} • Qty: ${item.quantity}
          </div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e293b;">
          ${this.formatPrice(item.unitPriceCents * item.quantity, order.currency)}
        </td>
      </tr>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>New Order Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
          <div style="max-width: 600px; margin: 0 auto; background: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                🎉 New Order!
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Order #${order.id.slice(-8)} for ${shop.name}
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Great news, ${shop.ownerName || 'there'}! You've received a new order for your shop <strong>${shop.name}</strong>.
              </p>

              <!-- Customer Info -->
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">Customer Information</h3>
                <div style="color: #475569; font-size: 14px;">
                  <strong>Email:</strong> ${order.customerEmail}<br>
                  ${order.customerName ? `<strong>Name:</strong> ${order.customerName}<br>` : ''}
                  <strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}
                </div>
              </div>

              <!-- Order Items -->
              <div style="margin: 24px 0;">
                <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px;">Order Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  ${itemsHTML}
                  <tr>
                    <td style="padding: 16px 0 0 0; font-weight: 700; color: #10b981; font-size: 18px;">
                      Your Earnings
                    </td>
                    <td style="padding: 16px 0 0 0; text-align: right; font-weight: 700; color: #10b981; font-size: 18px;">
                      ${this.formatPrice(order.totalCents, order.currency)}
                    </td>
                  </tr>
                </table>
              </div>

              ${order.shippingAddress ? `
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 24px;">
                  <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">⚠️ Action Required: Shipping</h3>
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    This order contains physical items that need to be shipped. Please process and ship the items promptly.
                  </p>
                </div>
              ` : ''}

              <!-- Actions -->
              <div style="margin-top: 32px; text-align: center;">
                <a href="https://auret.shop/shop/${shop.handle}" 
                   style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 8px 8px 0;">
                  Manage Shop
                </a>
                <a href="https://auret.shop/dashboard" 
                   style="display: inline-block; background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 8px 8px 0;">
                  View Dashboard
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © ${new Date().getFullYear()} Auret - Creator-First Marketplace
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

export const emailService = new EmailService()
