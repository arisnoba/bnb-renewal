'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { Media } from '@/components/Media/Renderer'
import type { Media as PayloadMedia } from '@/payload-types'
import { cn } from '@/utilities/ui'

type CurriculumClassroomGalleryProps = {
  className?: string
  photos: PayloadMedia[]
  title: string
}

export function CurriculumClassroomGallery({
  className,
  photos,
  title,
}: CurriculumClassroomGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)

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
    <div
      className={cn(
        'relative aspect-[16/8.4] w-full overflow-hidden bg-neutral-300',
        className,
      )}
    >
      <Swiper
        a11y={{
          nextSlideMessage: '다음 강의실 사진',
          prevSlideMessage: '이전 강의실 사진',
        }}
        className="section-curriculum-detail__classroom-swiper size-full"
        keyboard={{ enabled: true }}
        modules={[A11y, Keyboard]}
        onResize={updateState}
        onSlideChange={updateState}
        onSwiper={handleSwiper}
        slidesPerView={1}
      >
        {photos.map((photo, index) => (
          <SwiperSlide className="relative" key={photo.id}>
            <Media
              alt={index === 0 ? title : `${title} 사진 ${index + 1}`}
              fill
              htmlElement={null}
              imgClassName="size-full object-cover"
              pictureClassName="block size-full"
              priority={index === 0}
              resource={photo}
              size="(max-width: 1023px) calc(100vw - 40px), 748px"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-black/10" />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="pointer-events-none absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between gap-4">
        <GalleryButton ariaLabel="이전 강의실 사진" onClick={() => swiper?.slidePrev()}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.2} />
        </GalleryButton>
        <GalleryButton ariaLabel="다음 강의실 사진" onClick={() => swiper?.slideNext()}>
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.2} />
        </GalleryButton>
      </div>

      <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 type-label-m font-bold text-white/55 backdrop-blur">
        <span className="text-white">{String(activeIndex + 1)}</span>
        <span aria-hidden="true">/</span>
        <span>{String(photos.length)}</span>
      </p>
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
      className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-white/45 bg-black/20 text-white backdrop-blur transition hover:border-white hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:size-11"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
