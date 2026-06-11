import type { Metadata } from 'next'

import React from 'react'
import { Toaster } from 'sonner'

import { AdminBar } from '@/components/AdminBar'
import { CookieBanner } from '@/components/legal/CookieBanner'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import type { PageTone } from '@/providers/PageTone'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode, headers } from 'next/headers'
import { FrontendChrome } from './FrontendChrome.client'

import './globals.css'
import '@/styles/style.scss'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isEnabled } = await draftMode()
  const pathname = (await headers()).get('x-pathname')
  const isGatePage = pathname === '/'
  const initialPageTone = initialPageToneFromPathname(pathname)

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body data-page-tone={initialPageTone}>
        <Providers initialPageTone={initialPageTone}>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <FrontendChrome
            footer={<Footer />}
            header={<Header />}
            initialIsGatePage={isGatePage}
          >
            {children}
          </FrontendChrome>
          <CookieBanner />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}

function initialPageToneFromPathname(pathname: string | null): PageTone {
  const segments = pathname?.split('?')[0]?.split('/').filter(Boolean) ?? []
  const firstSegment = segments[0]
  const secondSegment = segments[1]
  const centerSlugs = new Set(['art', 'avenue', 'exam', 'highteen', 'kids'])

  if (segments.length === 1 && firstSegment && centerSlugs.has(firstSegment)) {
    return 'dark'
  }

  if (
    firstSegment &&
    centerSlugs.has(firstSegment) &&
    (secondSegment === 'grade-system' || secondSegment === 'map')
  ) {
    return 'dark'
  }

  if (firstSegment === 'posts' && segments.length === 2) {
    return 'dark'
  }

  return 'light'
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
