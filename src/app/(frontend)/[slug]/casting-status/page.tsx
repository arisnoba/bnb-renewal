import type { Metadata } from 'next'

import { assertCenter, centers } from '@/lib/centers'

import { CastingStatusPage } from '../../casting-status/CastingStatusPage'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 600

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  assertCenter(slug)

  return {
    title: '캐스팅 출연현황',
  }
}

export default async function CenterCastingStatusPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const center = assertCenter(slug)

  return <CastingStatusPage center={center} />
}
