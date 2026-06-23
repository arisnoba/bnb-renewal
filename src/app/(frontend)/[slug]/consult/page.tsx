import type { Metadata } from 'next'

import { assertCenter, centers } from '@/lib/centers'
import { ConsultPageContent } from '../../consult/ConsultPage'
import type { ConsultationSearchParams } from '../../consult/inquiryTypeParams'

type CenterConsultPageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<ConsultationSearchParams>
}

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: CenterConsultPageProps): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  return {
    description: `${centers[center]} 온라인 상담 신청`,
    title: '상담하기',
  }
}

export default async function CenterConsultPage({ params, searchParams }: CenterConsultPageProps) {
  const { slug } = await params
  const center = assertCenter(slug)

  return <ConsultPageContent center={center} searchParams={searchParams} />
}
