import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  description: 'BNB 통합 사이트와 Payload CMS를 위한 초기 스캐폴딩',
  title: 'BNB Renewal',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
