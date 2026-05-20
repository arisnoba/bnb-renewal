'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type AgencyAlias = {
  originalName?: string | null
}

export const ArtistPressAgencyAliasRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<AgencyAlias>()
  const originalName = String(data?.originalName ?? '').trim()
  const fallback = rowNumber !== undefined ? `레거시 파일명 ${rowNumber + 1}` : '레거시 파일명'

  return <div>{originalName || fallback}</div>
}
