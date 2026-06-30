import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { assertCenter, type CenterSlug } from '@/lib/centers'

import { castingStatusCenters } from '../../casting-status/CastingStatus.data'
import { CastingStatusPage } from '../../casting-status/CastingStatusPage'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export const revalidate = 600

export function generateStaticParams() {
  return castingStatusCenters.map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  assertCastingStatusCenter(assertCenter(slug))

  return {
    title: '캐스팅 출연현황',
  }
}

export default async function CenterCastingStatusPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const center = assertCastingStatusCenter(assertCenter(slug))

  return <CastingStatusPage center={center} />
}

function assertCastingStatusCenter(center: CenterSlug) {
  if (!castingStatusCenters.includes(center)) {
    notFound()
  }

  return center
}
