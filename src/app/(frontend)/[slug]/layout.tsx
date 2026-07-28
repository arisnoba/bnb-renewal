import type { Metadata } from 'next'

import React from 'react'

import {
  centerPreparationMessage,
  centerPreparationTitle,
  isCenterPubliclyAvailable,
} from '@/lib/centerAvailability'
import { centers, type CenterSlug } from '@/lib/centers'
import { centerOrigin } from '@/lib/centerDomains'
import { centerOpenGraphImage } from '@/utilities/mergeOpenGraph'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

type LayoutProps = Args & {
  children: React.ReactNode
}

const centerSlugs = Object.keys(centers) as CenterSlug[]

function centerFaviconPath(center: CenterSlug, fileName: string) {
  return `/assets/favicons/${center}/${fileName}`
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = '' } = await params
  const center = centerSlugs.includes(slug as CenterSlug) ? (slug as CenterSlug) : null

  if (!center) {
    return {}
  }

  const siteTitle = `배우앤배움 ${centers[center]}`
  const openGraphImage = centerOpenGraphImage(center)
  const isPubliclyAvailable = isCenterPubliclyAvailable(center)
  const title = isPubliclyAvailable ? siteTitle : centerPreparationTitle(center)

  return {
    description: isPubliclyAvailable ? undefined : centerPreparationMessage,
    metadataBase: new URL(centerOrigin(center)),
    icons: {
      icon: [
        { url: centerFaviconPath(center, 'favicon.ico'), sizes: 'any' },
        { url: centerFaviconPath(center, 'favicon-32x32.png'), sizes: '32x32', type: 'image/png' },
        { url: centerFaviconPath(center, 'favicon-16x16.png'), sizes: '16x16', type: 'image/png' },
      ],
      apple: [
        {
          url: centerFaviconPath(center, 'apple-touch-icon.png'),
          sizes: '180x180',
          type: 'image/png',
        },
      ],
    },
    manifest: centerFaviconPath(center, 'site.webmanifest'),
    openGraph: {
      description: isPubliclyAvailable ? undefined : centerPreparationMessage,
      images: [openGraphImage],
      title: isPubliclyAvailable ? undefined : title,
    },
    robots: isPubliclyAvailable
      ? undefined
      : {
          follow: false,
          index: false,
        },
    title: {
      default: title,
      template: `%s - ${title}`,
    },
    twitter: {
      card: 'summary_large_image',
      description: isPubliclyAvailable ? undefined : centerPreparationMessage,
      images: [openGraphImage.url],
      title: isPubliclyAvailable ? undefined : title,
    },
  }
}

export default function CenterLayout({ children }: LayoutProps) {
  return children
}
