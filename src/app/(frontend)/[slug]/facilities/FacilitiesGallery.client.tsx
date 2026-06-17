'use client'

import type { Swiper as SwiperInstance } from 'swiper'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { A11y, FreeMode, Keyboard, Thumbs } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { cn } from '@/utilities/ui'

import type { FacilityImage } from './facilityImages'

type FacilitiesGalleryProps = {
  images: FacilityImage[]
}

export function FacilitiesGallery({ images }: FacilitiesGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const activeThumbsSwiper = thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null

  const updateState = useCallback((instance: SwiperInstance) => {
    setActiveIndex(instance.realIndex)
  }, [])

  const handleSwiper = useCallback(
    (instance: SwiperInstance) => {
      setSwiper(instance)
      updateState(instance)
    },
    [updateState],
  )

  return (
    <div className="section-facilities-gallery__body">
      <div className="section-facilities-gallery__frame mx-auto w-full max-w-280">
        <div className="relative">
          <Swiper
            a11y={{
              nextSlideMessage: '다음 시설 이미지',
              prevSlideMessage: '이전 시설 이미지',
            }}
            className="section-facilities-gallery__swiper"
            keyboard={{
              enabled: true,
            }}
            loop={images.length > 2}
            modules={[A11y, Keyboard, Thumbs]}
            onResize={updateState}
            onSlideChange={updateState}
            onSwiper={handleSwiper}
            slidesPerView={1}
            spaceBetween={0}
            thumbs={{ swiper: activeThumbsSwiper }}
          >
            {images.map((image, index) => (
              <SwiperSlide key={image.id}>
                <figure className="section-facilities-gallery__figure relative aspect-[1120/640] overflow-hidden bg-neutral-900">
                  <Image
                    alt={image.alt}
                    className="section-facilities-gallery__image size-full object-cover"
                    fill
                    {...(index === 0 ? { priority: true } : { loading: 'lazy' as const })}
                    sizes="(max-width: 767px) calc(100vw - 40px), 1120px"
                    src={image.src}
                  />
                </figure>
              </SwiperSlide>
            ))}
          </Swiper>
          <p className="section-facilities-gallery__pagination absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 type-label-m font-bold text-white/55 backdrop-blur md:bottom-5">
            <span className="text-white">{String(activeIndex + 1)}</span>
            <span aria-hidden="true">/</span>
            <span>{String(images.length)}</span>
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-5 top-[calc((100vw-40px)*0.285)] z-10 flex -translate-y-1/2 items-center justify-between gap-4 md:inset-x-[calc((100vw-1120px)/2+20px)] md:top-80">
        <GalleryButton
          ariaLabel="이전 시설 이미지"
          onClick={() => swiper?.slidePrev()}
        >
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.2} />
        </GalleryButton>
        <GalleryButton
          ariaLabel="다음 시설 이미지"
          onClick={() => swiper?.slideNext()}
        >
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.2} />
        </GalleryButton>
      </div>

      <div className="section-facilities-gallery__thumbs-frame mx-auto mt-8 w-full max-w-280 md:mt-10">
        <Swiper
          className="section-facilities-gallery__thumbs"
          freeMode
          loop={images.length > 2}
          modules={[FreeMode, Thumbs]}
          onSwiper={setThumbsSwiper}
          breakpoints={{
            768: {
              slidesPerView: 7,
              spaceBetween: 12,
            },
            1024: {
              slidesPerView: 9,
              spaceBetween: 12,
            },
          }}
          slidesPerView={4}
          spaceBetween={12}
          watchSlidesProgress
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id}>
              <button
                aria-label={`${index + 1}번째 시설 이미지 보기`}
                className={cn(
                  'group relative block aspect-square w-full overflow-hidden bg-neutral-900 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:aspect-[110/109]',
                  activeIndex === index
                    ? 'rounded-full opacity-100'
                    : 'rounded-md opacity-40 hover:opacity-75',
                )}
                type="button"
              >
                <Image
                  alt=""
                  className="size-full object-cover transition duration-200 group-hover:scale-[1.025]"
                  fill
                  loading="lazy"
                  sizes="(max-width: 767px) 88px, 110px"
                  src={image.src}
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

function GalleryButton({
  ariaLabel,
  children,
  onClick,
}: {
  ariaLabel: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur transition hover:border-white hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:size-13"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
