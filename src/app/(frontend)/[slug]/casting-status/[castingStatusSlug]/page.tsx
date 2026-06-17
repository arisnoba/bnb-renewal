import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'

import {
  CastingStatusDetailPage,
  generateCastingStatusMetadata,
  generateCastingStatusStaticParams,
} from '../../../casting-status/CastingStatusDetailPage'

type Args = {
  params: Promise<{
    castingStatusSlug: string
    slug: string
  }>
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return generateCastingStatusStaticParams()
}

export default async function CenterCastingStatusDetail({ params: paramsPromise }: Args) {
  const { castingStatusSlug, slug } = await paramsPromise
  const center = assertCenter(slug)
  const decodedSlug = decodeURIComponent(castingStatusSlug)

  return <CastingStatusDetailPage center={center} slug={decodedSlug} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { castingStatusSlug, slug } = await paramsPromise
  const center = assertCenter(slug)

  return generateCastingStatusMetadata({
    center,
    slug: decodeURIComponent(castingStatusSlug),
  })
}
