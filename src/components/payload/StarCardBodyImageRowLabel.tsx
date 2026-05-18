'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type BodyImage = {
  imagePath?: string | null
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
  const imagePath = String(data?.imagePath ?? '').trim()
  const fallback = rowNumber !== undefined ? `본문 이미지 ${rowNumber + 1}` : '본문 이미지'

  return <div>{imagePath ? getFileName(imagePath) : fallback}</div>
}
