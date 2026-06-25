import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import { notFound } from 'next/navigation'

import {
  ExamResultsPage,
  getExamResultPageTitle,
} from '../../exam-results/ExamResultsPage'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    page?: string
  }>
}

const resultType = 'university'

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
    description: '배우앤배움 입시센터 대학교 합격현황',
    title: getExamResultPageTitle(resultType),
  }
}

export default async function UniversityResultsPage({ params, searchParams }: Args) {
  const { slug } = await params
  const query = searchParams ? await searchParams : {}
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return <ExamResultsPage page={parsePage(query.page)} resultType={resultType} />
}

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}
