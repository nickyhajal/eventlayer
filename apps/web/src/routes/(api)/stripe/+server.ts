import { error, json, redirect } from '@sveltejs/kit'
import { getStripeDataFromSession } from '$lib/stripe'

import { db, eq, eventTicketTable, userTable } from '@matterloop/db'

import type { RequestHandler } from './$types'

const REDIRECT_URL = 'https://neurodiversion.org'
const TICKET_ID = 'prod_T6sHMm2WwJ0Ems'
const MEDIA_ID = 'prod_T87jfY4Rq2PfyP'
// const TICKET_ID = "prod_T7D44P6gpKyggR";
// const MEDIA_ID = "prod_T87kEIyazXtUww";

const getOrCreateUser = async (email: string) => {
  let user = await db.query.userTable.findFirst({
    where: eq(userTable.email, email),
  })
  if (!user) {
    const inserted = await db
      .insert(userTable)
      .values({
        email,
      })
      .returning()
    if (inserted) {
      user = inserted[0]
    }
  }
  if (user) {
    return user
  }
}

async function addToKit(email: string, name: string) {
  const url = 'https://api.kit.com/v4/forms/8607759/subscribers'
  try {
    console.log('add to kit - media', email, name)
    await fetch(`https://api.kit.com/v4/subscribers`, {
      method: 'POST',
      body: JSON.stringify({
        email_address: email,
        first_name: name,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': `kit_84309a9eff8218e4b7aebae051c8b09c`,
      },
    })
    const rsp = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        email_address: email,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': `kit_84309a9eff8218e4b7aebae051c8b09c`,
      },
    })
    const data = await rsp.text()
  } catch (e) {
    console.error('Failed to add to Kit', e)
  }
}

export const GET: RequestHandler = async ({ url }) => {
  // Extract checkout ID from query parameters
  const checkoutId = url.searchParams.get('cid')

  if (!checkoutId) {
    throw error(400, 'Missing checkout ID parameter (cid)')
  }

  const stripe = await getStripeDataFromSession(checkoutId)

  if (stripe.line_items[0].product?.id === MEDIA_ID) {
    const user = await getOrCreateUser(stripe.customer.email as string)
    if (user?.email) {
      await addToKit(user.email, `${user.firstName} ${user.lastName}`)
      const payload = {
        id: stripe.session.id,
        type: 'media',
      }
      const data = Buffer.from(JSON.stringify(payload)).toString('base64')
      redirect(303, `${REDIRECT_URL}/youll-be-there?${data}`)
    }
  } else if (stripe.line_items[0].product?.id === TICKET_ID) {
    const payload = {
      id: stripe.session.id,
      customer: { email: stripe.customer.email, name: stripe.customer.name },
      quantity: stripe.line_items[0].quantity,
      oq: stripe.line_items[0].quantity,
      created: stripe.session.created,
    }
    const user = await getOrCreateUser(stripe.customer.email as string)
    const existingTickets = await db.query.eventTicketTable.findMany({
      where: eq(eventTicketTable.type, checkoutId),
    })
    if (!existingTickets.length) {
      await Promise.all(
        Array(payload.quantity)
          .fill(0)
          .map(async (_, i) => {
            return db
              .insert(eventTicketTable)
              .values({
                userId: user?.id,
                type: checkoutId,
                eventId: 'd7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4',
                mainId: 'd7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4',
                status: 'paid',
              })
              .returning()
          }),
      )
    } else {
      const numAssigned = existingTickets.filter((ticket) => ticket.assignedTo).length
      payload.quantity = (payload.quantity || 0) - numAssigned
    }
    const data = Buffer.from(JSON.stringify(payload)).toString('base64')
    redirect(303, `${REDIRECT_URL}/be-there?${data}`)
    return
  }

  return json(stripe)
  // console.error("Stripe checkout retrieval error:", err.message);
  // if (err instanceof Stripe.errors.StripeError) {
  //   throw error(400, `Stripe error: ${err.message}`);
  // }
  // throw error(500, "Internal server error");
}
