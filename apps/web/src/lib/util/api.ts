export const get = (path: string) => {
	return fetch(`/api/${path}`, {
		credentials: 'include',
	})
}
export const post = (path: string, body: any) => {
	return fetch(`/api/${path}`, {
		method: 'POST',
		body: JSON.stringify(body),
		credentials: 'include',
	})
}
