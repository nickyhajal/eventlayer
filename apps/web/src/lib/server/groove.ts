interface GrooveSupportTicketInput {
	subject: string
	body: string
	inboxId?: string
	toEmail?: string
	name?: string
	email?: string
	tags?: string[]
}

interface GrooveTicketResponse {
	id?: string
	state?: string
}

const GROOVE_API_BASE = 'https://api.groovehq.com/v1'

export const createGrooveSupportTicket = async (
	apiKey: string,
	input: GrooveSupportTicketInput,
): Promise<GrooveTicketResponse> => {
	const token = apiKey.trim()
	if (!token) {
		throw new Error('Missing Groove API key')
	}

	const payload = {
		subject: input.subject,
		body: input.body,
		from: input.name ? { email: input.email, name: input.name } : input.email,
		to: input.toEmail,
		...(input.inboxId ? { mailbox: input.inboxId } : {}),
		...(input.tags?.length ? { tags: input.tags } : {}),
	}

	const rsp = await fetch(`${GROOVE_API_BASE}/tickets`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!rsp.ok) {
		const errBody = await rsp.text()
		throw new Error(`Groove ticket request failed (${rsp.status}): ${errBody.slice(0, 500)}`)
	}

	return (await rsp.json()) as GrooveTicketResponse
}
