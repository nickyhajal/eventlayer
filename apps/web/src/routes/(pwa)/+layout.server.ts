export const load = async (req) => {
	console.log(req.locals)
	return {
		me: req.locals.me ? req.locals.me : null,
		event: req.locals.event ? req.locals.event : null,
	}
}
