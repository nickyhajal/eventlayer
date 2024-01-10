export const load = async (req) => {
	return {
		me: req.locals.me ? req.locals.me : null,
		event: req.locals.event ? req.locals.event : null,
	}
}
