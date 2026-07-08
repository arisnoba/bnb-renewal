'use client'

import { ChevronLeft, ChevronRight, Play, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

export type CenterHomeScreenAppearanceSlide = {
  broadcastLogoAlt: string
  broadcastLogoUrl: string
  href: string
  id: string | number
  meta: string
  openInNewTab?: boolean
  performerName: string
  performerRole: string
  profileImageUrl: string
  projectTitle: string
  sceneImageUrl: string
}

type CenterHomeScreenAppearancesProps = {
  contentType?: 'screen' | 'video'
  fallbackHref: string
  fallbackImageUrl: string
  items: CenterHomeScreenAppearanceSlide[]
  showThumbnails?: boolean
}

const screenMaskShapes = [
  {
    id: 'mask-01',
    src: '/assets/common/mask-01.svg',
  },
  {
    id: 'mask-02',
    src: '/assets/common/mask-02.svg',
  },
  {
    id: 'mask-03',
    src: '/assets/common/mask-03.svg',
  },
] as const

export function CenterHomeScreenAppearances({
  contentType = 'screen',
  fallbackHref,
  fallbackImageUrl,
  items,
  showThumbnails = true,
}: CenterHomeScreenAppearancesProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mainSwiper, setMainSwiper] = useState<SwiperInstance | null>(null)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const slides =
    items.length > 0 ? items : [fallbackSlide(fallbackHref, fallbackImageUrl)]
  const shouldSlide = slides.length > 1
  const activeMaskIndex = activeIndex % screenMaskShapes.length
  const activeMaskShape = screenMaskShapes[activeMaskIndex]
  const isFirstSlide = activeIndex <= 0
  const isLastSlide = activeIndex >= slides.length - 1
  const isVideo = contentType === 'video'

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

  const maskStyle = {
    '--screen-mask-image': `url("${activeMaskShape.src}")`,
  } as CSSProperties

  return (
    <div className="section-center-home-screen__stage relative mx-auto mt-14 md:mt-[72px]">
      <div
        className="section-center-home-screen__mask-viewport relative aspect-video w-full overflow-hidden bg-neutral-900 [-webkit-mask-image:var(--screen-mask-image)] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:100%_100%] [mask-image:var(--screen-mask-image)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:100%_100%]"
        data-mask-id={activeMaskShape.id}
        data-mask-src={activeMaskShape.src}
        style={maskStyle}
      >
        <Swiper
          a11y={{
            nextSlideMessage: '다음 출연장면',
            prevSlideMessage: '이전 출연장면',
          }}
          className="section-center-home-screen__main-swiper size-full"
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
                aria-label={`${item.projectTitle} ${isVideo ? '영상 보기' : '출연장면 상세 보기'}`}
                className="group section-center-home-screen-feature relative block size-full overflow-hidden bg-neutral-900 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                href={item.href}
                rel={item.openInNewTab ? 'noreferrer' : undefined}
                target={item.openInNewTab ? '_blank' : undefined}
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
                  className={
                    isVideo
                      ? 'absolute inset-0 bg-black/35'
                      : 'absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/10'
                  }
                />
                {isVideo ? (
                  <Play
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 fill-white text-white drop-shadow-sm md:size-24"
                    strokeWidth={1.2}
                  />
                ) : null}
                {!isVideo && item.broadcastLogoUrl ? (
                  <span className="absolute left-4 top-5 flex size-12 items-center justify-center md:left-10 md:top-8 md:size-20">
                    <Image
                      alt={item.broadcastLogoAlt}
                      className="size-full object-contain"
                      height={32}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sizes="(max-width: 767px) 48px, 80px"
                      src={item.broadcastLogoUrl}
                      unoptimized
                      width={96}
                    />
                  </span>
                ) : null}
                {!isVideo ? (
                  <span className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10">
                    <span className="block type-caption-l font-bold leading-[1.35] text-white/70">
                      {item.meta}
                    </span>
                    <span className="mt-2 block max-w-[360px] type-title-l font-extrabold leading-[1.2] text-white md:type-headline-l">
                      {item.projectTitle}
                    </span>
                    <span className="mt-5 hidden items-center gap-4 type-label-m font-bold leading-[1.2] text-white md:inline-flex">
                      <ActorThumb
                        imageUrl={item.profileImageUrl}
                        size="small"
                      />
                      <span className="grid gap-1">
                        <span>{item.performerName}</span>
                        {item.performerRole ? (
                          <span className="type-caption-l font-semibold leading-[1.35] text-white/80">
                            {item.performerRole}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </span>
                ) : null}
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {!showThumbnails && shouldSlide ? (
        <>
          <button
            aria-disabled={isFirstSlide}
            aria-label="이전 합격자 후기 영상"
            className="absolute left-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/70 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white data-[disabled=true]:cursor-default data-[disabled=true]:opacity-35 md:left-8 md:size-16"
            data-disabled={isFirstSlide}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()

              if (isFirstSlide) {
                return
              }

              mainSwiper?.slidePrev()
            }}
            type="button"
          >
            <ChevronLeft
              aria-hidden="true"
              className="size-7 md:size-9"
              strokeWidth={1.6}
            />
          </button>
          <button
            aria-disabled={isLastSlide}
            aria-label="다음 합격자 후기 영상"
            className="absolute right-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/70 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white data-[disabled=true]:cursor-default data-[disabled=true]:opacity-35 md:right-8 md:size-16"
            data-disabled={isLastSlide}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()

              if (isLastSlide) {
                return
              }

              mainSwiper?.slideNext()
            }}
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              className="size-7 md:size-9"
              strokeWidth={1.6}
            />
          </button>
        </>
      ) : null}

      {showThumbnails ? (
        <div className="section-center-home-screen__thumb-row mt-10 md:mt-18">
          <Swiper
            className="section-center-home-screen__thumb-swiper w-full min-w-0"
            onSwiper={setThumbsSwiper}
            slidesPerView="auto"
            spaceBetween={8}
            watchSlidesProgress
          >
            {slides.map((item, index) => {
              const isActive = index === activeIndex

              return (
                <SwiperSlide
                  className="h-auto! w-20! transition-[width] duration-300 data-[active=true]:w-28! md:w-[134px]! md:data-[active=true]:w-[225px]!"
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
                        size="large"
                      />
                      {!isVideo ? (
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 block bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 pb-2 pt-8 text-white md:hidden">
                          <span className="block truncate type-caption-l font-bold leading-[1.2]">
                            {item.performerName}
                          </span>
                          {item.performerRole ? (
                            <span className="mt-0.5 block truncate type-caption-s font-semibold leading-[1.2] text-white/80">
                              {item.performerRole}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      ) : null}
    </div>
  )
}

function ActorThumb({
  imageUrl,
  isActive = true,
  size,
}: {
  imageUrl: string
  isActive?: boolean
  size: 'large' | 'small'
}) {
  const [failedImageUrl, setFailedImageUrl] = useState('')

  if (!imageUrl || failedImageUrl === imageUrl) {
    return <ActorThumbFallback isActive={isActive} size={size} />
  }

  return (
    <Image
      alt=""
      className={
        size === 'small'
          ? 'size-11 rounded-full object-cover object-center'
          : `size-full object-cover object-center transition duration-300 ${
              isActive
                ? 'opacity-100 grayscale-0'
                : 'opacity-45 grayscale group-hover/thumb:opacity-85'
            }`
      }
      fill={size === 'large'}
      height={size === 'small' ? 44 : undefined}
      loading="lazy"
      onError={() => setFailedImageUrl(imageUrl)}
      sizes={size === 'small' ? '44px' : '(max-width: 767px) 190px, 225px'}
      src={imageUrl}
      unoptimized
      width={size === 'small' ? 44 : undefined}
    />
  )
}

function ActorThumbFallback({
  isActive,
  size,
}: {
  isActive: boolean
  size: 'large' | 'small'
}) {
  if (size === 'small') {
    return (
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand"
      >
        <UserRound aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`flex size-full items-center justify-center bg-neutral-800 text-white/45 transition duration-300 ${
        isActive ? 'opacity-100' : 'opacity-45 group-hover/thumb:opacity-85'
      }`}
    >
      <UserRound aria-hidden="true" className="size-9 md:size-11" strokeWidth={1.6} />
    </span>
  )
}

function fallbackSlide(
  fallbackHref: string,
  fallbackImageUrl: string,
): CenterHomeScreenAppearanceSlide {
  return {
    broadcastLogoAlt: '',
    broadcastLogoUrl: '',
    href: fallbackHref,
    id: 'fallback-screen-appearance',
    meta: 'DRAMA',
    performerName: '배우앤배움 수강생',
    performerRole: '',
    profileImageUrl: '',
    projectTitle: '배우앤배움 출연장면',
    sceneImageUrl: fallbackImageUrl,
  }
}
