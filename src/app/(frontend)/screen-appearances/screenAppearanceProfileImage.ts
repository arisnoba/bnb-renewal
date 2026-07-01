import type { Media as PayloadMedia } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export function screenAppearanceProfileImageUrl(image: PayloadMedia | null | undefined) {
  if (!image) {
    return ''
  }

  const url =
    image.url ||
    image.sizes?.thumbnail?.url ||
    image.thumbnailURL ||
    image.externalUrl ||
    (image.filename ? `/media/${image.filename}` : '')

  return getMediaUrl(url, image.updatedAt)
}
