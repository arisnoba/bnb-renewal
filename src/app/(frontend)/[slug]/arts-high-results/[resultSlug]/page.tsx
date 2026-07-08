import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import { notFound } from 'next/navigation'

import {
  ExamResultDetailPage,
  generateExamResultMetadata,
} from '../../../exam-results/ExamResultDetailPage'

type Args = {
  params: Promise<{
    resultSlug: string
    slug: string
  }>
}

const resultType = 'arts_high_school'

export const dynamicParams = true
export const revalidate = 600
export const dynamic = 'force-dynamic'

export default async function ArtsHighResultDetailRoute({ params }: Args) {
  const { resultSlug, slug } = await params
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return (
    <ExamResultDetailPage
      resultType={resultType}
      slug={decodeURIComponent(resultSlug)}
    />
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { resultSlug, slug } = await params
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return generateExamResultMetadata({
    resultType,
    slug: decodeURIComponent(resultSlug),
  })
}
