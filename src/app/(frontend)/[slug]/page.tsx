import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'
import { centerStaticPage, homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { MainBannerSection } from '@/Main/BannerSection'
import { SocialLinksSection } from '@/Main/SocialLinksSection'
import type { CenterSlug } from '@/lib/centers'
import type { Main } from '@/payload-types'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const pages = await payload.find({
      collection: 'pages',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
    })

    return pages.docs
      ?.filter((doc) => {
        return doc.slug !== 'home'
      })
      .map(({ slug }) => {
        return { slug }
      })
  } catch {
    return []
  }
}

function fallbackMetadata(): Metadata {
  return {
    title: 'BNB Renewal',
    description: 'BNB Renewal 웹사이트 템플릿',
  }
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  try {
    const { slug = 'home' } = await paramsPromise
    const decodedSlug = decodeURIComponent(slug)
    const page = await queryPageBySlug({
      slug: decodedSlug,
    })

    return generateMeta({ doc: page })
  } catch {
    return fallbackMetadata()
  }
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const centerSlugs = ['art', 'exam', 'kids', 'highteen', 'avenue'] as const

function centerFromSlug(slug: string): CenterSlug | null {
  return centerSlugs.includes(slug as CenterSlug) ? (slug as CenterSlug) : null
}

function centerContentAnchor(center: CenterSlug) {
  return center === 'exam' ? 'exam-passed-reviews' : 'profiles'
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  try {
    page = await queryPageBySlug({
      slug: decodedSlug,
    })
  } catch {
    page = null
  }

  // Remove this code once your website is seeded
  if (!page && slug === 'home') {
    page = homeStatic
  }

  const center = centerFromSlug(decodedSlug)

  if (!page && center) {
    page = centerStaticPage(center)
  }

  if (!page) {
    notFound()
  }

  const { hero, layout } = page
  const main = center ? await queryMainGlobal() : null

  return (
    <article className="pt-16 pb-24">
      <PageClient />

      {draft && <LivePreviewListener />}

      {center && <MainBannerSection center={center} main={main} />}
      <RenderHero {...hero} />
      {center && (
        <div aria-hidden="true" className="scroll-mt-24" id={centerContentAnchor(center)} />
      )}
      <RenderBlocks blocks={layout} />
      {center && <SocialLinksSection center={center} />}
    </article>
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

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
