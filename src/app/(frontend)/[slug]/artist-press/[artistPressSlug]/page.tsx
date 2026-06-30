import type { Metadata } from 'next'

import { centers, assertCenter } from '@/lib/centers'

import {
  ArtistPressDetailPage,
  generateArtistPressDetailMetadata,
  generateStaticParams as generateArtistPressStaticParams,
} from '../../../artist-press/[slug]/page'

type Args = {
  params: Promise<{
    artistPressSlug: string
    slug: string
  }>
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const artistPressParams = await generateArtistPressStaticParams()

  return Object.keys(centers).flatMap((slug) =>
    artistPressParams.map((params) => ({
      artistPressSlug: params.slug,
      slug,
    })),
  )
}

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
