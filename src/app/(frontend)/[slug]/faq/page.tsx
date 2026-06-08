import type { Metadata } from 'next'

import { centers, assertCenter, getCenterLabel } from '@/lib/centers'

import { FaqArchive } from '../../faq/FaqArchive'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    category?: string
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

  return {
    title: `${getCenterLabel(center)} 자주하는 질문`,
  }
}

export default async function CenterFaqPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { slug } = await paramsPromise
  const { category } = await searchParamsPromise
  const center = assertCenter(slug)

  return <FaqArchive activeCategory={category} center={center} />
}
