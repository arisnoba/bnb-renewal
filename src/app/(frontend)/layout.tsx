import type { Metadata } from 'next'

import React from 'react'
import { Toaster } from 'sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { AdminBar } from '@/components/AdminBar'
import { CookieBanner } from '@/components/legal/CookieBanner'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import {
  isMaintenanceModeEnabled,
  maintenanceMessage,
  maintenanceTitle,
} from '@/SiteSettings/maintenance'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { FrontendChrome } from './FrontendChrome.client'
import { MaintenancePage } from './MaintenancePage'
import { NavigationTopLoader } from './NavigationTopLoader.client'

import './globals.css'
import '@/styles/style.scss'
import { getServerSideURL } from '@/utilities/getURL'

async function getSiteSettings() {
  try {
    return await getCachedGlobal('site-settings', 0)()
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteSettings = await getSiteSettings()
  const showMaintenancePage = isMaintenanceModeEnabled(siteSettings)

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <NavigationTopLoader />
        <AdminBar />

        {showMaintenancePage ? (
          <MaintenancePage settings={siteSettings} />
        ) : (
          <>
            <FrontendChrome footer={<Footer />} header={<Header />} initialIsGatePage={false}>
              {children}
            </FrontendChrome>
            <CookieBanner />
          </>
        )}
        <Toaster position="top-center" richColors />
        <SpeedInsights />
      </body>
    </html>
  )
}

const defaultMetadata: Metadata = {
  formatDetection: {
    address: false,
    date: false,
    email: false,
    telephone: false,
    url: false,
  },
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

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()

  if (!isMaintenanceModeEnabled(siteSettings)) {
    return defaultMetadata
  }

  const title = maintenanceTitle(siteSettings)
  const description = maintenanceMessage(siteSettings)

  return {
    ...defaultMetadata,
    description,
    openGraph: mergeOpenGraph({
      description,
      title,
    }),
    robots: {
      follow: false,
      index: false,
    },
    title,
    twitter: {
      ...defaultMetadata.twitter,
      card: 'summary_large_image',
      description,
      title,
    },
  }
}
