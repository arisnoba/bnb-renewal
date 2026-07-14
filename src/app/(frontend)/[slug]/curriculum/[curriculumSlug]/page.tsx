import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { assertCenter, getCenterLabel } from '@/lib/centers'

import {
  CurriculumDetailPage,
  queryCurriculumBySlug,
} from '../../../curriculum/CurriculumDetailPage'
import {
  curriculumContentCenter,
  isCurriculumCenter,
} from '../../../curriculum/CurriculumArchive'

type Args = {
  params: Promise<{
    curriculumSlug: string
    slug: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function CenterCurriculumDetailPage({ params }: Args) {
  const { curriculumSlug, slug } = await params
  const center = assertCenter(slug)

  if (!isCurriculumCenter(center)) {
    notFound()
  }

  return (
    <CurriculumDetailPage
      center={center}
      contentCenter={curriculumContentCenter(center)}
      curriculumSlug={decodeURIComponent(curriculumSlug)}
    />
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { curriculumSlug, slug } = await params
  const center = assertCenter(slug)

  if (!isCurriculumCenter(center)) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  const curriculum = await queryCurriculumBySlug({
    center: curriculumContentCenter(center),
    slug: decodeURIComponent(curriculumSlug),
  })
  const title = curriculum?.className ?? curriculum?.title

  return {
    description: title
      ? `${getCenterLabel(center)} ${title} 커리큘럼 상세 안내`
      : `${getCenterLabel(center)} 커리큘럼 상세 안내`,
    title: title || '커리큘럼',
  }
}
