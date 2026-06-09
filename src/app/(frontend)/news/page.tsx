import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export default async function NewsIndex() {
  redirect('/art/news')
}

export function generateMetadata(): Metadata {
  return {
    title: '뉴스',
  }
}
