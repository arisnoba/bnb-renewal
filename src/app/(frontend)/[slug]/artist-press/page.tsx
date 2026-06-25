import type { Metadata } from 'next'

import { centers, assertCenter } from '@/lib/centers'

import { ArtistPressArchive } from '../../artist-press/ArtistPressArchive'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export const revalidate = 600

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  assertCenter(slug)

  return {
    title: '출신 아티스트',
  }
}

export default async function CenterArtistPressIndex({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { slug } = await paramsPromise
  const { page } = await searchParamsPromise
  const center = assertCenter(slug)

  return <ArtistPressArchive center={center} page={parsePage(page)} />
}

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}
