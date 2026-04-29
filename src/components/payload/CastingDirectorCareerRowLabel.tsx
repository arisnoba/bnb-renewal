'use client'

import type { CastingDirector } from '@/payload-types'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type CareerItem = NonNullable<CastingDirector['careerItems']>[number]

export const CastingDirectorCareerRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<CareerItem>()
  const title = String(data?.title ?? '').trim()
  const fallback = rowNumber !== undefined ? `경력 ${rowNumber + 1}` : '경력'

  return <div>{title || fallback}</div>
}
