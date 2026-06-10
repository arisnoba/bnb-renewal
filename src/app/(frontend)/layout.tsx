import type { Metadata } from 'next'

import React from 'react'
import { Toaster } from 'sonner'

import { AdminBar } from '@/components/AdminBar'
import { CookieBanner } from '@/components/legal/CookieBanner'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { defaultTheme } from '@/providers/Theme/shared'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode, headers } from 'next/headers'
import { FrontendChrome } from './FrontendChrome.client'

import './globals.css'
import '@/Main/BannerSlider.scss'
import './faq/FaqArchive.scss'
import './news/NewsArchive.scss'
import './starcard/StarcardArchive.scss'
import './page-typography.scss'
import './section-spacing.scss'
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

  return (
    <html data-theme={defaultTheme} lang="ko" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
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

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
