import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import { notFound } from 'next/navigation'

import { ExamPassedReviewsPage } from '../../exam-passed-reviews/ExamPassedReviewsPage'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    page?: string
  }>
}

export const revalidate = 600

export function generateStaticParams() {
  return [{ slug: 'exam' }]
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return {
    description: '배우앤배움 입시센터 수강생 합격후기',
    title: '수강생 합격후기',
  }
}

export default async function ExamPassedReviewsRoute({ params, searchParams }: Args) {
  const { slug } = await params
  const query = searchParams ? await searchParams : {}
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return <ExamPassedReviewsPage page={parsePage(query.page)} />
}

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}
