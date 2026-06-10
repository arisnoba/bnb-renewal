'use client'

import type { CSSProperties } from 'react'

import Link from 'next/link'
import { useState } from 'react'

export type ExpandCardItem = {
  label: string
  title: string
  description: string
  href: string
  image: string
  enabled?: boolean
}

const images = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
]

const defaultItems: ExpandCardItem[] = [
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

type ExpandOnHoverProps = {
  items?: ExpandCardItem[]
}

const ExpandOnHover = ({ items = defaultItems }: ExpandOnHoverProps) => {
  const initialExpandedImage = Math.max(
    0,
    items.findIndex((item) => item.enabled !== false),
  )
  const [expandedImage, setExpandedImage] = useState(initialExpandedImage)

  const getImageWidth = (index: number) =>
    index === expandedImage ? '26rem' : '6rem'

  return (
    <section className="min-h-screen w-full bg-[#f5f4f3] text-[#111]">
      <div className="grid min-h-screen w-full grid-cols-1 items-center justify-center px-4 py-8 transition-all duration-300 ease-in-out md:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold uppercase leading-none text-[#777]">
              BNB INDUSTRY
            </p>
            <h1 className="text-[40px] font-extrabold leading-[1.08] tracking-normal text-balance md:text-[56px]">
              배우앤배움 센터 선택
            </h1>
          </div>

          <div className="flex w-full flex-col gap-3 lg:h-[34rem] lg:flex-row lg:items-stretch lg:justify-center">
            {items.map((item, idx) => {
              const isExpanded = idx === expandedImage
              const isEnabled = item.enabled !== false
              const cardStyle = {
                '--expand-card-width': getImageWidth(idx),
              } as CSSProperties
              const imageStyle = { backgroundImage: `url(${item.image})` }
              const content = (
                <>
                  <span
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 group-focus-visible:scale-105"
                    style={imageStyle}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
                  {!isEnabled ? (
                    <span className="absolute inset-0 bg-black/45" />
                  ) : null}
                  <span className="absolute inset-x-0 bottom-0 flex min-h-[170px] flex-col justify-end gap-3 p-5 text-white md:p-6">
                    <span className="text-xs font-extrabold uppercase leading-none text-white/70">
                      {item.label}
                    </span>
                    <span className="text-2xl font-extrabold leading-tight tracking-normal">
                      {item.title}
                    </span>
                    <span
                      className={
                        isExpanded
                          ? 'max-w-[23rem] text-sm font-medium leading-[1.55] text-white/82 opacity-100 transition-opacity duration-300'
                          : 'max-w-[23rem] text-sm font-medium leading-[1.55] text-white/82 opacity-100 transition-opacity duration-300 lg:opacity-0'
                      }
                    >
                      {item.description}
                    </span>
                    {!isEnabled ? (
                      <span className="mt-1 w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-[#111]">
                        준비중
                      </span>
                    ) : null}
                  </span>
                </>
              )

              const className =
                'group relative min-h-[21rem] w-full overflow-hidden rounded-[8px] bg-[#ddd] bg-cover bg-center text-left outline-none transition-all duration-500 ease-in-out focus-visible:ring-4 focus-visible:ring-black/20 lg:h-full lg:w-[var(--expand-card-width)]'

              if (!isEnabled) {
                return (
                  <div
                    aria-disabled="true"
                    className={`${className} cursor-default`}
                    key={item.href}
                    onMouseEnter={() => setExpandedImage(idx)}
                    style={cardStyle}
                  >
                    {content}
                  </div>
                )
              }

              return (
                <Link
                  className={`${className} cursor-pointer`}
                  href={item.href}
                  key={item.href}
                  onFocus={() => setExpandedImage(idx)}
                  onMouseEnter={() => setExpandedImage(idx)}
                  style={cardStyle}
                >
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ExpandOnHover
