'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type ScreenAppearanceCareerItem = {
  title?: string | null
}

export const ScreenAppearanceCareerRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<ScreenAppearanceCareerItem>()
  const title = String(data?.title ?? '').trim()
  const fallback = rowNumber !== undefined ? `필모그래피 ${rowNumber + 1}` : '필모그래피'

  return <div>{title || fallback}</div>
}
