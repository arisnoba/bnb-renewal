'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type MainBannerOrder = {
  banner?: unknown
}

function bannerTitle(value: unknown) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  return String((value as { title?: unknown }).title ?? '').trim()
}

export const MainBannerOrderRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<MainBannerOrder>()
  const title = bannerTitle(data?.banner)
  const fallback = rowNumber !== undefined ? `배너 ${rowNumber + 1}` : '배너'

  if (title) {
    return <div>{title}</div>
  }

  return <div>{fallback}</div>
}
