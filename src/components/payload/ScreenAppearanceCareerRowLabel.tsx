'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type ScreenAppearanceCareerItem = {
  title?: string | null
}

export const ScreenAppearanceCareerRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<ScreenAppearanceCareerItem>()
  const title = String(data?.title ?? '').trim()
  const fallback = rowNumber !== undefined ? `필모 ${rowNumber + 1}` : '필모'

  return <div>{title || fallback}</div>
}
