'use client'

import type { Media } from '@/payload-types'

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
  title?: string | null
}

type MainBannerSliderProps = {
  banners: MainBannerSlide[]
}

const AUTOPLAY_DELAY = 5000

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

  return (
    <section
      className={cn(
        'relative isolate min-h-[520px] overflow-hidden bg-neutral-950 text-white md:min-h-[640px]',
        isSingle ? 'w-full' : 'h-full',
      )}
    >
      <BannerVisual banner={banner} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.68),rgba(0,0,0,0.22)_52%,rgba(0,0,0,0.08))]" />
      <div className="container relative z-10 flex min-h-[520px] items-end pb-14 pt-20 md:min-h-[640px] md:pb-20">
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
    </section>
  )
}

export function MainBannerSlider({ banners }: MainBannerSliderProps) {
  if (banners.length === 0) {
    return null
  }

  if (banners.length === 1) {
    return <BannerSlide banner={banners[0]} isSingle />
  }

  return (
    <Swiper
      autoplay={{
        delay: AUTOPLAY_DELAY,
        disableOnInteraction: false,
      }}
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
