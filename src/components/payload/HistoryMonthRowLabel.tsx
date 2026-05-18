'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type HistoryMonth = {
  items?: unknown[] | null
  month?: number | string | null
}

function formatMonth(value: HistoryMonth['month']) {
  const month = Number(value)

  if (!Number.isFinite(month)) {
    return ''
  }

  return `${String(month).padStart(2, '0')}월`
}

export const HistoryMonthRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<HistoryMonth>()
  const month = formatMonth(data?.month)
  const itemCount = Array.isArray(data?.items) ? data.items.length : 0
  const fallback = rowNumber !== undefined ? `월별 연혁 ${rowNumber + 1}` : '월별 연혁'

  if (!month) {
    return <div>{fallback}</div>
  }

  return <div>{itemCount > 0 ? `${month} (${itemCount}개 항목)` : month}</div>
}
