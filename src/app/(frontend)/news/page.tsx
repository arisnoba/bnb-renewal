import type { Metadata } from 'next'

import { NewsArchive } from './NewsArchive'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export default async function NewsIndex() {
  return <NewsArchive />
}

export function generateMetadata(): Metadata {
  return {
    title: '뉴스',
  }
}
