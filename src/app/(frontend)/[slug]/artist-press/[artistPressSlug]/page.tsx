import type { Metadata } from 'next'

import { centers, assertCenter } from '@/lib/centers'

import {
  ArtistPressDetailPage,
  generateArtistPressDetailMetadata,
  generateArtistPressStaticParams,
} from '../../../artist-press/[slug]/page'

type Args = {
  params: Promise<{
    artistPressSlug: string
    slug: string
  }>
}

export const revalidate = 600
export const dynamicParams = true

export async function generateStaticParams() {
  const params: Array<{ artistPressSlug: string; slug: string }> = []

  for (const slug of Object.keys(centers) as Array<keyof typeof centers>) {
    const artistPressParams = await generateArtistPressStaticParams(slug)

    params.push(
      ...artistPressParams.map((artistPressParam) => ({
        artistPressSlug: artistPressParam.slug,
        slug,
      })),
    )
  }

  return params
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
