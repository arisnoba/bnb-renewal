import type { Metadata } from 'next'

import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage'
import { getLegalTermPageData } from '@/lib/legalTerms'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '배우앤배움 개인정보처리방침',
}

type PrivacyPolicyPageProps = {
  searchParams: Promise<{
    version?: string
  }>
}

export default async function PrivacyPolicyPage({ searchParams }: PrivacyPolicyPageProps) {
  const { version } = await searchParams
  const document = await getLegalTermPageData('privacy', version)

  return <LegalDocumentPage document={document} />
}
