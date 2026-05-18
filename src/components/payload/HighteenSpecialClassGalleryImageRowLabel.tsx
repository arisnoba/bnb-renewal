'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type GalleryImage = {
  sourceFile?: string | null
}

export const HighteenSpecialClassGalleryImageRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<GalleryImage>()
  const sourceFile = String(data?.sourceFile ?? '').trim()
  const fallback = rowNumber !== undefined ? `이미지 ${rowNumber + 1}` : '이미지'

  return <div>{sourceFile || fallback}</div>
}
