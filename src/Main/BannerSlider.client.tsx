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
const PROFILE_MARQUEE_OVERFLOW_RATIO = 1.15

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
        className="section-main-banner__media"
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
        className="section-main-banner__media"
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
    <aside aria-label="센터 주요 통계" className="section-main-banner__stats">
      <div className="section-main-banner__stat-total">
        <span>누적작품수</span>
        <strong>{formatCount(statistics.totalWorkCount)}</strong>
      </div>
      {statistics.groups.map((group) => (
        <div className="section-main-banner__stat-group" key={group.title}>
          <div className="section-main-banner__stat-group-head">
            <span>{group.title}</span>
            <Plus aria-hidden="true" size={18} strokeWidth={3} />
          </div>
          <div className="section-main-banner__stat-items">
            {group.items.map((item) => (
              <div className="section-main-banner__stat-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{formatCount(item.value)}명</strong>
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
        'section-main-banner',
        isSingle ? 'w-full' : 'h-full',
      )}
    >
      <BannerVisual banner={banner} />
      <div className="section-main-banner__overlay" />
      <div className="section-main-banner__brand-block" aria-hidden="true" />
      <div className="section-main-banner__brand-ring" aria-hidden="true" />
      <div className="container section-main-banner__content">
        <div className="section-main-banner__copy">
          {broadcaster && <p className="section-main-banner__badge">{broadcaster}</p>}
          <h2 className="section-main-banner__title">{title}</h2>
          {description && <p className="section-main-banner__description">{description}</p>}
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
    <div className="section-main-banner__link-marquee">
      <div className="container">
        <div className="section-main-banner__link-track">
          {items.map((item, index) => (
            <Link
              aria-label={item.label}
              className="section-main-banner__link-pill"
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
      setShouldMarquee(set.scrollWidth > container.clientWidth * PROFILE_MARQUEE_OVERFLOW_RATIO)
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
      className="section-main-banner__profile-marquee"
      data-marquee={shouldMarquee ? 'true' : 'false'}
      ref={containerRef}
    >
      <div className="section-main-banner__profile-track">
        {cardSets.map((set, setIndex) => (
          <div
            aria-hidden={setIndex === 1 ? 'true' : undefined}
            className="section-main-banner__profile-set gap-6"
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
    <article className="section-main-banner__profile-card">
      <div className="section-main-banner__profile-image">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={item.imageAlt || name || '프로필'}
            loading={index < 6 ? 'eager' : 'lazy'}
            src={imageUrl}
          />
        ) : (
          <div className="section-main-banner__profile-placeholder" />
        )}
      </div>
      <div className="section-main-banner__profile-body items-start">
        <div>
          <h3>{name}</h3>
          {roleLabel && <p>{roleLabel}</p>}
        </div>
        <Link
          aria-label={`${name || '연결 콘텐츠'} ${buttonLabel}`}
          className="section-main-banner__profile-link "
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
