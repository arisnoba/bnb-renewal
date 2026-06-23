import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import { notFound } from 'next/navigation'

import { ExamPassedVideosPage } from '../../exam-passed-videos/ExamPassedVideosPage'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    page?: string
  }>
}

export const dynamic = 'force-dynamic'
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
    description: '배우앤배움 입시센터 수강생 합격영상',
    title: '수강생 합격영상',
  }
}

export default async function ExamPassedVideosRoute({ params, searchParams }: Args) {
  const { slug } = await params
  const query = searchParams ? await searchParams : {}
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return <ExamPassedVideosPage page={parsePage(query.page)} />
}

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}
