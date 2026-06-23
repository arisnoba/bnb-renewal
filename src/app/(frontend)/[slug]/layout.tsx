import type { Metadata } from 'next'

import React from 'react'

import { centers, type CenterSlug } from '@/lib/centers'

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

  return {
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
    title: {
      default: siteTitle,
      template: `%s - ${siteTitle}`,
    },
  }
}

export default function CenterLayout({ children }: LayoutProps) {
  return children
}
