'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'

import { PageDeco, type DecoIcon } from '@/components/PageDeco'
import type { CenterSlug } from '@/lib/centers'
import { cn } from '@/utilities/ui'

const MotionPageDeco = motion.create(PageDeco)
const gateHeroMobileSizes = '(max-width: 767px) 100vw, 0px'
const gateHeroDesktopSizes = '(max-width: 767px) 0px, 100vw'
const gateCardMobileSizes = '(max-width: 1023px) 100vw, 0px'
const gateCardDesktopSizes = '(max-width: 1023px) 0px, (min-width: 1920px) 1920px, 100vw'

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
  return (
    <main
      className="page page-dark page-landing page-gate relative isolate overflow-x-hidden bg-black text-white"
      data-center="art"
    >
      <GateSmoothScroll />
      <div className="section-gate-shell relative z-0 mx-auto flex w-full flex-col">
        <GateHero />
        <section className="section-gate-centers relative z-10 mt-[100svh] grid w-full gap-3 px-6 pb-12">
          {items.map((item, index) => (
            <GateCenterCard index={index} item={item} key={item.href} />
          ))}
        </section>
      </div>
    </main>
  )
}

function GateSmoothScroll() {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    let frameId = 0
    let isMounted = true
    let lenis: { destroy: () => void; raf: (time: number) => void } | undefined

    const tick = (time: number) => {
      lenis?.raf(time)
      frameId = window.requestAnimationFrame(tick)
    }

    void import('lenis').then(({ default: Lenis }) => {
      if (!isMounted) {
        return
      }

      lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 0.9,
      })
      frameId = window.requestAnimationFrame(tick)
    })

    return () => {
      isMounted = false
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      lenis?.destroy()
    }
  }, [prefersReducedMotion])

  return null
}

function GateHero() {
  const { scrollY } = useScroll()
  const heroContentOpacity = useTransform(scrollY, [80, 420], [1, 0])
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
        sizes={gateHeroMobileSizes}
        src="/assets/gate/hero-mobile.png"
      />
      <Image
        alt=""
        aria-hidden="true"
        className="hidden object-cover object-top md:block pointer-events-none"
        fill
        priority
        sizes={gateHeroDesktopSizes}
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
      <motion.div
        className="section-gate-hero__content pointer-events-none absolute left-1/2 top-1/2 z-2 -translate-x-1/2 -translate-y-1/2 text-center"
        style={{ opacity: heroContentOpacity }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-balance font-extrabold leading-tight tracking-normal text-white">
          꿈을 발견하고,
          <br />
          가능성을 키워가는 곳
        </h1>
        <p className="mt-7 text-xl font-semibold text-white md:mt-10 lg:text-2xl xl:text-3xl">
          배우앤배움의 모든 교육 과정을 만나보세요
        </p>
      </motion.div>
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
}

function GateCenterCard({ index, item }: GateCenterCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const isDarkText = item.textTone === 'dark'
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
    target: cardRef,
  })
  const decoY = useTransform(scrollYProgress, [0, 1], [-36, 48])
  const title = `배우앤배움 ${item.title}`

  return (
    <Link
      className="section-gate-card section-gate-card-stack group relative mx-auto block aspect-375/460 max-h-200 min-h-115 w-full max-w-480 overflow-hidden rounded-lg bg-[#111] text-left shadow-2xl outline-none md:aspect-auto lg:aspect-video xl:aspect-auto xl:min-h-160"
      data-center={item.center}
      href={item.href}
      ref={cardRef}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none object-cover lg:hidden"
        fill
        loading={index === 0 ? 'eager' : 'lazy'}
        sizes={gateCardMobileSizes}
        src={item.mobileImage}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none hidden object-cover lg:block"
        fill
        loading={index === 0 ? 'eager' : 'lazy'}
        sizes={gateCardDesktopSizes}
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
      <div className="pointer-events-none absolute inset-0 z-3 flex flex-col justify-between p-6 md:p-12 lg:p-14 xl:p-20">
        <div className="section-gate-card__headline">
          <h2 className="whitespace-pre-line text-4xl font-extrabold leading-tight tracking-normal text-brand md:text-5xl lg:text-6xl xl:text-7xl">
            {title.replace(' ', '\n')}
          </h2>
          <span className="mt-8 inline-flex items-center gap-1.5 text-xl font-bold text-brand lg:mt-10">
            {item.cta}
            <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.4} />
          </span>
        </div>
        <p className="section-gate-card__description max-w-2/3 text-xs leading-relaxed text-white/90 md:max-w-1/2 md:text-base lg:text-lg xl:text-2xl">
          {item.description}
        </p>
      </div>
      <MotionPageDeco
        className="section-gate-card__deco bottom-2 right-2 z-2 opacity-95 [--page-deco-size:100px]! md:right-0 md:bottom-0 md:[--page-deco-size:180px]! lg:[--page-deco-size:220px]! xl:[--page-deco-size:320px]!"
        icon={item.decoIcon}
        parallax="card-reverse"
        style={prefersReducedMotion ? undefined : { y: decoY }}
      />
    </Link>
  )
}
