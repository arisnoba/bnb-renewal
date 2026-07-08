import type { Metadata } from 'next'

import {
  generateProfileMetadata,
  generateProfileStaticParams,
  profileCanonicalPath,
  type ProfileDetailParams,
} from '../ProfileDetailPage'
import { notFound, redirect } from 'next/navigation'

export const revalidate = 600
export const dynamicParams = true

type Args = {
  params: Promise<ProfileDetailParams>
}

export async function generateStaticParams() {
  const params = await generateProfileStaticParams()
  const slugs = [...new Set(params.map(({ slug }) => slug))]

  return slugs.map((slug) => ({ slug }))
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
