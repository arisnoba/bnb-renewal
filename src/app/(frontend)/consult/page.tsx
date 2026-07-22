import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { centerPublicHref } from '@/lib/centerDomains'

import type { CenterSlug } from '@/lib/centers'
import { centers } from '@/lib/centers'
import type { ConsultationSearchParams } from './inquiryTypeParams'

export const metadata: Metadata = {
  title: '상담하기',
  description: '배우앤배움 상담하기',
}

type LegacyConsultPageProps = {
  searchParams?: Promise<ConsultationSearchParams>
}

const centerSlugs = Object.keys(centers) as CenterSlug[]

export default async function LegacyConsultPage({ searchParams }: LegacyConsultPageProps) {
  const resolvedSearchParams = await searchParams
  const center = resolveLegacyCenter(resolvedSearchParams)
  const queryString = toForwardQueryString(resolvedSearchParams)

  redirect(centerPublicHref(center, `/consult${queryString}`))
}

function resolveLegacyCenter(searchParams: ConsultationSearchParams | undefined): CenterSlug {
  const center = firstParamValue(searchParams?.center)

  return centerSlugs.includes(center as CenterSlug) ? (center as CenterSlug) : 'art'
}

function toForwardQueryString(searchParams: ConsultationSearchParams | undefined) {
  if (!searchParams) {
    return ''
  }

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'center') continue

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }
      continue
    }

    if (value) {
      params.set(key, value)
    }
  }

  const queryString = params.toString()

  return queryString ? `?${queryString}` : ''
}

function firstParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
