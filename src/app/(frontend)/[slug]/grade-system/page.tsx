import type { Metadata } from 'next'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter } from '@/lib/centers'
import { notFound } from 'next/navigation'

import PageClient from '../page.client'
import { GradeSystemTabs } from './GradeSystemTabs.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return [{ slug: 'art' }]
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center !== 'art') {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  return {
    description: '배우앤배움 아트센터 IRUDA 연기트레이닝 등급제 교육관리시스템 안내',
    title: '등급제 교육관리시스템 | 배우앤배움 아트센터',
  }
}

export default async function ArtGradeSystemPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)
  const decoIcons = getPageDecoIcons(4, 'grade-system')

  if (center !== 'art') {
    notFound()
  }

  return (
    <main className="page page-dark page-grade-system" data-center="art">
      <PageClient pageTone="dark" />
      <section className="relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-70 grayscale"
          style={{ backgroundImage: "url('/assets/art/grade-system-hero.png')" }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <PageDeco
          className="-left-20 top-[22%] h-56 w-56 md:-left-28 md:h-[360px] md:w-[360px]"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="-right-12 bottom-[10%] h-48 w-48 md:-right-20 md:h-[300px] md:w-[300px]"
          icon={decoIcons[1]}
        />
        <div className="container relative flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1 className="page-title">
            <span className="block text-brand">교육</span>
            <span className="block">등급제</span>
            <span className="block">교육관리시스템</span>
          </h1>
        </div>
      </section>
      <GradeSystemTabs />
    </main>
  )
}
