'use client'

import type { Media } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Autoplay, Pagination } from 'swiper/modules'
import { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'

import { cn } from '@/utilities/ui'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export type MainBannerSlide = {
  broadcaster?: string | null
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

  if (desktopVideoUrl || mobileVideoUrl) {
    return (
      <video
        autoPlay
        className="section-main-banner__media absolute inset-0 h-full w-full object-cover"
        loop
        muted
        playsInline
        poster={mobileImageUrl || desktopImageUrl || undefined}
      >
        {mobileVideoUrl && <source media="(max-width: 767px)" src={mobileVideoUrl} />}
        {desktopVideoUrl && <source src={desktopVideoUrl} />}
      </video>
    )
  }

  return (
    <picture>
      {mobileImageUrl && <source media="(max-width: 767px)" srcSet={mobileImageUrl} />}
      <img
        alt={alt}
        className="section-main-banner__media absolute inset-0 h-full w-full object-cover"
        loading="eager"
        src={desktopImageUrl || mobileImageUrl}
      />
    </picture>
  )
}

function formatCount(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value)
}

function BannerStatisticsPanel({ statistics }: { statistics: MainBannerStatistics }) {
  return (
    <aside
      aria-label="센터 주요 통계"
      className={cn(
        'section-main-banner__stats relative z-10 self-end overflow-hidden rounded-2xl',
        'border border-white/10 bg-black/60 shadow-[0_22px_44px_rgba(0,0,0,0.36)]',
        'max-[980px]:hidden',
      )}
    >
      <div className="section-main-banner__stat-total flex min-h-[74px] items-center justify-between border-b border-white/10 px-6 py-[18px]">
        <span className="text-[16px] font-black">누적작품수</span>
        <strong className="text-[26px] font-black leading-none">
          {formatCount(statistics.totalWorkCount)}
        </strong>
      </div>
      {statistics.groups.map((group) => (
        <div
          className="section-main-banner__stat-group grid gap-3.5 border-b border-white/10 px-6 pb-6 pt-5 last:border-b-0"
          key={group.title}
        >
          <div className="section-main-banner__stat-group-head flex items-center gap-2.5">
            <span className="text-[16px] font-black">{group.title}</span>
            <Plus
              aria-hidden="true"
              className="rounded-full bg-white p-[3px] text-[#111]"
              size={18}
              strokeWidth={3}
            />
          </div>
          <div className="section-main-banner__stat-items grid grid-cols-2 gap-1">
            {group.items.map((item) => (
              <div
                className="section-main-banner__stat-item grid min-h-16 items-center gap-[5px] rounded-md border border-white/10 px-2 py-2.5 text-center"
                key={item.label}
              >
                <span className="text-[13px] font-bold leading-[1.35] text-white/60">
                  {item.label}
                </span>
                <strong className="text-[15px] font-black leading-none">
                  {formatCount(item.value)}명
                </strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}

function BannerSlide({
  banner,
  center,
  isSingle = false,
  statistics,
}: {
  banner: MainBannerSlide
  center?: CenterSlug
  isSingle?: boolean
  statistics?: MainBannerStatistics | null
}) {
  const title = String(banner.title ?? '').trim()
  const broadcaster = String(banner.broadcaster ?? '').trim()
  const description = String(banner.description ?? '').trim()
  const marqueeItems = banner.marqueeItems ?? []

  return (
    <section
      data-center={center}
      className={cn(
        'section-main-banner relative isolate min-h-svh overflow-hidden bg-[#111] text-white',
        isSingle ? 'w-full' : 'h-full',
      )}
    >
      <BannerVisual banner={banner} />
      <div className="section-main-banner__overlay absolute inset-0 z-1" />
      <div
        className={cn(
          'section-main-banner__brand-block absolute left-0 top-0 z-2',
          'h-[var(--section-main-banner-brand-block-height)]',
          'w-[var(--section-main-banner-brand-block-width)] bg-brand',
          'max-[980px]:opacity-[0.86]',
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'section-main-banner__brand-ring absolute bottom-[-4%] right-[-3%] z-2',
          'size-[var(--section-main-banner-brand-ring-size)] rounded-full',
          'border-[length:var(--section-main-banner-brand-ring-border)] border-brand',
          'max-[980px]:right-[-18%] max-[980px]:opacity-[0.72]',
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'container section-main-banner__content relative z-10 grid min-h-svh items-end',
          'grid-cols-[minmax(0,1fr)_minmax(240px,260px)]',
          'gap-[var(--section-main-banner-content-gap)]',
          'pb-[calc(var(--section-main-banner-marquee-height)+var(--section-main-banner-content-bottom-offset))]',
          'pt-[calc(var(--admin-bar-height,0px)+120px)]',
          'max-[980px]:content-end max-[980px]:grid-cols-1',
          'max-[980px]:pb-[calc(var(--section-main-banner-marquee-height)+84px)]',
          'max-[980px]:pt-[calc(var(--admin-bar-height,0px)+100px)]',
          'max-[640px]:pb-[calc(var(--section-main-banner-marquee-height)+64px)]',
        )}
      >
        <div className="section-main-banner__copy max-w-[520px] max-[980px]:max-w-[620px] min-[981px]:mb-[var(--section-main-banner-copy-bottom-offset)]">
          {broadcaster && (
            <p
              className={cn(
                'section-main-banner__badge mb-[22px] inline-flex min-h-8 items-center',
                'rounded-full bg-[#78a8ff] px-[13px] py-[5px]',
                'text-[22px] font-black leading-none text-[#050505]',
                'max-[640px]:min-h-7 max-[640px]:text-[16px]',
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
        </div>
        {statistics && <BannerStatisticsPanel statistics={statistics} />}
      </div>
      {marqueeItems.length > 0 && <BannerMarquee items={marqueeItems} />}
    </section>
  )
}

function BannerMarquee({ items }: { items: MainBannerMarqueeItem[] }) {
  const cardItems = items.filter(isCardItem)

  if (cardItems.length > 0) {
    return <BannerContentCards items={cardItems} />
  }

  return (
    <div className="section-main-banner__link-marquee absolute inset-x-0 bottom-0 z-20 overflow-hidden border-t border-white/10 bg-black/35 text-white backdrop-blur-md">
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

function BannerContentCards({ items }: { items: MainBannerCardItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const setRef = useRef<HTMLDivElement | null>(null)
  const [shouldMarquee, setShouldMarquee] = useState(false)
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
        'section-main-banner__profile-marquee absolute inset-x-0 bottom-0 z-20',
        'min-h-[var(--section-main-banner-marquee-height)] overflow-hidden',
        'border-t border-white/10 bg-black/35 text-white backdrop-blur-md',
        'data-[marquee=false]:overflow-x-auto data-[marquee=false]:[scrollbar-width:none]',
        'data-[marquee=false]:[&::-webkit-scrollbar]:hidden',
      )}
      data-marquee={shouldMarquee ? 'true' : 'false'}
      ref={containerRef}
    >
      <div className="section-main-banner__profile-track flex w-max py-5">
        {cardSets.map((set, setIndex) => (
          <div
            aria-hidden={setIndex === 1 ? 'true' : undefined}
            className="section-main-banner__profile-set flex min-w-max gap-6 pl-5 max-[640px]:gap-4"
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
  if (banners.length === 0) {
    return null
  }

  if (banners.length === 1) {
    return <BannerSlide banner={banners[0]} center={center} isSingle statistics={statistics} />
  }

  return (
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
      pagination={{
        clickable: true,
      }}
      slidesPerView={1}
    >
      {banners.map((banner, index) => (
        <SwiperSlide key={`${banner.title ?? 'banner'}-${index}`}>
          <BannerSlide banner={banner} center={center} statistics={statistics} />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
