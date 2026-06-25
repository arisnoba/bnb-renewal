import type { Metadata } from 'next'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter } from '@/lib/centers'
import type { CenterSlug } from '@/lib/centers'
import { notFound } from 'next/navigation'

import { GradeSystemTabs } from './GradeSystemTabs.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type GradeSystemCenter = Extract<CenterSlug, 'art' | 'highteen' | 'kids'>

const gradeSystemMetadata = {
  art: {
    description: '배우앤배움 아트센터 IRUDA 연기트레이닝 등급제 교육관리시스템 안내',
    title: '등급제 교육관리시스템',
  },
  highteen: {
    description: '배우앤배움 하이틴센터 IRUDA 연기트레이닝 등급제 교육관리시스템 안내',
    title: '등급제 교육관리시스템',
  },
  kids: {
    description: '배우앤배움 키즈센터 등급제 교육관리시스템 안내',
    title: '등급제 교육관리시스템',
  },
} satisfies Record<GradeSystemCenter, Metadata>

function isGradeSystemCenter(center: CenterSlug): center is GradeSystemCenter {
  return center === 'art' || center === 'highteen' || center === 'kids'
}

export function generateStaticParams() {
  return [{ slug: 'art' }, { slug: 'highteen' }, { slug: 'kids' }]
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (!isGradeSystemCenter(center)) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  return gradeSystemMetadata[center]
}

export default async function ArtGradeSystemPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)
  const decoIcons = getPageDecoIcons(4, `grade-system-${center}`)

  if (!isGradeSystemCenter(center)) {
    notFound()
  }

  return (
    <main className="page page-dark page-grade-system" data-center={center}>
      <section className="relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-70 grayscale"
          style={{ backgroundImage: "url('/assets/art/grade-system-hero.png')" }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <PageDeco
          className={
            center === 'kids'
              ? '-left-52 top-[22%] md:-left-60'
              : '-left-20 top-[22%] md:-left-28'
          }
          icon={center === 'kids' ? 'icon-ng.svg' : decoIcons[0]}
        />
        <PageDeco
          className={
            center === 'kids'
              ? '-right-12 bottom-[10%] hidden md:block md:-right-20'
              : '-right-12 bottom-[10%] md:-right-20'
          }
          icon={center === 'kids' ? 'icon-ae.svg' : decoIcons[1]}
        />
        <div className="container relative flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1 className="page-hero-label">
            <span className="block whitespace-nowrap text-brand">교육</span>
            <span className="block">등급제</span>
            <span className="block">교육관리시스템</span>
          </h1>
        </div>
      </section>
      <GradeSystemTabs center={center} />
    </main>
  )
}
