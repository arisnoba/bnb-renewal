import { getAdminImagePreviewSrc } from './adminImagePreviewSrc'

type AdminMediaPreview = {
  thumbnailURL?: unknown
  url?: unknown
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getAdminMediaPreviewSrc(media?: AdminMediaPreview | null) {
  const src = stringValue(media?.url) || stringValue(media?.thumbnailURL)

  return getAdminImagePreviewSrc(src)
}
