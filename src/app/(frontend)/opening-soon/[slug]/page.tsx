import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { CenterComingSoonPage } from '@/app/(frontend)/CenterComingSoonPage'
import {
  centerPreparationMessage,
  centerPreparationTitle,
  isCenterPubliclyAvailable,
} from '@/lib/centerAvailability'
import { assertCenter } from '@/lib/centers'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const center = assertCenter((await params).slug)

  if (isCenterPubliclyAvailable(center)) {
    return {}
  }

  const title = centerPreparationTitle(center)

  return {
    description: centerPreparationMessage,
    openGraph: {
      description: centerPreparationMessage,
      title,
    },
    robots: {
      follow: false,
      index: false,
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description: centerPreparationMessage,
      title,
    },
  }
}

export default async function CenterOpeningSoonPage({ params }: Args) {
  const center = assertCenter((await params).slug)

  if (isCenterPubliclyAvailable(center)) {
    notFound()
  }

  return <CenterComingSoonPage center={center} />
}
