import { PUBLIC_MEDIA_URL } from '$env/static/public'

type ENVS = 'dev' | 'prod'
export interface IMedia {
  id: string
  path: string
  ext: string
  version: string
}

export function getMediaUrl(media: IMedia, env: ENVS = 'dev') {
  if (!media) return ''
  const path = media.path || 'submissions'
  const ext = media.ext || 'jpg'
  const version = media.version || 0
  const base =
    env === 'prod' ? PUBLIC_MEDIA_URL.replace('/dev', '') : PUBLIC_MEDIA_URL
  const { id } = media
  return `${base}/${path}/${id}-${version}.${ext}?v=${media.version}`
}
