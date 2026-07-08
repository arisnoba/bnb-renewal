import type { Metadata } from 'next'

import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage'
import { assertCenter, centers } from '@/lib/centers'
import { getLegalTermPageData } from '@/lib/legalTerms'

type CenterTermsPageProps = {
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

export async function generateMetadata({ params }: CenterTermsPageProps): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  return {
    title: '이용약관',
    description: `${centers[center]} 이용약관`,
  }
}

export default async function CenterTermsPage({
  params,
  searchParams,
}: CenterTermsPageProps) {
  const { slug } = await params
  const center = assertCenter(slug)
  const { version } = await searchParams
  const document = await getLegalTermPageData('terms', version)

  return <LegalDocumentPage center={center} document={document} />
}
