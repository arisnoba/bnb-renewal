'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type AgencyActor = {
  name?: string | null
}

export const AgencyActorRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<AgencyActor>()
  const name = String(data?.name ?? '').trim()
  const fallback = rowNumber !== undefined ? `출신 배우 ${rowNumber + 1}` : '출신 배우'

  return <div>{name || fallback}</div>
}
