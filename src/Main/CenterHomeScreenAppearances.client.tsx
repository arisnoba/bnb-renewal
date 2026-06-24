'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

export type CenterHomeScreenAppearanceSlide = {
  href: string
  id: string | number
  meta: string
  performer: string
  profileImageUrl: string
  projectTitle: string
  sceneImageUrl: string
}

type CenterHomeScreenAppearancesProps = {
  fallbackHref: string
  fallbackImageUrl: string
  items: CenterHomeScreenAppearanceSlide[]
}

const maskStyle: CSSProperties = {
  WebkitMaskImage: 'url(/assets/common/mask-01.svg)',
  WebkitMaskPosition: 'center',
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskImage: 'url(/assets/common/mask-01.svg)',
  maskPosition: 'center',
  maskRepeat: 'no-repeat',
  maskSize: '100% 100%',
}

export function CenterHomeScreenAppearances({
  fallbackHref,
  fallbackImageUrl,
  items,
}: CenterHomeScreenAppearancesProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mainSwiper, setMainSwiper] = useState<SwiperInstance | null>(null)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const slides = items.length > 0 ? items : [fallbackSlide(fallbackHref, fallbackImageUrl)]
  const shouldSlide = slides.length > 1

  const setActiveSlide = useCallback(
    (index: number) => {
      setActiveIndex(index)
      thumbsSwiper?.slideTo(Math.max(index - 1, 0))
    },
    [thumbsSwiper],
  )

  useEffect(() => {
    thumbsSwiper?.update()
  }, [activeIndex, thumbsSwiper])

  return (
    <div className="section-center-home-screen__stage mx-auto mt-14 max-w-[1120px] md:mt-[72px]">
      <div className="relative">
        <Swiper
          a11y={{
            nextSlideMessage: '다음 출연장면',
            prevSlideMessage: '이전 출연장면',
          }}
          className="section-center-home-screen__main-swiper"
          keyboard={{ enabled: shouldSlide }}
          modules={[A11y, Keyboard]}
          onResize={(swiper) => setActiveSlide(swiper.realIndex)}
          onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
          onSwiper={setMainSwiper}
          slidesPerView={1}
        >
          {slides.map((item, index) => (
            <SwiperSlide key={item.id}>
              <Link
                aria-label={`${item.projectTitle} 출연장면 상세 보기`}
                className="group section-center-home-screen-feature relative block aspect-[16/9] overflow-hidden bg-neutral-900 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                href={item.href}
                style={maskStyle}
              >
                <Image
                  alt=""
                  className="size-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.025] group-hover:opacity-90"
                  fill
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="(max-width: 767px) calc(100vw - 40px), 1120px"
                  src={item.sceneImageUrl || fallbackImageUrl}
                  unoptimized
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/10"
                />
                <span className="absolute bottom-8 left-7 right-7 md:bottom-10 md:left-10 md:right-10">
                  <span className="block type-caption-l font-bold leading-[1.35] text-white/70">
                    {item.meta}
                  </span>
                  <span className="mt-2 block max-w-[360px] type-headline-s font-extrabold leading-[1.2] text-white md:type-headline-l">
                    {item.projectTitle}
                  </span>
                  <span className="mt-5 inline-flex items-center gap-4 type-label-m font-bold leading-[1.2] text-white">
                    <ActorThumb imageUrl={item.profileImageUrl} name={item.performer} size="small" />
                    <span>{item.performer}</span>
                  </span>
                </span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="section-center-home-screen__thumb-row mt-10 grid gap-8 md:mt-[72px] md:grid-cols-[1fr_auto] md:items-end">
        <Swiper
          className="section-center-home-screen__thumb-swiper min-w-0"
          onSwiper={setThumbsSwiper}
          slidesPerView="auto"
          spaceBetween={16}
          watchSlidesProgress
        >
          {slides.map((item, index) => {
            const isActive = index === activeIndex

            return (
              <SwiperSlide
                className="!h-auto !w-[124px] transition-[width] duration-300 data-[active=true]:!w-[190px] md:!w-[134px] md:data-[active=true]:!w-[225px]"
                data-active={isActive}
                key={`thumb-${item.id}`}
              >
                <button
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={`${item.projectTitle} 출연장면 보기`}
                  className="group/thumb block w-full text-left outline-none"
                  onClick={() => {
                    mainSwiper?.slideTo(index)
                    setActiveSlide(index)
                  }}
                  type="button"
                >
                  <span
                    className="relative block aspect-[4/5] w-full overflow-hidden bg-neutral-900 transition data-[active=true]:aspect-square"
                    data-active={isActive}
                  >
                    <ActorThumb
                      imageUrl={item.profileImageUrl}
                      isActive={isActive}
                      name={item.performer}
                      size="large"
                    />
                  </span>
                  <span
                    className="mt-4 hidden data-[active=true]:block"
                    data-active={isActive}
                  >
                    <span className="block type-title-s font-bold leading-normal text-white">
                      {item.performer}
                    </span>
                    <span className="mt-2 block line-clamp-1 type-caption-l font-medium leading-[1.35] text-white/35">
                      {item.meta} [{item.projectTitle}]
                    </span>
                  </span>
                </button>
              </SwiperSlide>
            )
          })}
        </Swiper>

        {shouldSlide && (
          <div className="section-center-home-screen__actions flex items-center gap-4 md:pb-9">
            <button
              aria-label="이전 출연장면"
              className="inline-flex size-14 items-center justify-center rounded-full border border-white/45 text-white transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:size-16"
              onClick={() => mainSwiper?.slidePrev()}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={1.8} />
            </button>
            <button
              aria-label="다음 출연장면"
              className="inline-flex size-14 items-center justify-center rounded-full border border-white/20 text-white/45 transition hover:border-white hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:size-16"
              onClick={() => mainSwiper?.slideNext()}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-6" strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ActorThumb({
  imageUrl,
  isActive = true,
  name,
  size,
}: {
  imageUrl: string
  isActive?: boolean
  name: string
  size: 'large' | 'small'
}) {
  if (!imageUrl) {
    return (
      <span
        className={
          size === 'small'
            ? 'flex size-11 shrink-0 items-center justify-center rounded-full bg-white type-label-m font-bold text-brand'
            : 'flex size-full items-center justify-center bg-neutral-800 type-title-l font-bold text-white/45'
        }
      >
        {name.slice(0, 1)}
      </span>
    )
  }

  return (
    <Image
      alt=""
      className={
        size === 'small'
          ? 'size-11 rounded-full object-cover object-top'
          : `size-full object-cover object-top transition duration-300 ${
              isActive
                ? 'opacity-100 grayscale-0'
                : 'opacity-45 grayscale group-hover/thumb:opacity-85'
            }`
      }
      fill={size === 'large'}
      height={size === 'small' ? 44 : undefined}
      loading="lazy"
      sizes={size === 'small' ? '44px' : '(max-width: 767px) 190px, 225px'}
      src={imageUrl}
      unoptimized
      width={size === 'small' ? 44 : undefined}
    />
  )
}

function fallbackSlide(fallbackHref: string, fallbackImageUrl: string): CenterHomeScreenAppearanceSlide {
  return {
    href: fallbackHref,
    id: 'fallback-screen-appearance',
    meta: 'DRAMA',
    performer: '배우앤배움 수강생',
    profileImageUrl: '',
    projectTitle: '배우앤배움 출연장면',
    sceneImageUrl: fallbackImageUrl,
  }
}
