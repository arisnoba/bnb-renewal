import type { Metadata } from 'next'

import { assertCenter, type CenterSlug } from '@/lib/centers'
import { notFound } from 'next/navigation'

import {
  DirectCastingDetailPage,
  generateDirectCastingMetadata,
  generateDirectCastingStaticParams,
} from '../../../direct-castings/DirectCastingDetailPage'

type Args = {
  params: Promise<{
    directCastingSlug: string
    slug: string
  }>
}

const directCastingCenters: readonly CenterSlug[] = ['art', 'avenue', 'highteen', 'kids']

export const revalidate = 600
export const dynamicParams = true

export async function generateStaticParams() {
  return generateDirectCastingStaticParams()
}

export default async function CenterDirectCastingDetail({ params: paramsPromise }: Args) {
  const { directCastingSlug, slug } = await paramsPromise
  const center = assertDirectCastingCenter(assertCenter(slug))

  return (
    <DirectCastingDetailPage
      center={center}
      slug={decodeURIComponent(directCastingSlug)}
    />
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { directCastingSlug, slug } = await paramsPromise
  const center = assertDirectCastingCenter(assertCenter(slug))

  return generateDirectCastingMetadata({
    center,
    slug: decodeURIComponent(directCastingSlug),
  })
}

function assertDirectCastingCenter(center: CenterSlug) {
  if (!directCastingCenters.includes(center)) {
    notFound()
  }

  return center
}
