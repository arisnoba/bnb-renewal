'use client'

import { ChevronRight, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { Media } from '@/components/Media/Renderer'
import RichText from '@/components/RichText'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Media as MediaType, StarCard } from '@/payload-types'

export type StarcardListItem = {
  body: StarCard['body'] | null
  category: StarCard['category'] | null
  discountRate: string | null
  id: number
  image: MediaType | null
  images: MediaType[]
  mapUrl: string | null
  title: string
}

type StarcardListProps = {
  items: StarcardListItem[]
}

const categoryLabels: Record<NonNullable<StarCard['category']>, string> = {
  beauty: '뷰티',
  cafe: '카페',
  hairMakeup: '헤어&메이크업',
  health: '헬스',
  medical: '메디컬',
  profile: '프로필',
}

function categoryLabel(value: StarcardListItem['category']) {
  return value ? categoryLabels[value] : '스타카드 제휴업체'
}

export function StarcardList({ items }: StarcardListProps) {
  const [selectedItem, setSelectedItem] = useState<StarcardListItem | null>(null)

  useEffect(() => {
    if (!selectedItem) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedItem(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedItem])

  return (
    <>
      <div className="section-starcard-list__items grid grid-cols-1 gap-x-4 gap-y-11 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <button
            className="starcard-partner-card group block min-w-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-left text-inherit"
            key={item.id}
            onClick={() => setSelectedItem(item)}
            type="button"
          >
            <span className="starcard-partner-card__media block aspect-square overflow-hidden rounded-[8px] bg-muted">
              {item.image ? (
                <Media
                  alt={item.title}
                  className="h-full w-full"
                  imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  pictureClassName="block h-full w-full"
                  resource={{ ...item.image, alt: item.title }}
                  size="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                />
              ) : null}
            </span>
            <span className="starcard-partner-card__meta mt-4 flex min-w-0 items-end justify-between gap-3">
              <span className="min-w-0">
                <span className="starcard-partner-card__category block truncate type-label-m font-bold leading-[1.45] text-muted-foreground">
                  {categoryLabel(item.category)}
                </span>
                <span className="starcard-partner-card__title mt-1 block truncate type-title-s font-extrabold leading-[1.45] text-foreground">
                  {item.title}
                </span>
              </span>
              {item.discountRate ? (
                <span className="starcard-partner-card__discount shrink-0 rounded-full bg-foreground px-3 py-2 type-label-m font-extrabold leading-none text-background">
                  {item.discountRate}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {selectedItem ? (
        <StarcardModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      ) : null}
    </>
  )
}

function StarcardModal({
  item,
  onClose,
}: {
  item: StarcardListItem
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) {
        onClose()
      }
    }}>
      <DialogContent className="starcard-partner-modal__panel flex h-[min(820px,calc(100vh-80px))] max-w-[920px] flex-col overflow-hidden border-0 p-0">
        <DialogHeader className="starcard-partner-modal__header shrink-0 flex-row items-start justify-between gap-5 border-b border-foreground/10 bg-background px-6 py-6 text-left md:px-10">
          <div className="min-w-0">
            <p className="mb-3 type-label-m font-bold leading-[1.4] text-brand">
              {categoryLabel(item.category)}
            </p>
            <div className="starcard-partner-modal__title-row flex min-w-0 items-start md:items-center gap-4">
              <DialogTitle className="min-w-0 flex-1 type-headline-l font-extrabold leading-[1.3] tracking-normal">
                {item.title}
              </DialogTitle>
              {item.discountRate ? (
                <span className="starcard-partner-modal__discount-badge shrink-0 rounded-full bg-foreground px-4 py-2 type-label-m font-extrabold leading-none text-background">
                  ~ {item.discountRate} 할인
                </span>
              ) : null}
            </div>
          </div>
          <DialogClose
            aria-label="상세 닫기"
            className="starcard-partner-modal__close grid size-10 shrink-0 place-items-center rounded-full bg-background/85 text-foreground/70 shadow-sm transition-colors hover:text-foreground"
            type="button"
          >
            <X aria-hidden="true" size={20} strokeWidth={2.2} />
          </DialogClose>
        </DialogHeader>
        <DialogDescription className="sr-only">
          스타카드 제휴업체 혜택, 이용방법, 위치, 이미지 상세 정보
        </DialogDescription>

        <div className="starcard-partner-modal__content flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-8 pt-6 md:px-10 md:pb-10">
          {item.body ? (
            <RichText
              className="starcard-partner-modal__body type-body-m font-medium leading-[1.8] text-muted-foreground"
              data={item.body}
              enableGutter={false}
              enableProse={false}
            />
          ) : null}

          {item.mapUrl ? (
            <a
              className="starcard-partner-modal__map-link mt-5 inline-flex w-fit items-center justify-center rounded-full border border-foreground/20 bg-transparent px-5 type-label-m font-extrabold leading-none text-muted-foreground transition-colors hover:border-foreground/45 hover:text-foreground"
              href={item.mapUrl}
              rel="noreferrer"
              target="_blank"
            >
              위치 확인하기
              <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
            </a>
          ) : null}

          <div className="starcard-partner-modal__image-section mt-10">
            <StarcardModalImages item={item} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StarcardModalImages({ item }: { item: StarcardListItem }) {
  const images = item.images.length > 0 ? item.images : item.image ? [item.image] : []
  const shouldRoll = images.length > 1

  return (
    <div className="starcard-partner-modal__media bg-muted">
      {images.length > 0 ? (
        <Swiper
          autoplay={
            shouldRoll
              ? {
                  delay: 3500,
                  disableOnInteraction: false,
                }
              : false
          }
          className="starcard-partner-modal__swiper"
          loop={shouldRoll}
          modules={[Autoplay, Pagination]}
          pagination={
            shouldRoll
              ? {
                  clickable: true,
                }
              : false
          }
          slidesPerView={1}
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image.id}-${index}`}>
              <Media
                alt={index === 0 ? item.title : `${item.title} 이미지 ${index + 1}`}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                pictureClassName="block aspect-video h-full w-full"
                resource={{ ...image, alt: item.title }}
                size="(max-width: 768px) 100vw, 920px"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="aspect-video w-full" />
      )}
    </div>
  )
}
