import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'
import { getSiteTitle } from './siteMetadata'

function defaultOpenGraph(): NonNullable<Metadata['openGraph']> {
  const siteTitle = getSiteTitle()

  return {
    type: 'website',
    description: '배우앤배움 공식 웹사이트',
    images: [
      {
        url: `${getServerSideURL()}/website-template-OG.webp`,
      },
    ],
    siteName: siteTitle,
    title: siteTitle,
  }
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  const defaults = defaultOpenGraph()

  return {
    ...defaults,
    ...og,
    images: og?.images ? og.images : defaults.images,
  }
}
