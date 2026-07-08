import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'

import {
  ArtistPressDetailPage,
  generateArtistPressDetailMetadata,
} from '../../../artist-press/ArtistPressDetailPage'

type Args = {
  params: Promise<{
    artistPressSlug: string
    slug: string
  }>
}

export const revalidate = 600
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function CenterArtistPressDetail({ params: paramsPromise }: Args) {
  const { artistPressSlug, slug } = await paramsPromise
  const center = assertCenter(slug)
  const decodedSlug = decodeURIComponent(artistPressSlug)

  return <ArtistPressDetailPage center={center} slug={decodedSlug} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { artistPressSlug, slug } = await paramsPromise
  const center = assertCenter(slug)

  return generateArtistPressDetailMetadata(decodeURIComponent(artistPressSlug), center)
}
