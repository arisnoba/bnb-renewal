import type { Metadata } from 'next'

import { assertCenter, type CenterSlug } from '@/lib/centers'
import { notFound } from 'next/navigation'

import { DirectCastingsArchive } from '../../direct-castings/DirectCastingsArchive'

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams?: Promise<{
    company?: string
    page?: string
  }>
}

const directCastingCenters: readonly CenterSlug[] = ['art', 'avenue', 'highteen', 'kids']

export const dynamic = 'force-dynamic'
export const revalidate = 600

export function generateStaticParams() {
  return directCastingCenters.map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  assertDirectCastingCenter(assertCenter(slug))

  return {
    title: '다이렉트 캐스팅',
  }
}

export default async function CenterDirectCastingsPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const [{ slug = '' }, query = {}] = await Promise.all([paramsPromise, searchParamsPromise])
  const center = assertDirectCastingCenter(assertCenter(slug))

  return (
    <DirectCastingsArchive
      center={center}
      company={query.company}
      page={parsePage(query.page)}
    />
  )
}

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}

function assertDirectCastingCenter(center: CenterSlug) {
  if (!directCastingCenters.includes(center)) {
    notFound()
  }

  return center
}
