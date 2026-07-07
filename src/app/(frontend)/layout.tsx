import type { Metadata } from 'next'

import React from 'react'
import { Toaster } from 'sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { AdminBar } from '@/components/AdminBar'
import { CookieBanner } from '@/components/legal/CookieBanner'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { FrontendChrome } from './FrontendChrome.client'
import { NavigationTopLoader } from './NavigationTopLoader.client'

import './globals.css'
import '@/styles/style.scss'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <NavigationTopLoader />
        <AdminBar />

        <FrontendChrome footer={<Footer />} header={<Header />} initialIsGatePage={false}>
          {children}
        </FrontendChrome>
        <CookieBanner />
        <Toaster position="top-center" richColors />
        <SpeedInsights />
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: '배우앤배움',
    template: '%s - 배우앤배움',
  },
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
