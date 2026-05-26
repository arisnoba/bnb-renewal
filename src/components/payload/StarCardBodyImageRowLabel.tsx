'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type BodyImage = {
  imageMedia?:
    | number
    | string
    | {
        alt?: string | null
        filename?: string | null
      }
    | null
}

function getFileName(src: string) {
  const pathname = src.split('?')[0] ?? ''
  const fileName = pathname.split('/').filter(Boolean).pop()

  if (!fileName) {
    return src
  }

  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

export const StarCardBodyImageRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<BodyImage>()
  const imageMedia = data?.imageMedia
  const imageLabel =
    imageMedia && typeof imageMedia === 'object'
      ? String(imageMedia.filename || imageMedia.alt || '').trim()
      : ''
  const fallback = rowNumber !== undefined ? `이미지 ${rowNumber + 1}` : '이미지'

  return <div>{imageLabel ? getFileName(imageLabel) : fallback}</div>
}
