import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { assertCenter, centers, getCenterLabel } from '@/lib/centers'

import {
  CurriculumArchive,
  isCurriculumCenter,
  type CurriculumFilters,
} from '../../curriculum/CurriculumArchive'
import { KidsCurriculumPage } from '../../curriculum/KidsCurriculumPage'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<CurriculumSearchParams>
}

type CurriculumSearchParams = Record<keyof CurriculumFilters, string | string[] | undefined>

export const dynamic = 'force-dynamic'
export const revalidate = 600

export function generateStaticParams() {
  return Object.keys(centers)
    .filter(
      (slug): slug is keyof typeof centers =>
        slug === 'kids' || isCurriculumCenter(slug as keyof typeof centers),
    )
    .map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center === 'kids') {
    return {
      description: '배우앤배움 키즈센터의 영재, 아역배우, 아티스트 과정별 정적 커리큘럼 안내',
      title: `커리큘럼 | ${getCenterLabel(center)}`,
    }
  }

  if (!isCurriculumCenter(center)) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  const periodMonths = center === 'highteen' ? 4 : 2

  return {
    description: `${getCenterLabel(center)}의 ${periodMonths}개월 단위 클래스별 커리큘럼 안내`,
    title: `커리큘럼 | ${getCenterLabel(center)}`,
  }
}

export default async function CenterCurriculumPage({
  params,
  searchParams,
}: Args) {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center === 'kids') {
    return <KidsCurriculumPage />
  }

  if (!isCurriculumCenter(center)) {
    notFound()
  }

  return (
    <CurriculumArchive
      center={center}
      filters={normalizeFilters(await searchParams)}
    />
  )
}

function normalizeFilters(filters: CurriculumSearchParams): CurriculumFilters {
  return {
    className: firstValue(filters.className),
    lessonCount: firstValue(filters.lessonCount),
    time: firstValue(filters.time),
  }
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
