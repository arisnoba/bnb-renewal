import type { Metadata } from 'next'

import { assertCenter, centers, getCenterLabel } from '@/lib/centers'

import { AdmissionGuide } from './AdmissionGuide'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  const center = assertCenter(slug)

  return {
    description: `${getCenterLabel(center)} 입학 절차, 수강료, 장학제도, 휴학/복학/수료, 환불정책 안내`,
    title: '입학안내',
  }
}

export default async function CenterAdmissionPage({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise
  const center = assertCenter(slug)

  return <AdmissionGuide center={center} />
}
