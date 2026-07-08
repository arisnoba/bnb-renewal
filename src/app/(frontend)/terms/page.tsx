import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '이용약관',
  description: '배우앤배움 이용약관',
}

type TermsPageProps = {
  searchParams: Promise<{
    version?: string
  }>
}

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const { version } = await searchParams

  redirect(`/art/terms${version ? `?version=${encodeURIComponent(version)}` : ''}`)
}
