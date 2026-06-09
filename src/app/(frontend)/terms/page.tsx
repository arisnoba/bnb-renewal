import type { Metadata } from 'next'

import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage'
import { getLegalTermPageData } from '@/lib/legalTerms'

export const metadata: Metadata = {
  title: '이용약관',
  description: '배우앤배움 이용약관',
}

type TermsPageProps = {
  searchParams: Promise<{
    version?: string
  }>
}

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const { version } = await searchParams
  const document = await getLegalTermPageData('terms', version)

  return <LegalDocumentPage document={document} />
}
