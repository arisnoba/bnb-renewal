'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const ScreenAppearanceBodyImageRowLabel: React.FC<RowLabelProps> = () => {
  const { rowNumber } = useRowLabel()
  const fallback = rowNumber !== undefined ? `본문 이미지 ${rowNumber + 1}` : '본문 이미지'

  return <div>{fallback}</div>
}
