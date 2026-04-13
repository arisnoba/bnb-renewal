import type { Metadata } from 'next'
import type { ServerFunctionClient } from 'payload'

import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'

import config from '../../../payload.config'
import { importMap } from './admin/importMap.js'

export const metadata: Metadata = {
  description: 'BNB Renewal Payload Admin',
  title: 'BNB Renewal Admin',
}

export default function PayloadLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const serverFunction: ServerFunctionClient = (args) =>
    handleServerFunctions({
      ...args,
      config,
      importMap,
    })

  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  )
}
