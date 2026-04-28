import type { Metadata } from 'next'

import { centers, assertCenter, getCenterLabel } from '@/lib/centers'

import { NewsArchive } from '../../news/NewsArchive'

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
  const center = assertCenter(slug)
  const title = `${getCenterLabel(center)} 뉴스`

  return {
    title,
  }
}

export default async function CenterNewsIndex({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise
  const center = assertCenter(slug)

  return <NewsArchive center={center} title={`${getCenterLabel(center)} 뉴스`} />
}
