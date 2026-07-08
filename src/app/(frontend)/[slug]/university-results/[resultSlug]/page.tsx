import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import { notFound } from 'next/navigation'

import {
  ExamResultDetailPage,
  generateExamResultMetadata,
  generateExamResultStaticParams,
} from '../../../exam-results/ExamResultDetailPage'

type Args = {
  params: Promise<{
    resultSlug: string
    slug: string
  }>
}

const resultType = 'university'

export const dynamicParams = true
export const revalidate = 600

export function generateStaticParams() {
  return generateExamResultStaticParams(resultType)
}

export default async function UniversityResultDetailRoute({ params }: Args) {
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
