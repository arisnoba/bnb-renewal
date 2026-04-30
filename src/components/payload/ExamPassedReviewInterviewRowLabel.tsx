'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type Interview = {
  question?: string | null
}

export const ExamPassedReviewInterviewRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<Interview>()
  const question = String(data?.question ?? '').trim()
  const fallback = rowNumber !== undefined ? `인터뷰 ${rowNumber + 1}` : '인터뷰'

  return <div>{question || fallback}</div>
}
