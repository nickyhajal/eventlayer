import { fail } from '@sveltejs/kit'
import { z } from 'zod'
import { EventFns } from '@matterloop/api'

import { createGrooveSupportTicket } from '$lib/server/groove'

import type { Actions } from './$types'

interface HelpRouteEventContext {
	event?: {
		id?: string
		name?: string | null
		settings?: unknown
	}
	me?: {
		id?: string
		email?: string | null
		firstName?: string | null
		lastName?: string | null
	}
}

interface GrooveSettingsResult {
	apiKey: string
	inboxId?: string
	supportEmail?: string
	contentSupportEmail?: string
}

const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')

const supportRequestSchema = z.object({
	ticketType: z.string().min(1, 'Ticket type is required'),
	subject: z.string().trim().min(3, 'Subject must be at least 3 characters'),
	description: z.string().trim().min(10, 'Description must be at least 10 characters'),
	deviceName: z.string().optional(),
	devicePlatform: z.string().optional(),
	deviceLanguage: z.string().optional(),
	deviceViewport: z.string().optional(),
	pageUrl: z.string().optional(),
})

const getGrooveSettings = (settings: unknown) => {
	const safeSettings = (settings ?? {}) as Record<string, unknown>
	return {
		apiKey:
			typeof safeSettings.groove_api_key === 'string' ? safeSettings.groove_api_key.trim() : '',
		inboxId:
			typeof safeSettings.groove_inbox_id === 'string'
				? safeSettings.groove_inbox_id.trim()
				: undefined,
		supportEmail:
			typeof safeSettings.support_email === 'string' ? safeSettings.support_email.trim() : undefined,
	}
}

const getFreshGrooveSettings = async (eventId?: string, fallbackSettings?: unknown) => {
	if (!eventId) {
		return {
			...getGrooveSettings(fallbackSettings),
			contentSupportEmail: undefined,
		} as GrooveSettingsResult
	}
	const event = (await EventFns({ eventId }).get()) as
		| {
				settings?: unknown
				contentByKey?: Record<string, { value?: unknown }>
		  }
		| null
	const supportEmailValue = event?.contentByKey?.['support-email']?.value
	const contentSupportEmail =
		typeof supportEmailValue === 'string'
			? supportEmailValue.trim()
			: undefined
	return {
		...getGrooveSettings(event?.settings ?? fallbackSettings),
		contentSupportEmail,
	} as GrooveSettingsResult
}

export const load = async ({ locals }) => {
	const ctx = locals as HelpRouteEventContext
	const { apiKey } = await getFreshGrooveSettings(ctx.event?.id, ctx.event?.settings)
	return {
		canGetHelp: Boolean(apiKey),
	}
}

export const actions: Actions = {
	default: async ({ request, locals, url, getClientAddress }) => {
		const ctx = locals as HelpRouteEventContext
		const { apiKey, inboxId, supportEmail, contentSupportEmail } = await getFreshGrooveSettings(
			ctx.event?.id,
			ctx.event?.settings,
		)
		if (!apiKey) {
			return fail(400, {
				success: false,
				message: 'Support is not configured for this event.',
			})
		}

		const formData = await request.formData()
		const parsed = supportRequestSchema.safeParse({
			ticketType: formData.get('ticketType'),
			subject: formData.get('subject'),
			description: formData.get('description'),
			deviceName: formData.get('deviceName'),
			devicePlatform: formData.get('devicePlatform'),
			deviceLanguage: formData.get('deviceLanguage'),
			deviceViewport: formData.get('deviceViewport'),
			pageUrl: formData.get('pageUrl'),
		})

		if (!parsed.success) {
			return fail(400, {
				success: false,
				message: parsed.error.issues[0]?.message ?? 'Invalid support request',
				values: Object.fromEntries(formData.entries()),
			})
		}

		const { ticketType, subject, description, ...deviceFields } = parsed.data
		const me = ctx.me
		const userAgent = request.headers.get('user-agent') ?? ''
		const referer = request.headers.get('referer') ?? ''
		const ipAddress = getClientAddress()
		const senderEmail = me?.email?.trim() ?? ''
		const recipientEmail = supportEmail ?? contentSupportEmail ?? ''
		const userFullName =
			`${me?.firstName ?? ''} ${me?.lastName ?? ''}`.trim() || 'Unknown User'

		if (!senderEmail) {
			return fail(400, {
				success: false,
				message: 'Your account is missing an email address. Please update your profile first.',
				values: Object.fromEntries(formData.entries()),
			})
		}
		const destinationEmail = recipientEmail || senderEmail

		const details = `
<h3>Support Request</h3>
<p><strong>Type:</strong> ${escapeHtml(ticketType)}</p>
<p><strong>Question:</strong> ${escapeHtml(subject)}</p>

<h4>User</h4>
<ul>
  <li><strong>Name:</strong> ${escapeHtml(userFullName)}</li>
  <li><strong>Email:</strong> ${escapeHtml(senderEmail)}</li>
  <li><strong>User ID:</strong> ${escapeHtml(me?.id ?? 'anonymous')}</li>
</ul>

<h4>Request Context</h4>
<ul>
  <li><strong>Current URL:</strong> ${escapeHtml(deviceFields.pageUrl ?? url.toString())}</li>
  <li><strong>Referer:</strong> ${escapeHtml(referer ?? 'n/a')}</li>
  <li><strong>IP:</strong> ${escapeHtml(ipAddress ?? 'n/a')}</li>
</ul>

<h4>Device</h4>
<ul>
  <li><strong>Name:</strong> ${escapeHtml(deviceFields.deviceName ?? 'n/a')}</li>
  <li><strong>Platform:</strong> ${escapeHtml(deviceFields.devicePlatform ?? 'n/a')}</li>
  <li><strong>Language:</strong> ${escapeHtml(deviceFields.deviceLanguage ?? 'n/a')}</li>
  <li><strong>Viewport:</strong> ${escapeHtml(deviceFields.deviceViewport ?? 'n/a')}</li>
  <li><strong>User-Agent:</strong> ${escapeHtml(userAgent ?? 'n/a')}</li>
</ul>

<h4>Message</h4>
<p>${escapeHtml(description).replaceAll('\n', '<br/>')}</p>
`.trim()

		try {
			await createGrooveSupportTicket(apiKey, {
				inboxId,
				subject,
				body: details,
				name: userFullName,
				email: senderEmail,
				toEmail: destinationEmail,
				tags: ['eventlayer', 'support', ticketType.toLowerCase().replace(/\s+/g, '-')],
			})

			return {
				success: true,
				message: 'Support request sent. We will follow up soon.',
			}
		} catch (error) {
			console.error('Failed to submit Groove support request', error)
			return fail(502, {
				success: false,
				message: 'Failed to send support request. Please try again.',
				values: Object.fromEntries(formData.entries()),
			})
		}
	},
}
