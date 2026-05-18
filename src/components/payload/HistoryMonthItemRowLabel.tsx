'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type HistoryMonthItem = {
  title?: string | null
}

export const HistoryMonthItemRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<HistoryMonthItem>()
  const title = String(data?.title ?? '').trim()
  const fallback = rowNumber !== undefined ? `항목 ${rowNumber + 1}` : '항목'

  return <div>{title || fallback}</div>
}
