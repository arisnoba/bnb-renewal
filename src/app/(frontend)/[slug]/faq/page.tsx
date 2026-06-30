import type { Metadata } from 'next'

import { centers, assertCenter, getCenterLabel } from '@/lib/centers'

import { FaqArchive } from '../../faq/FaqArchive'

type Args = {
  params: Promise<{
    slug: string
  }>
}

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
    title: '자주하는 질문',
  }
}

export default async function CenterFaqPage({
  params: paramsPromise,
}: Args) {
  const { slug } = await paramsPromise
  const center = assertCenter(slug)

  return <FaqArchive center={center} />
}
