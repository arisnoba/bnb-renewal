import type { Metadata } from 'next'

import { centers, assertCenter } from '@/lib/centers'

import { NewsArchive } from '../../news/NewsArchive'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    category?: string
    page?: string
  }>
}

export const revalidate = 86400

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  assertCenter(slug)

  return {
    title: '뉴스',
  }
}

export default async function CenterNewsIndex({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { slug } = await paramsPromise
  const { category, page } = await searchParamsPromise
  const center = assertCenter(slug)

  return (
    <NewsArchive
      activeCategory={category}
      center={center}
      page={parsePage(page)}
    />
  )
}

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}
