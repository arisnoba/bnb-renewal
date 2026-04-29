'use client'

import type { Teacher } from '@/payload-types'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type FilmographyItem = NonNullable<Teacher['careerItems']>[number]

export const TeacherFilmographyRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<FilmographyItem>()
  const title = String(data?.title ?? '').trim()
  const fallback = rowNumber !== undefined ? `필모그래피 ${rowNumber + 1}` : '필모그래피'

  return <div>{title || fallback}</div>
}
