'use client'

import Link from 'next/link'

import { cn } from '@/utilities/ui'

export type ImageGalleryItem = {
  label: string
  title: string
  description: string
  href: string
  image: string
  enabled?: boolean
}

const images = [
  'https://images.unsplash.com/photo-1719368472026-dc26f70a9b76?q=80&h=800&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1649265825072-f7dd6942baed?q=80&h=800&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&h=800&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1729086046027-09979ade13fd?q=80&h=800&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1601568494843-772eb04aca5d?q=80&h=800&w=800&auto=format&fit=crop',
]

const defaultItems: ImageGalleryItem[] = [
  {
    label: 'ART CENTER',
    title: '아트센터',
    description: '연기 교육과 현장 캐스팅을 연결하는 배우 과정',
    href: '/art',
    image: images[0]!,
  },
  {
    label: 'EXAM CENTER',
    title: '입시센터',
    description: '예고, 대학 입시를 위한 단계별 실기 준비',
    href: '/exam',
    image: images[1]!,
  },
  {
    label: 'HIGH TEEN CENTER',
    title: '하이틴센터',
    description: '청소년 배우를 위한 연기, 매니지먼트, 캐스팅 과정',
    href: '/highteen',
    image: images[2]!,
  },
  {
    label: 'KIDS CENTER',
    title: '키즈센터',
    description: '아역 배우 성장에 맞춘 교육과 현장 경험',
    href: '/kids',
    image: images[3]!,
  },
  {
    label: 'AVENUE CENTER',
    title: '애비뉴센터',
    description: '제휴와 프로필, 캐스팅을 연결하는 확장 과정',
    href: '/avenue',
    image: images[4]!,
    enabled: false,
  },
]

type ImageGalleryProps = {
  items?: ImageGalleryItem[]
}

export default function ImageGallery({
  items = defaultItems,
}: ImageGalleryProps) {
  return (
    <section className="flex min-h-screen w-full flex-col items-center justify-center bg-black py-12 text-white">
      <div className="flex w-full max-w-7xl flex-col gap-10 px-4 md:px-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold uppercase leading-none text-white/55">
            BNB INDUSTRY
          </p>
          <h1 className="text-[40px] font-extrabold leading-[1.08] tracking-normal text-balance md:text-[56px]">
            배우앤배움 센터 선택
          </h1>
        </div>

        <div className="flex h-auto w-full flex-col items-stretch gap-3 lg:h-[520px] lg:flex-row">
          {items.map((item) => {
            const isEnabled = item.enabled !== false
            const cardClassName = cn(
              'group relative h-[320px] w-full flex-grow overflow-hidden rounded-lg bg-[#111] text-left transition-all duration-500 lg:h-full lg:w-56 hover:lg:w-full',
              isEnabled ? 'cursor-pointer' : 'cursor-default',
            )
            const content = (
              <>
                <span
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />
                {!isEnabled ? (
                  <span className="absolute inset-0 bg-black/45" />
                ) : null}
                <span className="absolute inset-x-0 bottom-0 flex min-h-[172px] flex-col items-start justify-end gap-3 p-5 text-white md:p-6">
                  <span className="whitespace-nowrap text-[11px] font-extrabold uppercase leading-none text-white/70">
                    {item.label}
                  </span>
                  <span className="whitespace-nowrap text-[26px] font-extrabold leading-tight tracking-normal">
                    {item.title}
                  </span>
                  <span className="max-w-[25rem] text-sm font-medium leading-[1.55] text-white/82 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {item.description}
                  </span>
                  {!isEnabled ? (
                    <span className="w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-[#111]">
                      준비중
                    </span>
                  ) : null}
                </span>
              </>
            )

            if (!isEnabled) {
              return (
                <div
                  aria-disabled="true"
                  className={cardClassName}
                  key={item.href}
                >
                  {content}
                </div>
              )
            }

            return (
              <Link className={cardClassName} href={item.href} key={item.href}>
                {content}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
