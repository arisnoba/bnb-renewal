'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type ProfileSummary = {
  englishName?: string | null
  name?: string | null
}

type MainBannerProfileItem = {
  profile?: ProfileSummary | number | string | null
}

function profileName(value: MainBannerProfileItem['profile']) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  return String(value.name || value.englishName || '').trim()
}

export const MainBannerProfileItemRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<MainBannerProfileItem>()
  const name = profileName(data?.profile)
  const fallback = rowNumber !== undefined ? `프로필 ${rowNumber + 1}` : '프로필'

  return <div>{name || fallback}</div>
}
