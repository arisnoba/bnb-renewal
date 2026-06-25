'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

export type CenterHomeArtistCareItem = {
  category: string
  description: string
  href: string
  imageUrl: string
  title: string
}

type CenterHomeArtistCareProps = {
  items: CenterHomeArtistCareItem[]
}

export function CenterHomeArtistCare({ items }: CenterHomeArtistCareProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)
  const shouldSlide = items.length > 1

  return (
    <div className="section-center-home-care__stage mt-10 md:mt-0">
      <div className="section-center-home-care__controls hidden mb-8 justify-start gap-5 md:flex md:-mt-16 md:mb-16 md:justify-end">
        <ArtistCareControl ariaLabel="이전 배우 케어 보기" onClick={() => swiper?.slidePrev()}>
          <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
        </ArtistCareControl>
        <ArtistCareControl ariaLabel="다음 배우 케어 보기" onClick={() => swiper?.slideNext()}>
          <ChevronRight aria-hidden="true" className="size-6" strokeWidth={2} />
        </ArtistCareControl>
      </div>

      <Swiper
        a11y={{
          nextSlideMessage: '다음 배우 케어',
          prevSlideMessage: '이전 배우 케어',
        }}
        breakpoints={{
          768: {
            spaceBetween: 40,
          },
        }}
        className="section-center-home-care__swiper h-92! overflow-visible! md:h-110! [&_.swiper-wrapper]:items-center"
        keyboard={{ enabled: shouldSlide }}
        modules={[A11y, Keyboard]}
        onSwiper={setSwiper}
        slidesPerView="auto"
        spaceBetween={20}
      >
        {items.map((item, index) => {
          const isExpanded = index === hoverIndex

          return (
            <SwiperSlide
              className="flex! h-full! w-72! items-center! md:w-[calc((100%-80px)/3)]!"
              data-expanded={isExpanded}
              key={item.title}
            >
              <Link
                aria-label={`${item.title} 바로가기`}
                className="group/care section-center-home-care-card relative block h-72 w-full overflow-hidden rounded-[999px] bg-neutral-900 text-white outline-none ring-white/25 transition-[height,border-radius,background-color,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 data-[expanded=true]:h-92 data-[expanded=true]:rounded-none data-[expanded=true]:bg-white md:h-[calc((min(100vw,var(--container-main))-120px)/3)] md:data-[expanded=true]:h-110"
                data-expanded={isExpanded}
                href={item.href}
                onBlur={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(index)}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <Image
                  alt=""
                  className="absolute inset-0 size-full object-cover opacity-70 transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] data-[expanded=true]:opacity-90"
                  data-expanded={isExpanded}
                  fill
                  loading={index < 3 ? 'eager' : 'lazy'}
                  sizes="(max-width: 767px) 288px, calc((min(100vw - 40px, 1160px) - 80px) / 3)"
                  src={item.imageUrl}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-black/35 transition duration-500 data-[expanded=true]:bg-white/88"
                  data-expanded={isExpanded}
                />
                <span
                  className="absolute inset-x-5 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center text-center opacity-0 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[expanded=true]:opacity-100 md:inset-x-6"
                  data-expanded={isExpanded}
                >
                  <span className="inline-flex rounded-full bg-brand px-4 py-2 type-label-m font-bold leading-[1.2] text-white">
                    {item.category}
                  </span>
                  <span className="mt-8 block type-headline-s font-extrabold leading-normal text-neutral-900">
                    {item.title}
                  </span>
                  <span className="mt-3 block max-w-60 type-title-s font-bold leading-normal text-neutral-500">
                    {item.description}
                  </span>
                </span>
              </Link>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}

function ArtistCareControl({
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
      className="section-center-home-care__control flex size-16 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/45 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
