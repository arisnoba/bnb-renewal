'use client'

import { ChevronRight, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { Media } from '@/components/Media/Renderer'
import RichText from '@/components/RichText'
import type { Media as MediaType, StarCard } from '@/payload-types'

export type StarcardListItem = {
  body: StarCard['body'] | null
  discountRate: string | null
  id: number
  image: MediaType | null
  mapUrl: string | null
  title: string
}

type StarcardListProps = {
  items: StarcardListItem[]
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
                <span className="starcard-partner-card__category block truncate text-sm font-bold leading-[1.45] text-muted-foreground">
                  스타카드 제휴업체
                </span>
                <span className="starcard-partner-card__title mt-1 block truncate text-base font-extrabold leading-[1.45] text-foreground">
                  {item.title}
                </span>
              </span>
              {item.discountRate ? (
                <span className="starcard-partner-card__discount shrink-0 rounded-full bg-foreground px-3 py-2 text-sm font-extrabold leading-none text-background">
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
    <div
      aria-modal="true"
      className="starcard-partner-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 py-10"
      role="dialog"
    >
      <button
        aria-label="상세 닫기"
        className="absolute inset-0 cursor-default appearance-none border-0 bg-transparent p-0"
        onClick={onClose}
        type="button"
      />
      <div className="starcard-partner-modal__panel relative max-h-[min(820px,calc(100vh-80px))] w-full max-w-[920px] overflow-y-auto rounded-[8px] bg-background text-foreground shadow-2xl">
        <button
          aria-label="상세 닫기"
          className="starcard-partner-modal__close absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-background/85 text-foreground/70 shadow-sm transition-colors hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} strokeWidth={2.2} />
        </button>

        <div className="grid gap-0 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <div className="starcard-partner-modal__media bg-muted">
            {item.image ? (
              <Media
                alt={item.title}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                pictureClassName="block aspect-square h-full w-full"
                resource={{ ...item.image, alt: item.title }}
                size="(max-width: 768px) 100vw, 420px"
              />
            ) : (
              <div className="aspect-square w-full" />
            )}
          </div>

          <div className="starcard-partner-modal__content flex flex-col p-8 md:p-10">
            <p className="mb-4 text-sm font-bold leading-[1.4] text-brand">STAR CARD</p>
            <h2 className="mb-2 text-[28px] font-extrabold leading-[1.3] tracking-normal md:text-[34px]">
              {item.title}
            </h2>
            {item.discountRate ? (
              <span className="w-fit shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-extrabold leading-none text-background">
                {item.discountRate}
              </span>
            ) : null}

            {item.body ? (
              <RichText
                className="starcard-partner-modal__body mt-8 text-[15px] font-medium leading-[1.8] text-muted-foreground"
                data={item.body}
                enableGutter={false}
                enableProse={false}
              />
            ) : null}

            {item.mapUrl ? (
              <a
                className="starcard-partner-modal__map-link mt-10 inline-flex h-[45px] w-fit items-center justify-center rounded-full bg-brand px-5 text-sm font-extrabold leading-none text-white transition-colors hover:bg-black hover:text-white"
                href={item.mapUrl}
                rel="noreferrer"
                target="_blank"
              >
                위치 확인하기
                <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
