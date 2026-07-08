import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { assertCenter, getCenterLabel, type CenterSlug } from '@/lib/centers'

import {
  CurriculumDetailPage,
  queryCurriculumBySlug,
  queryCurriculumStaticParams,
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
export const revalidate = 600

export async function generateStaticParams() {
  const docs = await queryCurriculumStaticParams().catch(() => [])

  return docs
    .flatMap((doc) => {
      if (!doc.centers || !isCurriculumCenter(doc.centers as CenterSlug)) {
        return []
      }

      const slug = doc.centers as CenterSlug
      const params = [
        {
          curriculumSlug: String(doc.id),
          slug,
        },
      ]

      if (slug === 'art') {
        params.push({
          curriculumSlug: String(doc.id),
          slug: 'avenue',
        })
      }

      return params
    })
}

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
  }).catch(() => null)
  const title = curriculum?.className ?? curriculum?.title

  return {
    description: title
      ? `${getCenterLabel(center)} ${title} 커리큘럼 상세 안내`
      : `${getCenterLabel(center)} 커리큘럼 상세 안내`,
    title: title || '커리큘럼',
  }
}
