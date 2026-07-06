'use client'

import type { Media } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Swiper as SwiperInstance } from 'swiper'
import { Autoplay, Pagination } from 'swiper/modules'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'

import { AnimatedCounter } from '@/components/ui/animated-counter'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { cn } from '@/utilities/ui'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export type MainBannerSlide = {
  broadcaster?: string | null
  decorImages?: MainBannerDecorImage[]
  description?: string | null
  desktopImage?: Media | number | string | null
  desktopVideo?: Media | number | string | null
  mobileImage?: Media | number | string | null
  mobileVideo?: Media | number | string | null
  marqueeItems?: MainBannerMarqueeItem[]
  title?: string | null
}

export type MainBannerLinkItem = {
  href: string
  label: string
  type?: 'link'
}

export type MainBannerCardItem = {
  buttonLabel?: string | null
  href: string
  image?: Media | number | string | null
  imageAlt?: string | null
  label: string
  name: string
  roleLabel?: string | null
  type: 'card'
}

export type MainBannerMarqueeItem = MainBannerLinkItem | MainBannerCardItem

export type MainBannerDecorImage = {
  alt?: string | null
  image?: Media | number | string | null
}

export type MainBannerStatisticItem = {
  label: string
  value: number
}

export type MainBannerStatisticGroup = {
  items: MainBannerStatisticItem[]
  title: string
}

export type MainBannerStatistics = {
  groups: MainBannerStatisticGroup[]
  totalWorkCount: number
}

type MainBannerSliderProps = {
  autoplayDelay?: number
  autoplayEnabled?: boolean
  banners: MainBannerSlide[]
  center?: CenterSlug
  statistics?: MainBannerStatistics | null
}

export const DEFAULT_MAIN_BANNER_AUTOPLAY_DELAY = 5000
const scheduleLinkCenters = new Set<CenterSlug>(['art', 'avenue', 'highteen', 'kids'])
const statisticGroupLinks: Record<string, string> = {
  이달의주조연: 'audition-casting',
  이달의조단역: 'casting-confirmed',
}

type MainBannerStyle = CSSProperties & {
  '--section-main-banner-content-bottom-offset': string
  '--section-main-banner-content-gap': string
  '--section-main-banner-copy-bottom-offset': string
  '--section-main-banner-description-size': string
  '--section-main-banner-title-size': string
  '--section-main-banner-title-size-mobile': string
}

function fluidClamp(minSize: number, maxSize: number, minVw = 375, maxVw = 1640, baseFontSize = 16) {
  const slope = (maxSize - minSize) / (maxVw - minVw)
  const intercept = minSize - slope * minVw

  return `clamp(${minSize / baseFontSize}rem, calc(${intercept / baseFontSize}rem + ${slope * 100}vw), ${maxSize / baseFontSize}rem)`
}

const mainBannerStyle: MainBannerStyle = {
  '--section-main-banner-content-bottom-offset': fluidClamp(72, 110, 878, 1341),
  '--section-main-banner-content-gap': fluidClamp(28, 92, 560, 1840),
  '--section-main-banner-copy-bottom-offset': fluidClamp(92, 132, 836, 1200),
  '--section-main-banner-description-size': fluidClamp(15, 18),
  '--section-main-banner-title-size': fluidClamp(44, 68),
  '--section-main-banner-title-size-mobile': fluidClamp(36, 48, 300, 400),
}

const mainBannerOverlayStyle: CSSProperties = {
  background:
    'linear-gradient(90deg, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.48) 48%, rgba(0, 0, 0, 0.2) 100%), rgba(0, 0, 0, 0.22)',
}

export function shouldProfileSetMarquee(profileSetWidth: number, containerWidth: number) {
  if (
    !Number.isFinite(profileSetWidth) ||
    !Number.isFinite(containerWidth) ||
    containerWidth <= 0
  ) {
    return false
  }

  return profileSetWidth > containerWidth
}

function isMedia(value: MainBannerSlide['desktopImage']): value is Media {
  return Boolean(value && typeof value === 'object')
}

function mediaUrl(value: MainBannerSlide['desktopImage']) {
  if (!isMedia(value)) {
    return ''
  }

  return getMediaUrl(value.url || (value.filename ? `/media/${value.filename}` : ''), value.updatedAt)
}

function mediaAlt(value: MainBannerSlide['desktopImage'], fallback: string) {
  return isMedia(value) ? value.alt || fallback : fallback
}

function itemImageUrl(value: MainBannerCardItem['image']) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return mediaUrl(value)
}

function isCardItem(item: MainBannerMarqueeItem): item is MainBannerCardItem {
  return item.type === 'card'
}

function statisticGroupHref(title: string, center?: CenterSlug) {
  const category = statisticGroupLinks[title.replace(/[·\s]/g, '')]

  if (!category) {
    return undefined
  }

  return `/${center ?? 'art'}/news?category=${category}`
}

function useElementVisibility(elementRef: RefObject<HTMLElement | null>) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const element = elementRef.current

    if (!element || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      {
        rootMargin: '160px 0px',
        threshold: 0.05,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef])

  return isVisible
}

function BannerVisual({ banner }: { banner: MainBannerSlide }) {
  const desktopImage = banner.desktopImage
  const mobileImage = banner.mobileImage || desktopImage
  const desktopVideo = banner.desktopVideo
  const mobileVideo = banner.mobileVideo || desktopVideo
  const desktopImageUrl = mediaUrl(desktopImage)
  const mobileImageUrl = mediaUrl(mobileImage)
  const desktopVideoUrl = mediaUrl(desktopVideo)
  const mobileVideoUrl = mediaUrl(mobileVideo)
  const alt = mediaAlt(mobileImage || desktopImage, banner.title || '메인 배너')
  const videoClassName = 'section-main-banner__media absolute inset-0 z-1 h-full w-full object-cover'

  if (desktopVideoUrl || mobileVideoUrl) {
    return (
      <>
        {mobileVideoUrl && (
          <video
            autoPlay
            className={cn(videoClassName, desktopVideoUrl && 'min-[768px]:hidden')}
            loop
            muted
            playsInline
            poster={mobileImageUrl || desktopImageUrl || undefined}
          >
            <source src={mobileVideoUrl} />
          </video>
        )}
        {desktopVideoUrl && (
          <video
            autoPlay
            className={cn(videoClassName, mobileVideoUrl && 'max-[767px]:hidden')}
            loop
            muted
            playsInline
            poster={desktopImageUrl || mobileImageUrl || undefined}
          >
            <source src={desktopVideoUrl} />
          </video>
        )}
      </>
    )
  }

  return (
    <picture>
      {mobileImageUrl && <source media="(max-width: 767px)" srcSet={mobileImageUrl} />}
      <img
        alt={alt}
        className="section-main-banner__media absolute inset-0 z-1 h-full w-full object-cover"
        loading="eager"
        src={desktopImageUrl || mobileImageUrl}
      />
    </picture>
  )
}

function BannerStatisticsPanel({
  center,
  statistics,
}: {
  center?: CenterSlug
  statistics: MainBannerStatistics
}) {
  return (
    <aside
      aria-label="센터 주요 통계"
      className={cn(
        'section-main-banner__stats pointer-events-auto self-end overflow-hidden',
        'bg-black/30 ring-1 ring-inset ring-white/10 backdrop-blur-[10px] rounded-3xl',
      )}
    >
      <BannerTotalStatCell value={statistics.totalWorkCount} variant="desktop" />
      <BannerScheduleStatRow center={center} variant="desktop" />
      {statistics.groups.map((group) => (
        <div
          className="section-main-banner__stat-group border-b border-white/10 last:border-b-0"
          key={group.title}
        >
          <BannerStatisticGroupHead center={center} group={group} />
          <div className="section-main-banner__stat-items grid grid-cols-2 gap-1 px-6 pb-6">
            {group.items.map((item) => (
              <div
                className="section-main-banner__stat-item grid items-center gap-1 border border-white/10 px-2 py-3 text-center rounded-sm"
                key={item.label}
              >
                <span className="text-[14px] font-bold leading-[1.35] text-white/40">
                  {item.label}
                </span>
                <strong className="text-[14px] font-black leading-[1.2]">
                  <AnimatedCounter duration={1.15} startOnMount value={item.value} />명
                </strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}

function BannerTotalStatCell({
  value,
  variant,
}: {
  value: number
  variant: 'desktop' | 'mobile'
}) {
  const isMobile = variant === 'mobile'

  return (
    <div
      className={cn(
        'section-main-banner__stat-total flex items-center justify-between border-b border-white/10',
        isMobile ? 'min-w-0 flex-1 px-5 py-4' : 'px-6 py-5',
      )}
    >
      <span
        className={cn(
          isMobile ? 'text-[14px] font-bold leading-normal' : 'text-[16px] font-black',
        )}
      >
        {isMobile ? '누적작품수' : '누적 작품수'}
      </span>
      <strong
        className={cn(
          'leading-[1.2]',
          isMobile ? 'text-[20px] font-extrabold' : 'text-[24px] font-black',
        )}
      >
        <AnimatedCounter duration={1.4} startOnMount value={value} />
      </strong>
    </div>
  )
}

function BannerStatisticGroupHead({
  center,
  group,
  variant = 'desktop',
}: {
  center?: CenterSlug
  group: MainBannerStatisticGroup
  variant?: 'desktop' | 'mobile'
}) {
  const href = statisticGroupHref(group.title, center)
  const isMobile = variant === 'mobile'
  const content = (
    <>
      <span
        className={cn(
          isMobile ? 'text-[14px] font-bold leading-normal' : 'text-base font-bold',
        )}
      >
        {group.title}
      </span>
      <ChevronRight
        aria-hidden="true"
        className={cn('shrink-0 text-white', isMobile ? 'size-3.5' : 'size-[18px]')}
        strokeWidth={2.4}
      />
    </>
  )
  const className = cn(
    'section-main-banner__stat-group-head flex items-center justify-between text-white transition-colors hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white/70',
    isMobile ? 'w-full gap-3' : 'gap-3 px-6 pb-4 pt-6',
  )

  if (!href) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link className={cn(className, 'cursor-pointer')} href={href}>
      {content}
    </Link>
  )
}

function BannerScheduleStatRow({
  center,
  variant = 'desktop',
}: {
  center?: CenterSlug
  variant?: 'desktop' | 'mobile'
}) {
  const isMobile = variant === 'mobile'
  const content = (
    <>
      <span
        className={cn(
          isMobile
            ? 'text-[14px] font-bold leading-normal'
            : 'text-base font-black leading-[1.2]',
        )}
      >
        이달의 스케줄
      </span>
      <ChevronRight
        aria-hidden="true"
        className={cn('shrink-0', isMobile ? 'size-3.5' : 'size-[18px]')}
        strokeWidth={2.4}
      />
    </>
  )
  const className = cn(
    'section-main-banner__schedule-link flex items-center justify-between border-b border-white/10 text-white transition-colors hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white/70',
    isMobile ? 'min-w-0 flex-1 border-l px-5 py-4' : 'h-[74px] px-6 py-6',
  )

  if (!center || !scheduleLinkCenters.has(center)) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link className={className} href={`/${center}/schedule`}>
      {content}
    </Link>
  )
}

function BannerStatisticsLayer({
  center,
  statistics,
}: {
  center?: CenterSlug
  statistics: MainBannerStatistics
}) {
  return (
    <div className="section-main-banner__stats-layer pointer-events-none absolute inset-0 z-3 max-[768.98px]:hidden">
      <div
        className={cn(
          'container grid min-h-svh items-end',
          'grid-cols-[minmax(0,1fr)_minmax(240px,260px)]',
          'gap-[var(--section-main-banner-content-gap)]',
          'pb-[calc(var(--section-main-banner-marquee-height)+var(--section-main-banner-content-bottom-offset))]',
          'pt-[calc(var(--admin-bar-height,0px)+120px)]',
        )}
      >
        <div aria-hidden="true" />
        <BannerStatisticsPanel center={center} statistics={statistics} />
      </div>
    </div>
  )
}

function BannerMobileStatisticsPanel({
  center,
  statistics,
}: {
  center?: CenterSlug
  statistics: MainBannerStatistics
}) {
  return (
    <aside
      aria-label="센터 주요 통계"
      className="section-main-banner__mobile-stats relative z-3 bg-[#111] text-white min-[769px]:hidden"
    >
      <div className="section-main-banner__mobile-stat-row flex w-full items-stretch">
        <BannerTotalStatCell value={statistics.totalWorkCount} variant="mobile" />
        <BannerScheduleStatRow center={center} variant="mobile" />
      </div>
      <div className="section-main-banner__mobile-stat-groups flex w-full items-stretch">
        {statistics.groups.map((group, index) => (
          <div
            className={cn(
              'section-main-banner__mobile-stat-group flex min-w-0 flex-1 flex-col gap-4 border-b border-white/10 px-5 py-4',
              index > 0 && 'border-l',
            )}
            key={group.title}
          >
            <BannerStatisticGroupHead center={center} group={group} variant="mobile" />
            <div className="section-main-banner__mobile-stat-items flex w-full flex-col gap-1 text-[14px] font-normal leading-normal">
              {group.items.map((item) => (
                <div
                  className="section-main-banner__mobile-stat-item flex w-full items-center justify-between rounded-lg"
                  key={item.label}
                >
                  <span className="min-w-0 pr-2 text-white/40">{item.label}</span>
                  <strong className="shrink-0 font-normal text-white">
                    <AnimatedCounter duration={1.15} startOnMount value={item.value} />명
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function MainBannerFrame({
  center,
  children,
  frameRef,
  isVisible,
  marqueeItems,
  statistics,
}: {
  center?: CenterSlug
  children: ReactNode
  frameRef: RefObject<HTMLDivElement | null>
  isVisible: boolean
  marqueeItems?: MainBannerMarqueeItem[]
  statistics?: MainBannerStatistics | null
}) {
  const currentMarqueeItems = marqueeItems ?? []
  const hasMarqueeItems = currentMarqueeItems.length > 0

  return (
    <div
      className={cn(
        'section-main-banner-shell relative bg-[#111] text-white',
        '[--section-main-banner-marquee-height:140px]',
        'max-[980px]:[--section-main-banner-marquee-height:128px]',
        'max-[640px]:[--section-main-banner-marquee-height:120px]',
      )}
      data-center={center ?? 'art'}
      data-visible={isVisible ? 'true' : 'false'}
      ref={frameRef}
      style={mainBannerStyle}
    >
      <div className="section-main-banner__hero-stack relative min-h-svh overflow-hidden">
        <div className="section-main-banner__kv-layer relative z-1">{children}</div>
        {hasMarqueeItems && <BannerMarquee isActive={isVisible} items={currentMarqueeItems} />}
        {statistics && <BannerStatisticsLayer center={center} statistics={statistics} />}
      </div>
      {statistics && <BannerMobileStatisticsPanel center={center} statistics={statistics} />}
    </div>
  )
}

function BannerDecoLayer({ center }: { center?: CenterSlug }) {
  const decoIcons = getPageDecoIcons(3, `main-banner-${center ?? 'art'}`)

  return (
    <div
      aria-hidden="true"
      className="section-main-banner__deco-layer pointer-events-none absolute inset-x-0 top-0 z-2 h-full overflow-hidden"
    >
      <PageDeco
        className="section-main-banner__deco section-main-banner__deco--top-left left-0 top-0 opacity-95 -translate-x-1/3 -translate-y-1/3 max-w-105 max-h-105"
        icon={decoIcons[2]}
        size="34vw"
      />
      <PageDeco
        className="section-main-banner__deco section-main-banner__deco--bottom-right right-0 bottom-4 translate-x-1/3 opacity-90 max-w-105 max-h-105"
        icon={decoIcons[0]}
        size="34vw"
      />
    </div>
  )
}

type MainBannerLogoItem = {
  alt: string
  src: string
}

function mainBannerLogoItems(images?: MainBannerDecorImage[]): MainBannerLogoItem[] {
  return (images ?? [])
    .map((item) => ({
      alt: String(item.alt ?? '').trim(),
      src: itemImageUrl(item.image),
    }))
    .filter((item) => item.src)
}

function logoGridColumns(count: number) {
  if (count <= 1) {
    return 'grid-cols-1'
  }

  if (count <= 2) {
    return 'grid-cols-2'
  }

  if (count <= 6) {
    return 'grid-cols-3'
  }

  return 'grid-cols-4'
}

function BannerLogoGrid({
  items,
  placement,
}: {
  items: MainBannerLogoItem[]
  placement: 'desktop' | 'mobile'
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'section-main-banner__logo-deco-grid grid w-fit max-w-full place-items-center',
        logoGridColumns(items.length),
        placement === 'desktop'
          ? 'gap-x-5 gap-y-4'
          : 'mt-7 gap-x-4 gap-y-3 max-[640px]:mt-6 max-[640px]:gap-x-3 max-[640px]:gap-y-2.5',
      )}
    >
      {items.map((item, index) => (
        <div
          className={cn(
            'section-main-banner__logo-deco grid place-items-center',
            'drop-shadow-[0_10px_22px_rgba(0,0,0,0.28)]',
            placement === 'desktop'
              ? 'size-15 max-[980px]:size-14'
              : 'size-12 max-[640px]:size-10',
          )}
          key={`${item.src}-${index}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="h-full w-full object-contain"
            loading={index < 4 ? 'eager' : 'lazy'}
            src={item.src}
          />
        </div>
      ))}
    </div>
  )
}

function BannerLogoDecoLayer({ items }: { items: MainBannerLogoItem[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="section-main-banner__logo-deco-layer pointer-events-none absolute inset-0 z-2 overflow-hidden max-[768.98px]:hidden"
    >
      <div
        className={cn(
          'section-main-banner__logo-deco-wrap absolute right-[8vw] top-1/2 -translate-y-1/2',
          'max-w-[min(30vw,340px)]',
          'max-[980px]:right-8 max-[980px]:max-w-[280px]',
        )}
      >
        <BannerLogoGrid items={items} placement="desktop" />
      </div>
    </div>
  )
}

function BannerSlide({
  banner,
  center,
  isSingle = false,
}: {
  banner: MainBannerSlide
  center?: CenterSlug
  isSingle?: boolean
}) {
  const title = String(banner.title ?? '').trim()
  const broadcaster = String(banner.broadcaster ?? '').trim()
  const description = String(banner.description ?? '').trim()
  const logoItems = mainBannerLogoItems(banner.decorImages)

  return (
    <section
      data-center={center}
      className={cn(
        'section-main-banner relative min-h-svh overflow-hidden bg-[#111] text-white',
        isSingle ? 'w-full' : 'h-full',
      )}
    >
      <BannerVisual banner={banner} />
      <div
        className="section-main-banner__overlay absolute inset-0 z-1"
        style={mainBannerOverlayStyle}
      />
      <BannerDecoLayer center={center} />
      <BannerLogoDecoLayer items={logoItems} />
      <div
        className={cn(
          'container section-main-banner__content relative z-3 grid min-h-svh items-end',
          'grid-cols-[minmax(0,1fr)_minmax(240px,260px)]',
          'gap-(--section-main-banner-content-gap)',
          'pb-[calc(var(--section-main-banner-marquee-height)+var(--section-main-banner-content-bottom-offset))]',
          'pt-[calc(var(--admin-bar-height,0)+120px)]',
          'max-[768.98px]:content-end max-[768.98px]:grid-cols-1',
          'max-[768.98px]:pb-[calc(var(--section-main-banner-marquee-height)+84px)]',
          'max-[768.98px]:pt-[calc(var(--admin-bar-height,0)+100px)]',
          'max-[640px]:pb-[calc(var(--section-main-banner-marquee-height)+64px)]',
        )}
      >
        <div className="section-main-banner__copy max-w-50vw max-[768.98px]:mb-6 max-[768.98px]:max-w-[620px] max-[640px]:mb-5 min-[769px]:mb-[var(--section-main-banner-copy-bottom-offset)]">
          {broadcaster && (
            <p
              className={cn(
                'section-main-banner__badge mb-[22px] inline-flex items-center',
                'text-[22px] font-black leading-none',
                center === 'exam'
                  ? 'bg-transparent p-0 text-brand'
                  : 'min-h-8 rounded-full bg-[#78a8ff] px-[13px] py-[5px] text-[#050505] max-[640px]:min-h-7',
                'max-[640px]:text-base',
              )}
            >
              {broadcaster}
            </p>
          )}
          <h2
            className={cn(
              'section-main-banner__title m-0 text-balance font-black leading-[1.05]',
              'text-[length:var(--section-main-banner-title-size)] tracking-normal text-white',
              'max-[640px]:text-[length:var(--section-main-banner-title-size-mobile)]',
            )}
          >
            {title}
          </h2>
          {description && (
            <p
              className={cn(
                'section-main-banner__description mt-[22px] max-w-[480px] font-semibold',
                'text-[length:var(--section-main-banner-description-size)] leading-[1.65] text-white/80',
                'max-[640px]:text-[14px]',
              )}
            >
              {description}
            </p>
          )}
          {logoItems.length > 0 && (
            <div aria-hidden="true" className="section-main-banner__mobile-logo-deco min-[769px]:hidden">
              <BannerLogoGrid items={logoItems} placement="mobile" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function BannerMarquee({ isActive, items }: { isActive: boolean; items: MainBannerMarqueeItem[] }) {
  const cardItems = items.filter(isCardItem)

  if (cardItems.length > 0) {
    return <BannerContentCards isActive={isActive} items={cardItems} />
  }

  return (
    <div className="section-main-banner__link-marquee absolute inset-x-0 bottom-0 z-3 min-h-[auto] overflow-hidden border-t border-white/10 bg-black/35 text-white backdrop-blur-md">
      <div className="container overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="section-main-banner__link-track flex min-w-full w-max gap-2">
          {items.map((item, index) => (
            <Link
              aria-label={item.label}
              className={cn(
                'section-main-banner__link-pill inline-flex h-10 max-w-[76vw] items-center',
                'rounded-full border border-white/20 bg-white/10 px-4',
                'text-[14px] font-bold text-white transition-colors',
                'hover:border-white/45 hover:bg-white/20',
              )}
              href={item.href}
              key={`${item.href}-${item.label}-${index}`}
            >
              <span className="truncate whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function BannerContentCards({ isActive, items }: { isActive: boolean; items: MainBannerCardItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const setRef = useRef<HTMLDivElement | null>(null)
  const [shouldMarquee, setShouldMarquee] = useState(false)
  const shouldAnimate = isActive && shouldMarquee
  const cardSets = shouldMarquee ? [items, items] : [items]

  useEffect(() => {
    const container = containerRef.current
    const set = setRef.current

    if (!container || !set) {
      return
    }

    const updateShouldMarquee = () => {
      setShouldMarquee(shouldProfileSetMarquee(set.scrollWidth, container.clientWidth))
    }

    updateShouldMarquee()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateShouldMarquee)

      return () => {
        window.removeEventListener('resize', updateShouldMarquee)
      }
    }

    const observer = new ResizeObserver(updateShouldMarquee)
    observer.observe(container)
    observer.observe(set)

    return () => {
      observer.disconnect()
    }
  }, [items.length])

  return (
    <div
      className={cn(
        'section-main-banner__profile-marquee absolute inset-x-0 bottom-0 z-3',
        'min-h-[var(--section-main-banner-marquee-height)] overflow-hidden',
        'border-t border-white/10 bg-black/35 text-white backdrop-blur-md',
        'data-[marquee=false]:overflow-x-auto data-[marquee=false]:[scrollbar-width:none]',
        'data-[marquee=false]:[&::-webkit-scrollbar]:hidden',
        'hover:[&_.section-main-banner__profile-set]:[animation-play-state:paused]',
      )}
      data-active={isActive ? 'true' : 'false'}
      data-marquee={shouldMarquee ? 'true' : 'false'}
      ref={containerRef}
    >
      <div
        className={cn(
          'section-main-banner__profile-track flex py-5',
          shouldMarquee ? 'w-max' : 'min-w-full w-full justify-center',
        )}
      >
        {cardSets.map((set, setIndex) => (
          <div
            aria-hidden={setIndex === 1 ? 'true' : undefined}
            className={cn(
              'section-main-banner__profile-set flex min-w-max gap-6',
              shouldMarquee ? 'pl-5' : 'px-5',
              shouldAnimate
                ? 'animate-[section-main-banner-marquee_34s_linear_infinite]'
                : 'animate-none',
              'motion-reduce:animate-none max-[640px]:gap-4',
            )}
            key={setIndex}
            ref={setIndex === 0 ? setRef : undefined}
          >
            {set.map((item, index) => (
              <BannerProfileCard
                duplicate={setIndex === 1}
                index={index}
                item={item}
                key={`${setIndex}-${item.href}-${item.label}-${index}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function BannerProfileCard({
  duplicate,
  index,
  item,
}: {
  duplicate: boolean
  index: number
  item: MainBannerCardItem
}) {
  const imageUrl = itemImageUrl(item.image)
  const name = String(item.name ?? '').trim()
  const roleLabel = String(item.roleLabel ?? '').trim()
  const buttonLabel = String(item.buttonLabel || '자세히 보기').trim()

  return (
    <article className="section-main-banner__profile-card grid h-[100px] w-60 grid-cols-[120px_108px] gap-3 max-[640px]:w-[190px] max-[640px]:grid-cols-[96px_82px]">
      <div
        className={cn(
          'section-main-banner__profile-image h-[100px] w-[120px] overflow-hidden',
          'rounded-xl bg-white/10 max-[640px]:w-24',
          '[&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover',
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={item.imageAlt || name || '프로필'}
            loading={index < 6 ? 'eager' : 'lazy'}
            src={imageUrl}
          />
        ) : (
          <div className="section-main-banner__profile-placeholder h-full w-full bg-white/10" />
        )}
      </div>
      <div className="section-main-banner__profile-body flex min-w-0 flex-col items-start justify-between py-1">
        <div>
          <h3 className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-black leading-normal">
            {name}
          </h3>
          {roleLabel && (
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-bold leading-[1.35] text-white/70">
              {roleLabel}
            </p>
          )}
        </div>
        <Link
          aria-label={`${name || '연결 콘텐츠'} ${buttonLabel}`}
          className="section-main-banner__profile-link inline-flex h-[30px] items-center justify-center rounded-full border border-white/70 px-2.5 text-[12px] font-black leading-none text-white transition-colors hover:border-white hover:bg-white/10"
          href={item.href}
          tabIndex={duplicate ? -1 : undefined}
        >
          <span>{buttonLabel}</span>
        </Link>
      </div>
    </article>
  )
}

function normalizedAutoplayDelay(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_MAIN_BANNER_AUTOPLAY_DELAY
}

export function MainBannerSlider({
  autoplayDelay = DEFAULT_MAIN_BANNER_AUTOPLAY_DELAY,
  autoplayEnabled = true,
  banners,
  center,
  statistics,
}: MainBannerSliderProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeBanner = banners[activeIndex] ?? banners[0]
  const isFrameVisible = useElementVisibility(frameRef)

  useEffect(() => {
    const swiper = swiperRef.current

    if (!swiper?.autoplay) {
      return
    }

    if (autoplayEnabled && isFrameVisible) {
      swiper.autoplay.start()
      return
    }

    swiper.autoplay.stop()
  }, [autoplayEnabled, isFrameVisible])

  if (banners.length === 0) {
    return null
  }

  if (banners.length === 1) {
    return (
      <MainBannerFrame
        center={center}
        frameRef={frameRef}
        isVisible={isFrameVisible}
        marqueeItems={banners[0].marqueeItems ?? []}
        statistics={statistics}
      >
        <BannerSlide banner={banners[0]} center={center} isSingle />
      </MainBannerFrame>
    )
  }

  return (
    <MainBannerFrame
      center={center}
      frameRef={frameRef}
      isVisible={isFrameVisible}
      marqueeItems={activeBanner?.marqueeItems ?? []}
      statistics={statistics}
    >
      <Swiper
        autoplay={
          autoplayEnabled
            ? {
                delay: normalizedAutoplayDelay(autoplayDelay),
                disableOnInteraction: false,
              }
            : false
        }
        className="main-banner-swiper"
        loop
        modules={[Autoplay, Pagination]}
        onRealIndexChange={(swiper) => {
          setActiveIndex(swiper.realIndex)
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper

          if (autoplayEnabled && isFrameVisible) {
            swiper.autoplay.start()
            return
          }

          if (swiper.autoplay) {
            swiper.autoplay.stop()
          }
        }}
        pagination={{
          clickable: true,
        }}
        slidesPerView={1}
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={`${banner.title ?? 'banner'}-${index}`}>
            <BannerSlide banner={banner} center={center} />
          </SwiperSlide>
        ))}
      </Swiper>
    </MainBannerFrame>
  )
}
