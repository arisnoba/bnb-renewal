import type { Media } from '@/payload-types'

import { getMediaUrl } from './getMediaUrl'
import { getServerSideURL } from './getURL'

type UploadValue = number | null | Media | undefined

export function asMedia(value: UploadValue) {
  if (value && typeof value === 'object') {
    return value as Media
  }

  return undefined
}

export function metadataImageUrlFromMedia(value: UploadValue) {
  const media = asMedia(value)
  const mediaUrl = getMediaUrl(media?.url)

  return mediaUrl ? absoluteMetadataImageUrl(mediaUrl) : undefined
}

export function absoluteMetadataImageUrl(value: string) {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `${getServerSideURL()}${value.startsWith('/') ? value : `/${value}`}`
}
