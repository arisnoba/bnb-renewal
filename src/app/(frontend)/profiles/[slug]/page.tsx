import type { Metadata } from 'next'

import {
  generateProfileMetadata,
  profileCanonicalPath,
  type ProfileDetailParams,
} from '../ProfileDetailPage'
import { notFound, redirect } from 'next/navigation'

export const revalidate = 600
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Args = {
  params: Promise<ProfileDetailParams>
}

export default async function ProfileDetail({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const canonicalPath = await profileCanonicalPath(decodedSlug)

  if (!canonicalPath) {
    notFound()
  }

  redirect(canonicalPath)
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)

  return generateProfileMetadata({ slug: decodedSlug })
}
