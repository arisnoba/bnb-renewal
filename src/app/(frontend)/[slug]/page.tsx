import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import { MainBannerSection } from '@/Main/BannerSection'
import { CenterHomeSections } from '@/Main/CenterHomeSections'
import { centers, type CenterSlug } from '@/lib/centers'
import type { Main, MainStatistic } from '@/payload-types'

export const dynamic = 'force-dynamic'

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

  return {
    title: {
      absolute: `배우앤배움 ${title}`,
    },
    description: `${title} 메인 페이지`,
  }
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const centerSlugs = Object.keys(centers) as CenterSlug[]

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
