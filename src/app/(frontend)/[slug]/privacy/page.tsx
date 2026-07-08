import type { Metadata } from 'next'

import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage'
import { assertCenter, centers } from '@/lib/centers'
import { getLegalTermPageData } from '@/lib/legalTerms'

type CenterPrivacyPolicyPageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    version?: string
  }>
}

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: CenterPrivacyPolicyPageProps): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  return {
    title: '개인정보처리방침',
    description: `${centers[center]} 개인정보처리방침`,
  }
}

export default async function CenterPrivacyPolicyPage({
  params,
  searchParams,
}: CenterPrivacyPolicyPageProps) {
  const { slug } = await params
  const center = assertCenter(slug)
  const { version } = await searchParams
  const document = await getLegalTermPageData('privacy', version)

  return <LegalDocumentPage center={center} document={document} />
}
