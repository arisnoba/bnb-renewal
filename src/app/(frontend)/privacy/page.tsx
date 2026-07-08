import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '배우앤배움 개인정보처리방침',
}

type PrivacyPolicyPageProps = {
  searchParams: Promise<{
    version?: string
  }>
}

export default async function PrivacyPolicyPage({ searchParams }: PrivacyPolicyPageProps) {
  const { version } = await searchParams

  redirect(`/art/privacy${version ? `?version=${encodeURIComponent(version)}` : ''}`)
}
