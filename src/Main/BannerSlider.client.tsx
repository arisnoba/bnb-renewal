'use client'

import type { Media } from '@/payload-types'

import Link from 'next/link'
import { Autoplay } from 'swiper/modules'
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

type MainBannerSliderProps = {
  autoplayDelay?: number
  autoplayEnabled?: boolean
  banners: MainBannerSlide[]
}

export const DEFAULT_MAIN_BANNER_AUTOPLAY_DELAY = 5000

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
        className="absolute inset-0 h-full w-full object-cover"
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
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        src={desktopImageUrl || mobileImageUrl}
      />
    </picture>
  )
}

function BannerSlide({ banner, isSingle = false }: { banner: MainBannerSlide; isSingle?: boolean }) {
  const title = String(banner.title ?? '').trim()
  const broadcaster = String(banner.broadcaster ?? '').trim()
  const description = String(banner.description ?? '').trim()
  const marqueeItems = banner.marqueeItems ?? []
  const hasCardItems = marqueeItems.some(isCardItem)

  return (
    <section
      className={cn(
        'relative isolate min-h-[520px] overflow-hidden bg-neutral-950 text-white md:min-h-[640px]',
        isSingle ? 'w-full' : 'h-full',
      )}
    >
      <BannerVisual banner={banner} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.68),rgba(0,0,0,0.22)_52%,rgba(0,0,0,0.08))]" />
      <div
        className={cn(
          'container relative z-10 flex min-h-[520px] items-end pt-20 md:min-h-[640px]',
          hasCardItems
            ? 'pb-64 md:pb-72'
            : marqueeItems.length > 0
              ? 'pb-28 md:pb-32'
              : 'pb-14 md:pb-20',
        )}
      >
        <div className="max-w-3xl">
          {broadcaster && (
            <p className="mb-4 text-sm font-semibold uppercase text-white/70">
              {broadcaster}
            </p>
          )}
          <h2 className="text-balance text-4xl font-semibold leading-tight md:text-6xl">{title}</h2>
          {description && (
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 md:text-lg">
              {description}
            </p>
          )}
        </div>
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
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/15 bg-black/35 text-white backdrop-blur-sm">
      <div className="container overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full gap-2 pr-4">
          {items.map((item, index) => (
            <Link
              aria-label={item.label}
              className="inline-flex h-10 max-w-[76vw] shrink-0 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:border-white/45 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:max-w-none"
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
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/30 text-white backdrop-blur-sm">
      <div className="container overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full gap-3 pr-4">
          {items.map((item, index) => {
            const imageUrl = itemImageUrl(item.image)
            const name = String(item.name ?? '').trim()
            const roleLabel = String(item.roleLabel ?? '').trim()
            const buttonLabel = String(item.buttonLabel || '자세히 보기').trim()

            return (
              <article
                className="w-[112px] shrink-0 border border-white/15 bg-black/78 shadow-[0_14px_30px_rgba(0,0,0,0.35)] md:w-[128px]"
                key={`${item.href}-${item.label}-${index}`}
              >
                <div className="aspect-[4/5] overflow-hidden bg-white/8">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={item.imageAlt || name || '프로필'}
                      className="h-full w-full object-cover"
                      loading="eager"
                      src={imageUrl}
                    />
                  ) : (
                    <div className="h-full w-full bg-white/10" />
                  )}
                </div>
                <div className="px-2.5 pb-2.5 pt-2 text-center">
                  <h3 className="truncate text-xs font-bold leading-4 text-white">{name}</h3>
                  {roleLabel && (
                    <p className="mt-0.5 truncate text-[11px] font-medium leading-4 text-white/72">
                      {roleLabel}
                    </p>
                  )}
                  <Link
                    aria-label={`${name || '연결 콘텐츠'} ${buttonLabel}`}
                    className="mt-2 inline-flex h-7 w-full items-center justify-center border border-white/65 px-2 text-[11px] font-bold leading-none text-white transition-colors hover:border-white hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    href={item.href}
                  >
                    <span>{buttonLabel}</span>
                    <span className="ml-1 text-red-500" aria-hidden="true">
                      &gt;
                    </span>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
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
}: MainBannerSliderProps) {
  if (banners.length === 0) {
    return null
  }

  if (banners.length === 1) {
    return <BannerSlide banner={banners[0]} isSingle />
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
      modules={[Autoplay]}
      slidesPerView={1}
    >
      {banners.map((banner, index) => (
        <SwiperSlide key={`${banner.title ?? 'banner'}-${index}`}>
          <BannerSlide banner={banner} />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
