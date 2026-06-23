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

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = '' } = await params
  const center = centerSlugs.includes(slug as CenterSlug) ? (slug as CenterSlug) : null

  if (!center) {
    return {}
  }

  const siteTitle = `배우앤배움 ${centers[center]}`

  return {
    title: {
      default: siteTitle,
      template: `%s - ${siteTitle}`,
    },
  }
}

export default function CenterLayout({ children }: LayoutProps) {
  return children
}
