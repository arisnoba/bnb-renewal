'use client'
import type { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer['navItems']>[number]>()

  const label = data?.data?.link?.label
    ? `Nav item ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${data?.data?.link?.label}`
    : 'Row'

  return <div>{label}</div>
}

type CenterInfo = NonNullable<Footer['centerInfos']>[number]

export const CenterInfoRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<CenterInfo>()
  const centerName = String(data?.centerName ?? '').trim()
  const fallback = rowNumber !== undefined ? `센터 정보 ${rowNumber + 1}` : '센터 정보'

  return <div>{centerName || fallback}</div>
}
