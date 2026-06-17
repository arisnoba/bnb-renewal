import type { Metadata } from 'next'

import { centers, assertCenter, getCenterLabel } from '@/lib/centers'

import { FaqArchive } from '../../faq/FaqArchive'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    category?: string
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 600

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  const center = assertCenter(slug)
  const centerLabel = getCenterLabel(center)

  return {
    alternates: {
      canonical: `/${center}/faq`,
    },
    description: `${centerLabel} 입학, 수업, 수강료, 캐스팅, 이용방법 관련 자주하는 질문과 답변을 확인하세요.`,
    title: `${centerLabel} 자주하는 질문`,
  }
}

export default async function CenterFaqPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { slug } = await paramsPromise
  const { category } = await searchParamsPromise
  const center = assertCenter(slug)

  return <FaqArchive activeCategory={category} center={center} />
}
