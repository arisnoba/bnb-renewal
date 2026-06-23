import type { Metadata } from 'next'

import { assertCenter, centers } from '@/lib/centers'

import { TeachersArchive } from '../../teachers/TeachersArchive'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  assertCenter(slug)

  return {
    title: '교육진 소개',
  }
}

export default async function CenterTeachersPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const center = assertCenter(slug)

  return <TeachersArchive center={center} />
}
