import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
}

export default function UnknownCenterSubpathPage() {
  notFound()
}
