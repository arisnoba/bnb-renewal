import type { Metadata } from 'next'

import { assertCenter, centers } from '@/lib/centers'

import { ScreenAppearancesArchive } from '../../screen-appearances/ScreenAppearancesArchive'

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams?: Promise<{
    page?: string
  }>
}

export const revalidate = 600

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  assertCenter(slug)

  return {
    title: 'BNB 출연장면',
  }
}

export default async function CenterScreenAppearancesPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const [{ slug = '' }, query = {}] = await Promise.all([paramsPromise, searchParamsPromise])
  const center = assertCenter(slug)

  return <ScreenAppearancesArchive center={center} page={parsePage(query.page)} />
}

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}
