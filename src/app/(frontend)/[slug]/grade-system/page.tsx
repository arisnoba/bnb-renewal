import type { Metadata } from 'next'

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

  if (center !== 'art') {
    notFound()
  }

  return (
    <main className="bg-[#111] text-white" data-center="art">
      <PageClient />
      <section className="relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-70 grayscale"
          style={{ backgroundImage: "url('/assets/art/grade-system-hero.png')" }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="pointer-events-none absolute -left-20 top-[22%] h-56 w-56 rounded-full border-[72px] border-brand md:-left-28 md:h-[360px] md:w-[360px] md:border-[112px]" />
        <div className="pointer-events-none absolute -right-12 bottom-[10%] h-48 w-48 border-[56px] border-brand md:-right-20 md:h-[300px] md:w-[300px] md:border-[86px]" />
        <div className="container relative flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1 className="ml-[96px] text-[44px] font-extrabold leading-[1.12] tracking-normal md:ml-[132px] md:text-[64px] lg:ml-[156px]">
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
