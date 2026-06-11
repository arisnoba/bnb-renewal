'use client'

import type { Media as PayloadMedia } from '@/payload-types'
import Image from 'next/image'
import React, { useState } from 'react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { Media } from '@/components/Media/Renderer'

export type TeacherImageItem =
  | {
      resource: PayloadMedia
      type: 'media'
    }
  | {
      src: string
      type: 'legacy'
    }

type TeacherDetailGalleryProps = {
  images: TeacherImageItem[]
  teacherName: string
}

export function TeacherDetailGallery({ images, teacherName }: TeacherDetailGalleryProps) {
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
    <div className="section-teacher-detail__gallery">
      <div className="overflow-hidden bg-black">
        {hasImages ? (
          <Swiper
            className="section-teacher-detail__gallery-swiper"
            keyboard={{ enabled: shouldSlide }}
            modules={[A11y, Keyboard]}
            onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
            onSwiper={setMainSwiper}
            slidesPerView={1}
          >
            {images.map((image, index) => (
              <SwiperSlide key={teacherImageKey(image, index)}>
                <TeacherGalleryImage
                  alt={index === 0 ? teacherName : `${teacherName} 이미지 ${index + 1}`}
                  image={image}
                  imgClassName="size-full object-cover object-top"
                  pictureClassName="block aspect-square w-full"
                  priority={index === 0}
                  size="(max-width: 1023px) 100vw, 550px"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="aspect-square w-full bg-black" />
        )}
      </div>

      {shouldSlide && (
        <Swiper
          className="section-teacher-detail__gallery-thumbs mt-3"
          onSwiper={setThumbsSwiper}
          spaceBetween={12}
          slidesPerView={5}
          watchSlidesProgress
        >
          {images.map((image, index) => {
            const isActive = index === activeIndex

            return (
              <SwiperSlide key={`thumb-${teacherImageKey(image, index)}`}>
                <button
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={`${teacherName} 이미지 ${index + 1} 보기`}
                  className="aspect-square w-full overflow-hidden bg-black opacity-40 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white data-[active=true]:rounded-full data-[active=true]:opacity-100"
                  data-active={isActive}
                  onClick={() => {
                    mainSwiper?.slideTo(index)
                    setActiveSlide(index)
                  }}
                  type="button"
                >
                  <TeacherGalleryImage
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

function TeacherGalleryImage({
  alt,
  image,
  imgClassName,
  pictureClassName,
  priority,
  size,
}: {
  alt: string
  image: TeacherImageItem
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
      width={1200}
    />
  )
}

function teacherImageKey(image: TeacherImageItem, index: number) {
  if (image.type === 'media') {
    return `media-${image.resource.id ?? index}`
  }

  return `legacy-${image.src}-${index}`
}
