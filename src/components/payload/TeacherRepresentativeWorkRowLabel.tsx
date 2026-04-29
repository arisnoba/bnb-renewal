'use client'

import type { Teacher } from '@/payload-types'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type RepresentativeWork = NonNullable<Teacher['representativeWorks']>[number]

export const TeacherRepresentativeWorkRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<RepresentativeWork>()
  const title = String(data?.title ?? '').trim()
  const fallback = rowNumber !== undefined ? `대표작 ${rowNumber + 1}` : '대표작'

  return <div>{title || fallback}</div>
}
