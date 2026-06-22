import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import { notFound } from 'next/navigation'

import {
  ExamPassedReviewDetailPage,
  generateExamPassedReviewMetadata,
  generateExamPassedReviewStaticParams,
} from '../../../exam-passed-reviews/ExamPassedReviewDetailPage'

type Args = {
  params: Promise<{
    reviewSlug: string
    slug: string
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 600

export function generateStaticParams() {
  return generateExamPassedReviewStaticParams()
}

export default async function ExamPassedReviewDetailRoute({ params }: Args) {
  const { reviewSlug, slug } = await params
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return <ExamPassedReviewDetailPage slug={decodeURIComponent(reviewSlug)} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { reviewSlug, slug } = await params
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return generateExamPassedReviewMetadata(decodeURIComponent(reviewSlug))
}
