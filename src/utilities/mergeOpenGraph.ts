import type { Metadata } from 'next'

import type { CenterSlug } from '@/lib/centers'

import { getServerSideURL } from './getURL'
import { getSiteTitle } from './siteMetadata'

const defaultOpenGraphImagePath = '/website-template-OG.webp'

const centerOpenGraphImagePaths: Record<CenterSlug, string> = {
  art: '/assets/og/og-art.jpg',
  avenue: '/assets/og/og-avenue.jpg',
  exam: '/assets/og/og-exam.jpg',
  highteen: '/assets/og/og-highteen.jpg',
  kids: '/assets/og/og-kids.jpg',
}

type OpenGraphDefaults = {
  center?: CenterSlug
}

export function defaultOpenGraphImage() {
  return openGraphImage(defaultOpenGraphImagePath)
}

export function centerOpenGraphImage(center: CenterSlug) {
  return openGraphImage(centerOpenGraphImagePaths[center])
}

function openGraphImage(path: string) {
  return {
    height: 630,
    type: path.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
    url: absoluteUrl(path),
    width: 1200,
  }
}

function defaultOpenGraph({ center }: OpenGraphDefaults = {}): NonNullable<Metadata['openGraph']> {
  const siteTitle = getSiteTitle()

  return {
    type: 'website',
    description: '배우앤배움 공식 웹사이트',
    images: [center ? centerOpenGraphImage(center) : defaultOpenGraphImage()],
    siteName: siteTitle,
    title: siteTitle,
  }
}

export const mergeOpenGraph = (
  og?: Metadata['openGraph'],
  defaultsOptions?: OpenGraphDefaults,
): Metadata['openGraph'] => {
  const defaults = defaultOpenGraph(defaultsOptions)

  return {
    ...defaults,
    ...og,
    images: og?.images ? og.images : defaults.images,
  }
}

function absoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${getServerSideURL()}${path.startsWith('/') ? path : `/${path}`}`
}
