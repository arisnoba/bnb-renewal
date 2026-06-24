'use client'

import { interpolate } from 'flubber'
import { animate, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

export type CenterHomeScreenAppearanceSlide = {
  broadcastLogoAlt: string
  broadcastLogoUrl: string
  href: string
  id: string | number
  meta: string
  performerName: string
  performerRole: string
  profileImageUrl: string
  projectTitle: string
  sceneImageUrl: string
}

type CenterHomeScreenAppearancesProps = {
  fallbackHref: string
  fallbackImageUrl: string
  items: CenterHomeScreenAppearanceSlide[]
}

const screenMaskShapes = [
  {
    id: 'mask-01',
    path: 'm690 0c-41.325 0-80.485 9.29-115.5 25.885v-25.885h-145.69l-282.81 45.855v-45.855h-146v540h145.69l282.81-45.505v45.505h146v-25.885c35.015 16.6 74.175 25.885 115.5 25.885 149.115 0 270-120.885 270-270s-120.885-270-270-270z',
    src: '/assets/common/mask-01.svg',
  },
  {
    id: 'mask-02',
    path: 'm960 539.005-105.175-148.25c62.285-36.335 104.185-103.835 104.185-181.14-.005-115.765-93.855-209.615-209.615-209.615h-749.395v205h40v130h-40v205z',
    src: '/assets/common/mask-02.svg',
  },
  {
    id: 'mask-03',
    path: 'm690 0c-55.505 0-107.095 16.755-150 45.47v-45.47h-225v90h-90v-90h-225v540h540v-45.47c42.905 28.72 94.495 45.47 150 45.47 149.115 0 270-120.885 270-270s-120.885-270-270-270z',
    src: '/assets/common/mask-03.svg',
  },
] as const

const screenMaskViewBox = {
  height: 540,
  width: 960,
}
const initialMaskShape = screenMaskShapes[0]

export function CenterHomeScreenAppearances({ fallbackHref, fallbackImageUrl, items }: CenterHomeScreenAppearancesProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const clipPathId = useId()
  const [mainSwiper, setMainSwiper] = useState<SwiperInstance | null>(null)
  const [maskPath, setMaskPath] = useState<string>(initialMaskShape.path)
  const maskPathRef = useRef<string>(initialMaskShape.path)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const slides = items.length > 0 ? items : [fallbackSlide(fallbackHref, fallbackImageUrl)]
  const shouldSlide = slides.length > 1
  const activeMaskIndex = activeIndex % screenMaskShapes.length
  const activeMaskShape = screenMaskShapes[activeMaskIndex]

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

  useEffect(() => {
    const targetPath = activeMaskShape.path

    if (targetPath === maskPathRef.current) {
      return
    }

    if (prefersReducedMotion) {
      const frame = window.requestAnimationFrame(() => {
        maskPathRef.current = targetPath
        setMaskPath(targetPath)
      })

      return () => window.cancelAnimationFrame(frame)
    }

    const interpolator = interpolate(maskPathRef.current, targetPath, {
      maxSegmentLength: 8,
    })
    const controls = animate(0, 1, {
      duration: 0.72,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (progress) => {
        const nextPath = interpolator(progress)

        maskPathRef.current = nextPath
        setMaskPath(nextPath)
      },
    })

    return () => controls.stop()
  }, [activeMaskShape.path, prefersReducedMotion])

  return (
    <div className="section-center-home-screen__stage mx-auto mt-14 max-w-[1120px] md:mt-[72px]">
      <svg
        className="section-center-home-screen__mask-viewport block aspect-video w-full overflow-hidden"
        data-mask-id={activeMaskShape.id}
        data-mask-src={activeMaskShape.src}
        focusable="false"
        preserveAspectRatio="none"
        viewBox={`0 0 ${screenMaskViewBox.width} ${screenMaskViewBox.height}`}
      >
        <defs>
          <clipPath id={clipPathId}>
            <path d={maskPath} />
          </clipPath>
        </defs>
        <foreignObject clipPath={`url(#${clipPathId})`} height={screenMaskViewBox.height} width={screenMaskViewBox.width}>
          <div className="size-full overflow-hidden bg-neutral-900">
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
                    aria-label={`${item.projectTitle} 출연장면 상세 보기`}
                    className="group section-center-home-screen-feature relative block size-full overflow-hidden bg-neutral-900 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    href={item.href}
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
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/10" />
                    {item.broadcastLogoUrl ? (
                      <span className="absolute left-7 top-6 flex h-32 md:h-20 items-center justify-center md:left-10 md:top-8">
                        <Image
                          alt={item.broadcastLogoAlt}
                          className="h-full w-auto object-contain"
                          height={32}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          sizes="96px"
                          src={item.broadcastLogoUrl}
                          unoptimized
                          width={96}
                        />
                      </span>
                    ) : null}
                    <span className="absolute bottom-8 left-7 right-7 md:bottom-10 md:left-10 md:right-10">
                      <span className="block type-caption-l font-bold leading-[1.35] text-white/70">{item.meta}</span>
                      <span className="mt-2 block max-w-[360px] type-headline-s font-extrabold leading-[1.2] text-white md:type-headline-l">
                        {item.projectTitle}
                      </span>
                      <span className="mt-5 inline-flex items-center gap-4 type-label-m font-bold leading-[1.2] text-white">
                        <ActorThumb imageUrl={item.profileImageUrl} name={item.performerName} size="small" />
                        <span className="grid gap-1">
                          <span>{item.performerName}</span>
                          {item.performerRole ? (
                            <span className="type-caption-l font-semibold leading-[1.35] text-white/80">{item.performerRole}</span>
                          ) : null}
                        </span>
                      </span>
                    </span>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </foreignObject>
      </svg>

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
                    <ActorThumb imageUrl={item.profileImageUrl} isActive={isActive} name={item.performerName} size="large" />
                  </span>
                </button>
              </SwiperSlide>
            )
          })}
        </Swiper>
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
          ? 'size-11 rounded-full object-cover object-center'
          : `size-full object-cover object-center transition duration-300 ${
              isActive ? 'opacity-100 grayscale-0' : 'opacity-45 grayscale group-hover/thumb:opacity-85'
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
