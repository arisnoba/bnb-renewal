'use client'

import type { Media as PayloadMedia } from '@/payload-types'
import Image from 'next/image'
import React, { useState } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { Media } from '@/components/Media/Renderer'

export type ProfileImageItem =
  | {
      resource: PayloadMedia
      type: 'media'
    }
  | {
      src: string
      type: 'legacy'
    }

type ProfileDetailGalleryProps = {
  images: ProfileImageItem[]
  profileName: string
}

export function ProfileDetailGallery({ images, profileName }: ProfileDetailGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mainSwiper, setMainSwiper] = useState<SwiperInstance | null>(null)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const hasImages = images.length > 0
  const shouldSlide = images.length > 1

  const setActiveSlide = (index: number) => {
    setActiveIndex(index)
    thumbsSwiper?.slideTo(Math.max(index - 2, 0))
  }

  return (
    <div className="section-profile-detail__gallery min-w-0 max-w-full">
      <div className="aspect-square min-w-0 max-w-full overflow-hidden bg-muted">
        {hasImages ? (
          <Swiper
            className="section-profile-detail__gallery-swiper aspect-square w-full min-w-0 max-w-full"
            keyboard={{ enabled: shouldSlide }}
            modules={[A11y, Keyboard]}
            onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
            onSwiper={setMainSwiper}
            slidesPerView={1}
          >
            {images.map((image, index) => (
              <SwiperSlide className="aspect-square!" key={profileImageKey(image, index)}>
                <ProfileGalleryImage
                  alt={index === 0 ? profileName : `${profileName} 이미지 ${index + 1}`}
                  image={image}
                  imgClassName="size-full object-cover object-top"
                  pictureClassName="block size-full"
                  priority={index === 0}
                  size="(max-width: 1023px) 100vw, 550px"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="aspect-square w-full bg-muted" />
        )}
      </div>

      {shouldSlide && (
        <Swiper
          className="section-profile-detail__gallery-thumbs mt-3 w-full min-w-0 max-w-full"
          onSwiper={setThumbsSwiper}
          spaceBetween={12}
          slidesPerView={5}
          watchSlidesProgress
        >
          {images.map((image, index) => {
            const isActive = index === activeIndex

            return (
              <SwiperSlide key={`thumb-${profileImageKey(image, index)}`}>
                <button
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={`${profileName} 이미지 ${index + 1} 보기`}
                  className="aspect-square w-full overflow-hidden bg-muted opacity-45 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-[active=true]:rounded-full data-[active=true]:opacity-100"
                  data-active={isActive}
                  onClick={() => {
                    mainSwiper?.slideTo(index)
                    setActiveSlide(index)
                  }}
                  type="button"
                >
                  <ProfileGalleryImage
                    alt=""
                    image={image}
                    imgClassName="size-full object-cover object-top"
                    pictureClassName="block size-full"
                    size="100px"
                  />
                </button>
              </SwiperSlide>
            )
          })}
        </Swiper>
      )}
    </div>
  )
}

function ProfileGalleryImage({
  alt,
  image,
  imgClassName,
  pictureClassName,
  priority,
  size,
}: {
  alt: string
  image: ProfileImageItem
  imgClassName: string
  pictureClassName: string
  priority?: boolean
  size: string
}) {
  if (image.type === 'media') {
    return (
      <Media
        alt={alt}
        htmlElement={null}
        imgClassName={imgClassName}
        pictureClassName={pictureClassName}
        priority={priority}
        resource={image.resource}
        size={size}
      />
    )
  }

  return (
    <Image
      alt={alt}
      className={imgClassName}
      height={1200}
      priority={priority}
      src={image.src}
      unoptimized
      width={1200}
    />
  )
}

function profileImageKey(image: ProfileImageItem, index: number) {
  if (image.type === 'media') {
    return `media-${image.resource.id ?? index}`
  }

  return `legacy-${image.src}-${index}`
}
