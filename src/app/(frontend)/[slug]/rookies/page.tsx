import type { Metadata } from 'next'

import { assertCenter, centers } from '@/lib/centers'

import { RookiesArchive } from '../../rookies/RookiesArchive'

type RookiesPageProps = {
  params: Promise<{ slug?: string }>
  searchParams?: Promise<{ filter?: string; page?: string }>
}

export function generateStaticParams() {
  return Object.keys(centers).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: RookiesPageProps): Promise<Metadata> {
  const { slug = '' } = await params
  assertCenter(slug)

  return {
    title: 'BNB 루키',
  }
}

export default async function RookiesPage({ params, searchParams }: RookiesPageProps) {
  const [{ slug = '' }, query = {}] = await Promise.all([params, searchParams])
  const center = assertCenter(slug)

  return (
    <RookiesArchive
      activeFilter={query.filter}
      center={center}
      page={parsePage(query.page)}
    />
  )
}

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}
