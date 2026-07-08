import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import {
  generateProfileMetadata,
  ProfileDetailPage,
} from '../../../profiles/ProfileDetailPage'

export const revalidate = 600
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Args = {
  params: Promise<{
    profileSlug?: string
    slug?: string
  }>
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
