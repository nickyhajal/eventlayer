import { PUBLIC_MEDIA_URL } from '$env/static/public'
import { Media } from '../../../db'

type ENVS = 'dev' | 'prod'

export function getMediaUrl(media: Media, transforms: string = '', env: ENVS = 'dev') {
  if (!media) return ''
  const path = media.path || 'submissions'
  const ext = media.ext || 'jpg'
  const version = media.version || 0
  const base = `${PUBLIC_MEDIA_URL}`
  const { id } = media
  const transformPath = transforms ? `/tr:${transforms}` : ''
  return `${base}${transformPath}/${media.dir}/${path}/${id}-${version}.${ext}?v=${media.version}`
}
