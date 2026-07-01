'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'

import { PageDeco, type DecoIcon } from '@/components/PageDeco'
import type { CenterSlug } from '@/lib/centers'
import { cn } from '@/utilities/ui'

export type ImageGalleryItem = {
  center: CenterSlug
  title: string
  description: string
  href: string
  cta: string
  desktopImage: string
  mobileImage: string
  decoIcon: DecoIcon
  textTone?: 'dark' | 'light'
}

const defaultItems: ImageGalleryItem[] = [
  {
    center: 'art',
    title: '아트센터',
    description:
      '실전 중심의 전문 교육으로 배우의 꿈을 키우고 현장 경험을 담은 체계적인 커리큘럼으로 연기의 기본부터 작품 활동까지 성장을 함께하는 아티스트 교육을 제공합니다.',
    href: '/art',
    cta: '아트센터 바로가기',
    desktopImage: '/assets/gate/art-desktop.png',
    mobileImage: '/assets/gate/art-mobile.png',
    decoIcon: 'icon-b.svg',
    textTone: 'dark',
  },
  {
    center: 'exam',
    title: '입시센터',
    description:
      '예고·예대 입시를 위한 체계적인 커리큘럼과 실전 중심의 맞춤형 입시 전략으로 학생 개개인의 가능성을 극대화하며 목표 대학 합격을 함께 만들어갑니다.',
    href: '/exam',
    cta: '입시센터 바로가기',
    desktopImage: '/assets/gate/exam-desktop.png',
    mobileImage: '/assets/gate/exam-mobile.png',
    decoIcon: 'icon-ae.svg',
  },
  {
    center: 'highteen',
    title: '하이틴센터',
    description:
      '청소년의 가능성과 재능을 발견하고 즐겁고 체계적인 연기 교육을 통해 자신감과 표현력을 자연스럽게 키우며 배우로 성장하는 첫걸음을 함께합니다.',
    href: '/highteen',
    cta: '하이틴센터 바로가기',
    desktopImage: '/assets/gate/highteen-desktop.png',
    mobileImage: '/assets/gate/highteen-mobile.png',
    decoIcon: 'icon-ng.svg',
  },
  {
    center: 'kids',
    title: '키즈센터',
    description:
      '아이들의 상상력과 자신감을 키워주는 놀이와 교육이 어우러진 연기 프로그램으로 창의적인 표현력과 바른 인성을 함께 배우며 즐겁게 성장하는 시간을 만들어갑니다.',
    href: '/kids',
    cta: '키즈센터 바로가기',
    desktopImage: '/assets/gate/kids-desktop.png',
    mobileImage: '/assets/gate/kids-mobile.png',
    decoIcon: 'icon-u.svg',
  },
  {
    center: 'avenue',
    title: '애비뉴센터',
    description:
      '오디션과 작품 활동을 위한 실전 교육으로 현장에서 요구하는 역량을 체계적으로 익히고 다양한 캐스팅 기회와 경험을 통해 배우의 가능성을 현실로 연결합니다.',
    href: '/avenue',
    cta: '애비뉴센터 바로가기',
    desktopImage: '/assets/gate/avenue-desktop.png',
    mobileImage: '/assets/gate/avenue-mobile.png',
    decoIcon: 'icon-m.svg',
  },
]

type ImageGalleryProps = {
  items?: ImageGalleryItem[]
}

export default function ImageGallery({
  items = defaultItems,
}: ImageGalleryProps) {
  return (
    <main className="page page-dark page-landing page-gate bg-black text-white" data-center="art">
      <div className="section-gate-shell mx-auto flex w-full max-w-[1920px] flex-col gap-3 px-3 py-3 md:gap-6 md:px-6 md:py-6">
        <GateHero />
        <section className="section-gate-centers flex flex-col gap-3 md:gap-6">
          {items.map((item) => (
            <GateCenterCard item={item} key={item.href} />
          ))}
        </section>
      </div>
    </main>
  )
}

function GateHero() {
  return (
    <section
      className="section-gate-hero relative h-[460px] overflow-hidden bg-[#111] md:h-[calc(100svh-48px)] md:max-h-[1023px] md:min-h-[720px]"
      data-center="art"
      data-page-tone="dark"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="object-cover object-center md:hidden"
        fill
        priority
        sizes="100vw"
        src="/assets/gate/hero-mobile.png"
      />
      <Image
        alt=""
        aria-hidden="true"
        className="hidden object-cover object-center md:block"
        fill
        priority
        sizes="100vw"
        src="/assets/gate/hero-desktop.png"
      />
      <PageDeco
        className="section-gate-hero__deco section-gate-hero__deco--top-left -left-17 -top-3 z-1 [--page-deco-size:146px] md:-left-44 md:-top-8 md:[--page-deco-size:400px]"
        icon="icon-ae.svg"
      />
      <PageDeco
        className="section-gate-hero__deco section-gate-hero__deco--bottom-right -right-16 -bottom-9 z-1 [--page-deco-size:146px] md:-right-43 md:-bottom-25 md:[--page-deco-size:420px]"
        icon="icon-ng.svg"
      />
      <Image
        alt="배우앤배움 ENM"
        className="section-gate-hero__logo absolute right-0 top-0 z-2 h-6 w-[69px] object-contain md:right-10 md:top-10 md:h-[55px] md:w-[161px]"
        height={55}
        priority
        src="/assets/gate/logo-enm.png"
        width={161}
      />
      <div className="section-gate-hero__content absolute left-1/2 top-[151px] z-2 w-60 -translate-x-1/2 text-center md:top-[330px] md:w-[693px]">
        <h1 className="type-display-l md:type-display-xl text-balance font-extrabold leading-tight tracking-normal text-white">
          꿈을 발견하고,
          <br />
          가능성을 키워가는 곳
        </h1>
        <p className="type-caption-l mt-7 font-semibold text-white md:mt-10 md:type-title-s">
          배우앤배움의 모든 교육 과정을 만나보세요
        </p>
      </div>
      <ChevronDown
        aria-hidden="true"
        className="section-gate-hero__scroll hidden absolute bottom-20 left-1/2 z-2 size-8 -translate-x-1/2 text-white md:block"
        strokeWidth={2.4}
      />
    </section>
  )
}

function GateCenterCard({ item }: { item: ImageGalleryItem }) {
  const isDarkText = item.textTone === 'dark'
  const title = `배우앤배움 ${item.title}`

  return (
    <Link
      className="section-gate-card group relative block h-[460px] overflow-hidden bg-[#111] text-left outline-none md:h-[800px]"
      data-center={item.center}
      href={item.href}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.02] group-focus-visible:scale-[1.02] md:hidden"
        fill
        loading="eager"
        sizes="100vw"
        src={item.mobileImage}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="hidden object-cover transition-transform duration-500 group-hover:scale-[1.02] group-focus-visible:scale-[1.02] md:block"
        fill
        loading="eager"
        sizes="100vw"
        src={item.desktopImage}
      />
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 z-1 transition-opacity duration-500 group-hover:opacity-80 group-focus-visible:opacity-80',
          isDarkText
            ? 'bg-gradient-to-r from-white/10 via-transparent to-transparent'
            : 'bg-gradient-to-r from-black/12 via-transparent to-transparent',
        )}
      />
      <div className="section-gate-card__headline absolute left-4 top-6 z-3 w-52 md:left-20 md:top-20 md:w-[420px]">
        <h2 className="type-display-l md:type-display-xl whitespace-pre-line font-extrabold leading-tight tracking-normal text-brand">
          {title.replace(' ', '\n')}
        </h2>
        <span className="type-label-s mt-8 inline-flex items-center gap-1.5 font-bold text-brand md:mt-10">
          {item.cta}
          <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
        </span>
      </div>
      <p
        className={cn(
          'section-gate-card__description type-caption-s absolute bottom-5 left-4 z-3 max-w-[21rem] font-medium leading-normal md:bottom-20 md:left-20 md:type-body-s md:max-w-[42rem]',
          isDarkText ? 'text-white/90 md:text-neutral-700' : 'text-white/90',
        )}
      >
        {item.description}
      </p>
      <PageDeco
        className="section-gate-card__deco bottom-1.5 right-1.5 z-2 opacity-95 [--page-deco-size:100px] md:-right-[30px] md:-bottom-[30px] md:[--page-deco-size:338px]"
        icon={item.decoIcon}
      />
    </Link>
  )
}
