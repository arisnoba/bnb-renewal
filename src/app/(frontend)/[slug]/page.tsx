import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import { MainBannerSection } from '@/Main/BannerSection'
import { CenterHomeSections } from '@/Main/CenterHomeSections'
import { centers, type CenterSlug } from '@/lib/centers'
import type { Main, MainStatistic } from '@/payload-types'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export const revalidate = 600

export async function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

function fallbackMetadata(): Metadata {
  return {
    title: '페이지를 찾을 수 없습니다',
    description: 'BNB Renewal 웹사이트 템플릿',
  }
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const center = centerFromSlug(decodeURIComponent(slug))

  if (!center) {
    return fallbackMetadata()
  }

  const title = centers[center]
  const absoluteTitle = `배우앤배움 ${title}`
  const description = centerMainDescriptions[center]

  return {
    title: {
      absolute: absoluteTitle,
    },
    description,
    openGraph: mergeOpenGraph(
      {
        description,
        title: absoluteTitle,
        url: `/${center}`,
      },
      { center },
    ),
    twitter: {
      card: 'summary_large_image',
      description,
      title: absoluteTitle,
    },
  }
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const centerSlugs = Object.keys(centers) as CenterSlug[]

const centerMainDescriptions: Record<CenterSlug, string> = {
  art: '서울 강남권 매체연기 전문 교육기관. 배우앤배움 아트센터는 연기 트레이닝, 오디션, 드라마 캐스팅, 배우관리 시스템으로 실전 경쟁력을 키웁니다.',
  avenue:
    '서울 강남권 전문 연기 트레이닝 센터. 배우앤배움 애비뉴센터는 개인별 컨설팅, 이미지 메이킹, 프로필, 캐스팅 연계로 고유한 배우 색깔을 완성합니다.',
  exam:
    '서울 강남권 연극영화과 입시연기 전문 센터. 배우앤배움 입시센터는 소수정예 1:1 관리와 대학별 커리큘럼으로 수시, 정시 실기를 준비합니다.',
  highteen:
    '서울 강남권 청소년 방송연기, 매체연기 전문 센터. 배우앤배움 하이틴센터는 이미지 메이킹, 기획사 오디션, 드라마 캐스팅과 배우관리를 지원합니다.',
  kids:
    '서울 강남, 논현 아역 연기트레이닝 전문 센터. 배우앤배움 키즈센터는 대본 접근, 표현력 교육, 드라마, 영화, 광고모델 캐스팅을 지원합니다.',
}

function centerFromSlug(slug: string): CenterSlug | null {
  return centerSlugs.includes(slug as CenterSlug) ? (slug as CenterSlug) : null
}

function centerContentAnchor(center: CenterSlug) {
  return center === 'exam' ? 'exam-passed-reviews' : 'profiles'
}

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const center = centerFromSlug(decodedSlug)

  if (!center) {
    notFound()
  }

  const main = await queryMainGlobal()
  const statistics = await queryMainStatisticsGlobal()

  return (
    <main className="page page-dark page-landing page-landing--center" data-center={center}>
      <MainBannerSection center={center} main={main} statistics={statistics} />
      <div aria-hidden="true" className="scroll-mt-24" id={centerContentAnchor(center)} />
      <CenterHomeSections center={center} />
    </main>
  )
}

const queryMainGlobal = cache(async () => {
  try {
    const payload = await getPayload({ config: configPromise })

    return (await payload.findGlobal({
      slug: 'main',
      depth: 3,
    })) as Main
  } catch {
    return null
  }
})

const queryMainStatisticsGlobal = cache(async () => {
  try {
    const payload = await getPayload({ config: configPromise })

    return (await payload.findGlobal({
      slug: 'main-statistics',
      depth: 1,
    })) as MainStatistic
  } catch {
    return null
  }
})
