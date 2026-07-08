import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'

import {
  generateTeacherMetadata,
  TeacherDetailPage,
} from '../../../teachers/TeacherDetailPage'

export const revalidate = 600
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Args = {
  params: Promise<{
    slug?: string
    teacherSlug?: string
  }>
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
