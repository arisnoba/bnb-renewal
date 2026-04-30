'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type CastMember = {
  actorName?: string | null
  roleName?: string | null
}

export const CastingAppearanceCastMemberRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<CastMember>()
  const actorName = String(data?.actorName ?? '').trim()
  const roleName = String(data?.roleName ?? '').trim()
  const title = [actorName, roleName].filter(Boolean).join(' / ')
  const fallback = rowNumber !== undefined ? `출연자 ${rowNumber + 1}` : '출연자'

  return <div>{title || fallback}</div>
}
