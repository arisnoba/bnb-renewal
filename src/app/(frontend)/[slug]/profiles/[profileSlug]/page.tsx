import type { Metadata } from 'next'

import { assertCenter, centers } from '@/lib/centers'
import {
  generateProfileMetadata,
  generateProfileStaticParams,
  ProfileDetailPage,
} from '../../../profiles/ProfileDetailPage'

export const revalidate = 600
export const dynamicParams = true

type Args = {
  params: Promise<{
    profileSlug?: string
    slug?: string
  }>
}

export async function generateStaticParams(): Promise<Array<{ profileSlug: string; slug: string }>> {
  const params: Array<{ profileSlug: string; slug: string }> = []

  for (const center of Object.keys(centers) as Array<keyof typeof centers>) {
    const profileParams = await generateProfileStaticParams(center)

    params.push(...profileParams.map(({ slug }) => ({ profileSlug: slug, slug: center })))
  }

  return params
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
