import { PUBLIC_MEDIA_URL } from '$env/static/public'

type ENVS = 'dev' | 'prod'

export function getMediaUrl(media: Media, params: string = '', env: ENVS = 'dev') {
	if (!media) return ''
	const path = media.path || 'submissions'
	const ext = media.ext || 'jpg'
	const version = media.version || 0
	const base = `${PUBLIC_MEDIA_URL}/${media.dir}`
	const { id } = media
	return `${base}/${path}/${id}-${version}.${ext}?v=${media.version}&${params}`
}
