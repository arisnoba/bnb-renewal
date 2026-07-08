import type { Metadata } from 'next'

import { assertCenter, centers } from '@/lib/centers'

import {
  generateTeacherMetadata,
  generateTeacherStaticParams,
  TeacherDetailPage,
} from '../../../teachers/TeacherDetailPage'

export const revalidate = 600
export const dynamicParams = true

type Args = {
  params: Promise<{
    slug?: string
    teacherSlug?: string
  }>
}

export async function generateStaticParams(): Promise<Array<{ slug: string; teacherSlug: string }>> {
  const params: Array<{ slug: string; teacherSlug: string }> = []

  for (const center of Object.keys(centers) as Array<keyof typeof centers>) {
    const teacherParams = await generateTeacherStaticParams(center)

    params.push(...teacherParams.map(({ slug }) => ({ slug: center, teacherSlug: slug })))
  }

  return params
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
