import type { Metadata } from 'next'

import { assertCenter, centers, getCenterLabel } from '@/lib/centers'

import { TeachersArchive } from '../../teachers/TeachersArchive'

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams?: Promise<{
    visible?: string
  }>
}

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const center = assertCenter(slug)

  return {
    title: `${getCenterLabel(center)} 교육진 소개`,
  }
}

export default async function CenterTeachersPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const [{ slug = '' }, query = {}] = await Promise.all([paramsPromise, searchParamsPromise])
  const center = assertCenter(slug)

  return <TeachersArchive center={center} visible={parseVisible(query.visible)} />
}

function parseVisible(value: string | undefined) {
  const visible = Number(value)

  return Number.isFinite(visible) && visible > 0 ? Math.floor(visible) : undefined
}
