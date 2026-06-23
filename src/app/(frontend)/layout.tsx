import type { Metadata } from 'next'

import React from 'react'
import { Toaster } from 'sonner'

import { AdminBar } from '@/components/AdminBar'
import { CookieBanner } from '@/components/legal/CookieBanner'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
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

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <AdminBar
          adminBarProps={{
            preview: isEnabled,
          }}
        />

        <FrontendChrome footer={<Footer />} header={<Header />} initialIsGatePage={isGatePage}>
          {children}
        </FrontendChrome>
        <CookieBanner />
        <Toaster position="top-center" richColors />
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
