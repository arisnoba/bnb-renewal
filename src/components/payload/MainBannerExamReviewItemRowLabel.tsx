'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type ExamReviewSummary = {
  studentName?: string | null
  title?: string | null
}

type MainBannerExamReviewItem = {
  resultLabel?: string | null
  review?: ExamReviewSummary | number | string | null
}

function reviewName(value: MainBannerExamReviewItem['review']) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  return String(value.studentName || value.title || '').trim()
}

export const MainBannerExamReviewItemRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<MainBannerExamReviewItem>()
  const name = reviewName(data?.review)
  const resultLabel = String(data?.resultLabel ?? '').trim()
  const title = [name, resultLabel].filter(Boolean).join(' | ')
  const fallback = rowNumber !== undefined ? `합격후기 ${rowNumber + 1}` : '합격후기'

  return <div>{title || fallback}</div>
}
