'use client'

import type { Swiper as SwiperInstance } from 'swiper'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { cn } from '@/utilities/ui'

export type CompanyAffiliate = {
  description: string
  href?: null | string
  imageAlt?: string
  imageSrc?: string
  name: string
}

type CompanyAffiliateCarouselProps = {
  affiliates: CompanyAffiliate[]
}

export function CompanyAffiliateCarousel({ affiliates }: CompanyAffiliateCarouselProps) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(false)

  const updateState = useCallback((instance: SwiperInstance) => {
    setIsBeginning(instance.isBeginning)
    setIsEnd(instance.isEnd)
  }, [])

  const handleSwiper = useCallback(
    (instance: SwiperInstance) => {
      setSwiper(instance)
      updateState(instance)
    },
    [updateState],
  )

  return (
    <div className="section-company-affiliates__carousel">
      <div className="mb-8 flex items-center justify-between gap-4 md:mb-10">
        <p className="type-label-l font-bold text-white/70" id="company-affiliates">
          BNB INDUSTRY NETWORK
        </p>
        <div className="flex items-center gap-2">
          <CarouselButton
            ariaLabel="이전 계열사"
            disabled={isBeginning}
            onClick={() => swiper?.slidePrev()}
          >
            <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </CarouselButton>
          <CarouselButton
            ariaLabel="다음 계열사"
            disabled={isEnd}
            onClick={() => swiper?.slideNext()}
          >
            <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </CarouselButton>
        </div>
      </div>

      <div>
        <Swiper
          a11y={{
            nextSlideMessage: '다음 계열사',
            prevSlideMessage: '이전 계열사',
          }}
          breakpoints={{
            768: {
              slidesPerView: 1.4,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 2.4,
              spaceBetween: 24,
            },
            1280: {
              slidesPerView: 2.4,
              spaceBetween: 24,
            },
          }}
          className="section-company-affiliates__swiper overflow-visible!"
          keyboard={{
            enabled: true,
          }}
          modules={[A11y, Keyboard]}
          onResize={updateState}
          onSlideChange={updateState}
          onSwiper={handleSwiper}
          slidesPerView={1.15}
          spaceBetween={16}
        >
          {affiliates.map((affiliate) => {
            const isExternalHref = affiliate.href?.startsWith('http') ?? false

            return (
              <SwiperSlide className="h-auto!" key={affiliate.name}>
                <article className="section-company-affiliates__card grid h-full min-h-80 grid-rows-[160px_1fr] overflow-hidden bg-black md:min-h-92 md:grid-rows-[190px_1fr]">
                  {affiliate.imageSrc ? (
                    <figure className="relative overflow-hidden bg-neutral-900">
                      <Image
                        alt={affiliate.imageAlt ?? affiliate.name}
                        className="size-full object-cover"
                        fill
                        loading="lazy"
                        sizes="(max-width: 767px) 82vw, (max-width: 1279px) 36vw, 280px"
                        src={affiliate.imageSrc}
                      />
                    </figure>
                  ) : (
                    <div className="flex items-center justify-center bg-neutral-950 px-6 text-center">
                      <p className="type-title-l font-extrabold uppercase tracking-normal text-white/25">
                        {affiliate.name}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col items-start justify-between gap-6 p-6">
                    <div>
                      <h3 className="type-title-m font-extrabold text-white">{affiliate.name}</h3>
                      <p className="mt-4 type-body-s text-white/55">{affiliate.description}</p>
                    </div>
                    {affiliate.href ? (
                      <Link
                        className="inline-flex items-center gap-1 type-caption-m font-bold text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        href={affiliate.href}
                        rel={isExternalHref ? 'noreferrer' : undefined}
                        target={isExternalHref ? '_blank' : undefined}
                      >
                        자세히 보기
                        <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
                      </Link>
                    ) : (
                      <span className="type-caption-m font-bold text-white/30">링크 준비중</span>
                    )}
                  </div>
                </article>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}

function CarouselButton({
  ariaLabel,
  children,
  disabled,
  onClick,
}: {
  ariaLabel: string
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        'grid size-10 place-items-center rounded-full border border-white/35 text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:size-11',
        disabled ? 'cursor-not-allowed opacity-35' : 'hover:border-white hover:bg-white hover:text-black',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
