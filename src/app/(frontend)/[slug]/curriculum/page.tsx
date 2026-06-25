import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { assertCenter, centers, getCenterLabel } from '@/lib/centers'
import { getCurriculumPeriodMonths } from '@/lib/curriculumSearch'

import {
  CurriculumArchive,
  isCurriculumCenter,
  type CurriculumFilters,
} from '../../curriculum/CurriculumArchive'
import { ExamCurriculumPage } from '../../curriculum/ExamCurriculumPage'
import { KidsCurriculumPage } from '../../curriculum/KidsCurriculumPage'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<CurriculumSearchParams>
}

type CurriculumSearchParams = Partial<
  Record<keyof CurriculumFilters | 'tab', string | string[] | undefined>
>

export const revalidate = 600

export function generateStaticParams() {
  return Object.keys(centers)
    .filter(
      (slug): slug is keyof typeof centers =>
        slug === 'exam' ||
        slug === 'kids' ||
        isCurriculumCenter(slug as keyof typeof centers),
    )
    .map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center === 'kids') {
    return {
      description: '배우앤배움 키즈센터의 영재, 아역배우, 아티스트 과정별 정적 커리큘럼 안내',
      title: '커리큘럼',
    }
  }

  if (center === 'exam') {
    return {
      description: '배우앤배움 입시센터의 입시반, 예비 입시반, 예고 입시반 커리큘럼 안내',
      title: '커리큘럼',
    }
  }

  if (!isCurriculumCenter(center)) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  const periodMonths = getCurriculumPeriodMonths(center)

  return {
    description: `${getCenterLabel(center)}의 ${periodMonths}개월 단위 클래스별 커리큘럼 안내`,
    title: '커리큘럼',
  }
}

export default async function CenterCurriculumPage({
  params,
  searchParams,
}: Args) {
  const { slug } = await params
  const center = assertCenter(slug)
  const resolvedSearchParams = await searchParams

  if (center === 'kids') {
    return <KidsCurriculumPage />
  }

  if (center === 'exam') {
    return <ExamCurriculumPage tab={firstValue(resolvedSearchParams.tab)} />
  }

  if (!isCurriculumCenter(center)) {
    notFound()
  }

  return (
    <CurriculumArchive
      center={center}
      filters={normalizeFilters(resolvedSearchParams)}
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
