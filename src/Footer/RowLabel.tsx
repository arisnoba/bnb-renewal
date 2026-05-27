'use client'
import type { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type CenterInfo = NonNullable<Footer['centerInfos']>[number]

export const CenterInfoRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<CenterInfo>()
  const centerName = String(data?.centerName ?? '').trim()
  const fallback = rowNumber !== undefined ? `센터 정보 ${rowNumber + 1}` : '센터 정보'

  return <div>{centerName || fallback}</div>
}
