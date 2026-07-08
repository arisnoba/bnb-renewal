import type { Metadata } from 'next'

import {
  ArtistPressDetailPage,
  generateArtistPressDetailMetadata,
} from '../ArtistPressDetailPage'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export const revalidate = 600
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function ArtistPressDetail({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)

  return <ArtistPressDetailPage slug={decodedSlug} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)

  return generateArtistPressDetailMetadata(decodedSlug)
}
