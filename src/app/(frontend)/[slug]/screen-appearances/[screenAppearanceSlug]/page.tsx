import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'

import {
  generateScreenAppearanceMetadata,
  ScreenAppearanceDetailPage,
} from '../../../screen-appearances/ScreenAppearanceDetailPage'

type Args = {
  params: Promise<{
    screenAppearanceSlug: string
    slug: string
  }>
}

export const revalidate = 600
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function CenterScreenAppearanceDetail({ params: paramsPromise }: Args) {
  const { screenAppearanceSlug, slug } = await paramsPromise
  const center = assertCenter(slug)
  const decodedSlug = decodeURIComponent(screenAppearanceSlug)

  return <ScreenAppearanceDetailPage center={center} slug={decodedSlug} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { screenAppearanceSlug, slug } = await paramsPromise
  const center = assertCenter(slug)

  return generateScreenAppearanceMetadata({
    center,
    slug: decodeURIComponent(screenAppearanceSlug),
  })
}
