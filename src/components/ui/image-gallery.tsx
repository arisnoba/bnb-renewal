'use client'

import { motion, type MotionValue, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useRef } from 'react'

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

type ImageGalleryProps = {
  items: ImageGalleryItem[]
}

export default function ImageGallery({ items }: ImageGalleryProps) {
  const centersContainer = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: centersContainer,
    offset: ['start start', 'end end'],
  })

  return (
    <main
      className="page page-dark page-landing page-gate relative isolate overflow-x-hidden bg-black text-white"
      data-center="art"
    >
      <div className="section-gate-shell relative z-0 mx-auto flex w-full flex-col">
        <GateHero />
        <section
          className="section-gate-centers relative z-10 mt-[100svh] w-full"
          ref={centersContainer}
        >
          {items.map((item, index) => {
            const targetScale = Math.max(0.72, 1 - (items.length - index - 1) * 0.055)

            return (
              <GateCenterCard
                index={index}
                item={item}
                key={item.href}
                progress={scrollYProgress}
                range={[index / items.length, 1]}
                targetScale={targetScale}
                total={items.length}
              />
            )
          })}
        </section>
      </div>
    </main>
  )
}

function GateHero() {
  const { scrollY } = useScroll()
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 32], [1, 0])

  return (
    <section
      className="section-gate-hero fixed inset-x-0 top-0 z-0 h-svh overflow-hidden"
      data-center="art"
      data-page-tone="dark"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="object-cover object-center md:hidden pointer-events-none"
        fill
        priority
        sizes="100vw"
        src="/assets/gate/hero-mobile.png"
      />
      <Image
        alt=""
        aria-hidden="true"
        className="hidden object-cover object-top md:block pointer-events-none"
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
        className="section-gate-hero__logo absolute right-4 top-4 z-2 h-8 w-auto object-contain md:right-10 md:top-10 md:h-12"
        height={55}
        priority
        src="/assets/gate/logo-enm.png"
        width={161}
      />
      <div className="section-gate-hero__content absolute left-1/2 top-1/2 z-2 -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="type-display-l md:type-display-xl text-balance font-extrabold leading-tight tracking-normal text-white">
          꿈을 발견하고,
          <br />
          가능성을 키워가는 곳
        </h1>
        <p className="type-caption-l mt-7 font-semibold text-white md:mt-10 md:type-title-s">
          배우앤배움의 모든 교육 과정을 만나보세요
        </p>
      </div>
      <motion.div
        aria-hidden="true"
        className="section-gate-hero__scroll pointer-events-none absolute bottom-8 left-1/2 z-2 -translate-x-1/2 text-white md:bottom-20"
        style={{ opacity: scrollIndicatorOpacity }}
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{
            duration: 1.45,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          <ChevronDown className="size-7 md:size-8" strokeWidth={2.4} />
        </motion.div>
      </motion.div>
    </section>
  )
}

type GateCenterCardProps = {
  index: number
  item: ImageGalleryItem
  progress: MotionValue<number>
  range: [number, number]
  targetScale: number
  total: number
}

function GateCenterCard({
  index,
  item,
  progress,
  range,
  targetScale,
  total,
}: GateCenterCardProps) {
  const isDarkText = item.textTone === 'dark'
  const title = `배우앤배움 ${item.title}`
  const scale = useTransform(progress, range, [1, targetScale])

  return (
    <div
      className="section-gate-card-stack sticky top-0 flex h-svh items-center justify-center px-3 py-8 md:px-6 md:py-10"
      style={{ zIndex: index + 1 }}
    >
      <motion.div
        className="section-gate-card-motion relative w-full max-w-480 origin-top"
        style={{ scale }}
      >
        <Link
          className="section-gate-card group relative block h-[72svh] min-h-128 overflow-hidden rounded-lg bg-[#111] text-left shadow-2xl outline-none md:h-[76svh] md:min-h-160"
          data-center={item.center}
          href={item.href}
        >
          <Image
            alt=""
            aria-hidden="true"
            className="object-cover md:hidden pointer-events-none"
            fill
            loading={index === 0 ? 'eager' : 'lazy'}
            sizes="100vw"
            src={item.mobileImage}
          />
          <Image
            alt=""
            aria-hidden="true"
            className="hidden object-cover md:block pointer-events-none"
            fill
            loading={index === 0 ? 'eager' : 'lazy'}
            sizes="(min-width: 1920px) 1920px, 100vw"
            src={item.desktopImage}
          />
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-0 z-1',
              isDarkText
                ? 'bg-linear-to-r from-white/20 via-transparent to-transparent'
                : 'bg-linear-to-r from-black/30 via-transparent to-transparent',
            )}
          />
          <div className="pointer-events-none w-full h-full relative z-3 p-6 md:p-12 lg:p-14 xl:p-20 flex flex-col justify-between">
            <div className="section-gate-card__headline">
              <h2 className="whitespace-pre-line font-extrabold leading-tight tracking-normal text-brand text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                {title.replace(' ', '\n')}
              </h2>
              <span className="mt-8 inline-flex items-center gap-1.5 font-bold text-brand md:mt-10">
                {item.cta}
                <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
              </span>
            </div>
            <p
              className={cn(
                'section-gate-card__description max-w-1/2 leading-relaxed text-base md:text-lg lg:text-xl xl:text-2xl',
                isDarkText ? 'text-white/90' : 'text-white/90',
              )}
            >
              {item.description}
            </p>
          </div>
          <PageDeco
            className="section-gate-card__deco bottom-2 right-2 z-2 opacity-95 [--page-deco-size:100px] md:right-0 md:bottom-0 md:[--page-deco-size:320px]"
            icon={item.decoIcon}
          />
          <span className="section-gate-card__count type-label-s absolute right-4 top-4 z-3 text-white/80 md:right-8 md:top-8">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </Link>
      </motion.div>
    </div>
  )
}
