import type { Metadata } from 'next'

import React from 'react'
import { Toaster } from 'sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { headers } from 'next/headers'

import { isGlobalAdminUser, userCenterValue } from '@/collections/shared'
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
import { getPayloadClient } from '@/lib/payload'
import { FrontendChrome } from './FrontendChrome.client'
import { MaintenancePage } from './MaintenancePage'
import { NavigationTopLoader } from './NavigationTopLoader.client'
import { CenterDomainProvider } from './CenterDomainContext.client'

import './globals.css'
import '@/styles/style.scss'
import { getServerSideURL } from '@/utilities/getURL'
import { centerFromHostname } from '@/lib/centerDomains'

async function getSiteSettings() {
  try {
    return await getCachedGlobal('site-settings', 0)()
  } catch {
    return null
  }
}

async function getFrontendMaintenanceBypassUser() {
  try {
    const requestHeaders = await headers()
    const cookieHeader = requestHeaders.get('cookie') ?? ''

    if (!/(?:^|;\s*)payload-token=/.test(cookieHeader)) {
      return null
    }

    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: requestHeaders })

    return user && (isGlobalAdminUser(user) || userCenterValue(user)) ? user : null
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = await headers()
  const domainCenter = centerFromHostname(requestHeaders.get('host') ?? '')
  const siteSettings = await getSiteSettings()
  const bypassUser = await getFrontendMaintenanceBypassUser()
  const showMaintenancePage = isMaintenanceModeEnabled(siteSettings) && !bypassUser

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <CenterDomainProvider center={domainCenter}>
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
        </CenterDomainProvider>
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

  if (!isMaintenanceModeEnabled(siteSettings) || (await getFrontendMaintenanceBypassUser())) {
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
