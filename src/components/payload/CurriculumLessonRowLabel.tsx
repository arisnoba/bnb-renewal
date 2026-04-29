'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type CurriculumLesson = {
  topic?: string | null
}

export const CurriculumLessonRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<CurriculumLesson>()
  const topic = String(data?.topic ?? '').trim()
  const weekLabel = rowNumber !== undefined ? `${rowNumber + 1}주차` : '주차'

  return <div>{topic ? `${weekLabel} ${topic}` : weekLabel}</div>
}
