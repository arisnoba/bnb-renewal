import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'

import {
  generateTeacherMetadata,
  generateTeacherStaticParams,
  TeacherDetailPage,
} from '../../../teachers/TeacherDetailPage'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
    teacherSlug?: string
  }>
}

export async function generateStaticParams(): Promise<Array<{ slug: string; teacherSlug: string }>> {
  const params = await generateTeacherStaticParams()

  return params.map(({ center, slug }) => ({ slug: center, teacherSlug: slug }))
}

export default async function CenterTeacherDetail({ params: paramsPromise }: Args) {
  const { slug = '', teacherSlug = '' } = await paramsPromise
  const centerSlug = assertCenter(slug)
  const decodedTeacherSlug = decodeURIComponent(teacherSlug)

  return <TeacherDetailPage center={centerSlug} slug={decodedTeacherSlug} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '', teacherSlug = '' } = await paramsPromise
  const centerSlug = assertCenter(slug)
  const decodedTeacherSlug = decodeURIComponent(teacherSlug)

  return generateTeacherMetadata({ center: centerSlug, slug: decodedTeacherSlug })
}
