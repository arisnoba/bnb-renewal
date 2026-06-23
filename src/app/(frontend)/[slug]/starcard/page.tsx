import type { Metadata } from 'next'

import { centers, assertCenter } from '@/lib/centers'

import { StarcardArchive } from '../../starcard/StarcardArchive'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 600

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  assertCenter(slug)

  return {
    title: '스타카드 멤버쉽서비스',
  }
}

export default async function CenterStarcardPage({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise
  const center = assertCenter(slug)

  return <StarcardArchive center={center} />
}
