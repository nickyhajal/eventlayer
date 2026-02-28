import { env } from '$env/dynamic/private'
import Stripe from 'stripe'

const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-08-27.basil',
})

export async function getStripeDataFromSession(checkoutId: string) {
  // Retrieve checkout session from Stripe
  const session = await stripe.checkout.sessions.retrieve(checkoutId)

  // Retrieve line items (products, quantities, prices)
  const lineItems = await stripe.checkout.sessions.listLineItems(checkoutId, {
    expand: ['data.price.product'],
  })

  // Retrieve payment intent for additional payment details (if exists)
  let paymentIntent = null
  if (session.payment_intent) {
    paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
      expand: ['charges'],
    })
  }

  // Structure comprehensive response
  return {
    session: {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      currency: session.currency,
      created: session.created,
      mode: session.mode,
    },
    customer: {
      email: session.customer_details?.email,
      name: session.customer_details?.name,
      phone: session.customer_details?.phone,
      address: session.customer_details?.address,
    },
    line_items: lineItems.data.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      amount_total: item.amount_total,
      amount_subtotal: item.amount_subtotal,
      currency: item.currency,
      price: {
        id: item.price?.id,
        unit_amount: item.price?.unit_amount,
        currency: item.price?.currency,
        type: item.price?.type,
        recurring: item.price?.recurring,
      },
      product: item.price?.product
        ? {
            id: typeof item.price.product === 'string' ? item.price.product : item.price.product.id,
            name:
              typeof item.price.product === 'object' && 'name' in item.price.product
                ? item.price.product.name
                : null,
            description:
              typeof item.price.product === 'object' && 'description' in item.price.product
                ? item.price.product.description
                : null,
            images:
              typeof item.price.product === 'object' && 'images' in item.price.product
                ? item.price.product.images
                : null,
          }
        : null,
    })),
    payment: paymentIntent
      ? {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          amount_received: paymentIntent.amount_received,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          payment_method: paymentIntent.payment_method,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          charges_available: !!(paymentIntent as any).charges?.data?.length,
        }
      : null,
    totals: {
      amount_subtotal: session.amount_subtotal,
      amount_total: session.amount_total,
      amount_discount: session.total_details?.amount_discount,
      amount_shipping: session.total_details?.amount_shipping,
      amount_tax: session.total_details?.amount_tax,
      currency: session.currency,
    },
    metadata: session.metadata,
    // Include raw session data for debugging/additional fields
    raw_session: session,
  }
}
