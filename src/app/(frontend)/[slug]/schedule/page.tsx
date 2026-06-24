import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { assertCenter, centers, getCenterLabel } from '@/lib/centers'

import { isScheduleCenter, SchedulePage } from '../../schedule/SchedulePage'

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams?: Promise<{
    month?: string
    year?: string
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 600

export function generateStaticParams() {
  return Object.keys(centers)
    .filter((slug) => slug !== 'exam')
    .map((slug) => ({ slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const center = assertCenter(slug)

  if (!isScheduleCenter(center)) {
    notFound()
  }

  return {
    description: `${getCenterLabel(center)} 촬영 및 오디션 스케줄 안내`,
    title: '촬영ㆍ오디션 스케줄',
  }
}

export default async function CenterSchedulePage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const [{ slug = '' }, query = {}] = await Promise.all([
    paramsPromise,
    searchParamsPromise,
  ])
  const center = assertCenter(slug)

  if (!isScheduleCenter(center)) {
    notFound()
  }

  return (
    <SchedulePage
      center={center}
      month={parseCalendarNumber(query.month)}
      year={parseCalendarNumber(query.year)}
    />
  )
}

function parseCalendarNumber(value: string | undefined) {
  const number = Number(value)

  return Number.isInteger(number) ? number : Number.NaN
}
