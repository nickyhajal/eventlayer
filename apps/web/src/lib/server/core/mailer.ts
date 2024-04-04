import { RESEND_KEY } from '$env/static/private'
import juice from 'juice'
import { Liquid } from 'liquidjs'
// const DOMAIN = 'reply.arena.co'
import { Resend } from 'resend'

import type { Event } from '@matterloop/db'

interface ISend {
	template?: string
	subject: string
	to: string
	more_params: any
	event: Event
	opts?: any
}

const resend = new Resend(RESEND_KEY)

export const mailer = {
	async send({ template = 'default', event, subject, to, more_params, opts = {} }: ISend) {
		if (more_params == null) {
			more_params = []
		}
		if (opts == null) {
			opts = false
		}
		const NODE_ENV = process.env.NODE_ENV || ''
		to = ['staging', 'production'].includes(NODE_ENV) ? to : 'nhajal@gmail.com'
		const from = opts.from != null ? opts.from : 'support@email.eventlayer.co'
		const from_name =
			opts.from_name != null ? opts.from_name : event?.emailFromName || 'Event Support'
		const merge: any = {}
		for (let i in more_params) {
			const p = more_params[i]
			merge[i] = p
		}
		const layout = `<style type="text/css">
    .body {
      max-width: 768px;
    }
    </style>
    
    <div class="body">
      <div class="paper">
        {{ body }}
      </div>
    </div>`
		const liquify = new Liquid()
		const layoutTpl = liquify.parse(layout)
		const htmlRaw = await liquify.render(layoutTpl, merge)
		const html = juice(htmlRaw)
		const req = {
			from: `${from_name} <${from}>`,
			subject: `${subject}`,
			reply_to: event?.replyEmail || 'nhajal@gmail.com',
			to,
			html,
		}
		if (process.env.NODE_ENV === 'test') {
			console.log('SEND EMAIL: ', req)
		} else {
			try {
				return resend.emails.send(req)
			} catch (e) {
				console.error('mail', e)
			}
		}
	},
}
