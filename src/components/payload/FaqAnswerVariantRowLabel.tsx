'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

const centerLabels: Record<string, string> = {
  art: '아트센터',
  avenue: '애비뉴센터',
  exam: '입시센터',
  highteen: '하이틴센터',
  kids: '키즈센터',
}

type FaqAnswerVariant = {
  centerArt?: boolean | null
  centerAvenue?: boolean | null
  centerExam?: boolean | null
  centerHighteen?: boolean | null
  centerKids?: boolean | null
  questionOverride?: string | null
}

export const FaqAnswerVariantRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<FaqAnswerVariant>()
  const centers = [
    data?.centerArt ? 'art' : undefined,
    data?.centerExam ? 'exam' : undefined,
    data?.centerKids ? 'kids' : undefined,
    data?.centerHighteen ? 'highteen' : undefined,
    data?.centerAvenue ? 'avenue' : undefined,
  ].filter(Boolean) as string[]
  const centerLabel = centers
    .map((center) => centerLabels[center] ?? center)
    .filter(Boolean)
    .join(', ')
  const question = String(data?.questionOverride ?? '').trim()
  const fallback = rowNumber !== undefined ? `답변 ${rowNumber + 1}` : '답변'

  return <div>{[centerLabel, question].filter(Boolean).join(' - ') || fallback}</div>
}
