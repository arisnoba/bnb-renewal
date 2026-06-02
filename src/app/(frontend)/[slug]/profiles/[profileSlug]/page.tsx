import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import {
  generateProfileMetadata,
  generateProfileStaticParams,
  ProfileDetailPage,
} from '../../../profiles/ProfileDetailPage'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    profileSlug?: string
    slug?: string
  }>
}

export async function generateStaticParams(): Promise<Array<{ profileSlug: string; slug: string }>> {
  const params = await generateProfileStaticParams()

  return params.map(({ center, slug }) => ({ profileSlug: slug, slug: center }))
}

export default async function CenterProfileDetail({ params: paramsPromise }: Args) {
  const { profileSlug = '', slug = '' } = await paramsPromise
  const centerSlug = assertCenter(slug)
  const decodedSlug = decodeURIComponent(profileSlug)

  return <ProfileDetailPage center={centerSlug} slug={decodedSlug} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { profileSlug = '', slug = '' } = await paramsPromise
  const centerSlug = assertCenter(slug)
  const decodedSlug = decodeURIComponent(profileSlug)

  return generateProfileMetadata({ center: centerSlug, slug: decodedSlug })
}
