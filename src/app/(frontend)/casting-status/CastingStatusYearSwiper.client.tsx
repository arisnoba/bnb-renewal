'use client'

import type { Swiper as SwiperInstance } from 'swiper'
import type { ReactNode } from 'react'

import type { CenterSlug } from '@/lib/centers'
import { cn } from '@/utilities/ui'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

export type CastingStatusCastMember = {
  actorName: string
  episodeNumbers: string
  roleName: string
}

export type CastingStatusPosterItem = {
  castMembers: CastingStatusCastMember[]
  castingCompany: string
  date: string
  id: number
  imageUrl: string
  title: string
}

export type CastingStatusYearGroup = {
  hasNextPage: boolean
  items: CastingStatusPosterItem[]
  nextPage: number | null
  year: string
}

type CastingStatusYearSwiperProps = {
  center: CenterSlug
  initialHasNextYearPage: boolean
  initialGroups: CastingStatusYearGroup[]
  initialNextYearOffset: number | null
}

export function CastingStatusYearSwiper({
  center,
  initialHasNextYearPage,
  initialGroups,
  initialNextYearOffset,
}: CastingStatusYearSwiperProps) {
  const [groups, setGroups] = useState(initialGroups)
  const [hasNextYearPage, setHasNextYearPage] = useState(initialHasNextYearPage)
  const [nextYearOffset, setNextYearOffset] = useState(initialNextYearOffset)
  const [isLoadingYears, setIsLoadingYears] = useState(false)
  const [yearErrorMessage, setYearErrorMessage] = useState('')
  const hasNextYearPageRef = useRef(hasNextYearPage)
  const isLoadingYearsRef = useRef(isLoadingYears)
  const lastYearLoadAtRef = useRef(0)
  const nextYearOffsetRef = useRef(nextYearOffset)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    hasNextYearPageRef.current = hasNextYearPage
    isLoadingYearsRef.current = isLoadingYears
    nextYearOffsetRef.current = nextYearOffset
  }, [hasNextYearPage, isLoadingYears, nextYearOffset])

  const loadMoreYears = useCallback(async () => {
    const currentNextYearOffset = nextYearOffsetRef.current

    if (!hasNextYearPageRef.current || currentNextYearOffset === null || isLoadingYearsRef.current) {
      return
    }

    const now = Date.now()

    if (now - lastYearLoadAtRef.current < 1000) {
      return
    }

    lastYearLoadAtRef.current = now
    isLoadingYearsRef.current = true
    setIsLoadingYears(true)
    setYearErrorMessage('')

    try {
      const response = await fetch(
        `/api/casting-status?center=${encodeURIComponent(center)}&offset=${currentNextYearOffset}`,
      )

      if (!response.ok) {
        throw new Error('failed-to-load-casting-status-years')
      }

      const data = (await response.json()) as CastingStatusYearBatchResponse

      setGroups((currentGroups) => mergeYearGroups(currentGroups, data.groups))
      hasNextYearPageRef.current = data.hasNextYearPage
      nextYearOffsetRef.current = data.nextYearOffset
      setHasNextYearPage(data.hasNextYearPage)
      setNextYearOffset(data.nextYearOffset)
    } catch {
      setYearErrorMessage('다음 연도 목록을 불러오지 못했습니다.')
    } finally {
      isLoadingYearsRef.current = false
      setIsLoadingYears(false)
      window.setTimeout(() => {
        if (isSentinelInLoadRange(sentinelRef.current)) {
          void loadMoreYears()
        }
      }, 1000)
    }
  }, [center])

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel || !hasNextYearPage) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting)

        if (isIntersecting) {
          void loadMoreYears()
        }
      },
      {
        rootMargin: '640px 0px',
      },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasNextYearPage, loadMoreYears])

  return (
    <div className="section-casting-status-years flex flex-col gap-18 md:gap-[70px]">
      {groups.map((group) => (
        <CastingStatusYearSection center={center} group={group} key={group.year} />
      ))}
      {hasNextYearPage && (
        <div
          className="section-casting-status-years__sentinel flex min-h-36 items-center justify-center py-8 text-center md:min-h-44 md:py-10"
          ref={sentinelRef}
        >
          {isLoadingYears ? (
            <div
              className="flex flex-col items-center justify-center gap-5 text-neutral-900"
              role="status"
            >
              <Loader2
                aria-hidden="true"
                className="size-10 shrink-0 animate-spin text-brand md:size-12"
                strokeWidth={2.2}
              />
              <p className="type-title-s font-extrabold leading-[1.35] md:type-title-m">
                다음 연도 불러오는 중
              </p>
            </div>
          ) : yearErrorMessage ? (
            <p
              className="type-label-m font-bold text-red-700"
              role="status"
            >
              {yearErrorMessage}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  )
}

type CastingStatusYearBatchResponse = {
  groups: CastingStatusYearGroup[]
  hasNextYearPage: boolean
  nextYearOffset: number | null
}

function CastingStatusYearSection({
  center,
  group,
}: {
  center: CenterSlug
  group: CastingStatusYearGroup
}) {
  const [items, setItems] = useState(group.items)
  const [hasNextPage, setHasNextPage] = useState(group.hasNextPage)
  const [nextPage, setNextPage] = useState(group.nextPage)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(items.length <= 1)

  const updateSwiperState = useCallback((instance: SwiperInstance) => {
    setIsBeginning(instance.isBeginning)
    setIsEnd(instance.isEnd)
  }, [])

  const handleSwiper = useCallback(
    (instance: SwiperInstance) => {
      setSwiper(instance)
      updateSwiperState(instance)
    },
    [updateSwiperState],
  )

  const loadMore = useCallback(async () => {
    if (!hasNextPage || !nextPage || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)
    setErrorMessage('')

    try {
      const response = await fetch(
        `/api/casting-status?center=${encodeURIComponent(center)}&year=${encodeURIComponent(group.year)}&page=${nextPage}`,
      )

      if (!response.ok) {
        throw new Error('failed-to-load-casting-status')
      }

      const data = (await response.json()) as CastingStatusYearGroup
      const currentSwiper = swiper

      setItems((currentItems) => mergePosterItems(currentItems, data.items))
      setHasNextPage(data.hasNextPage)
      setNextPage(data.nextPage)
      window.setTimeout(() => {
        currentSwiper?.update()

        if (currentSwiper) {
          updateSwiperState(currentSwiper)
        }
      }, 0)
    } catch {
      setErrorMessage('목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoadingMore(false)
    }
  }, [center, group.year, hasNextPage, isLoadingMore, nextPage, swiper, updateSwiperState])

  const loadMoreWhenNearEnd = useCallback(
    (instance: SwiperInstance) => {
      updateSwiperState(instance)

      if (instance.slides.length - instance.activeIndex <= 4) {
        void loadMore()
      }
    },
    [loadMore, updateSwiperState],
  )

  return (
    <section
      aria-labelledby={`casting-status-year-${group.year}`}
      className="section-casting-status-year"
    >
      <div className="section-casting-status-year__head mb-2 flex items-end justify-between gap-5">
        <h3
          className="section-casting-status-year__label select-none font-black text-neutral-900"
          id={`casting-status-year-${group.year}`}
        >
          {group.year}
        </h3>
        <div className="section-casting-status-year__controls mb-4 flex items-center gap-3 md:mb-8 md:gap-5">
          <CastingStatusControl
            ariaLabel={`${group.year} 이전 포스터`}
            disabled={isBeginning}
            onClick={() => swiper?.slidePrev()}
          >
            <ChevronLeft aria-hidden="true" className="size-4 md:size-5" strokeWidth={2} />
          </CastingStatusControl>
          <CastingStatusControl
            ariaLabel={`${group.year} 다음 포스터`}
            disabled={isEnd}
            onClick={() => swiper?.slideNext()}
          >
            <ChevronRight aria-hidden="true" className="size-4 md:size-5" strokeWidth={2} />
          </CastingStatusControl>
        </div>
      </div>

      <Swiper
        a11y={{
          nextSlideMessage: '다음 포스터',
          prevSlideMessage: '이전 포스터',
        }}
        className="casting-status-swiper"
        keyboard={{
          enabled: true,
        }}
        modules={[A11y, Keyboard]}
        onResize={updateSwiperState}
        onReachEnd={() => {
          void loadMore()
        }}
        onSlideChange={loadMoreWhenNearEnd}
        onSwiper={handleSwiper}
        slidesPerView="auto"
        spaceBetween={16}
      >
        {items.map((item) => (
          <SwiperSlide className="!h-auto !w-[220px] sm:!w-[248px] lg:!w-[275px]" key={item.id}>
            <CastingStatusPosterCard item={item} />
          </SwiperSlide>
        ))}
      </Swiper>

      {(isLoadingMore || errorMessage) && (
        <p
          className="section-casting-status-year__status mt-5 type-caption-m font-medium text-neutral-500"
          role="status"
        >
          {isLoadingMore ? `${group.year}년 작품 불러오는 중` : errorMessage}
        </p>
      )}
    </section>
  )
}

function CastingStatusControl({
  ariaLabel,
  children,
  disabled,
  onClick,
}: {
  ariaLabel: string
  children: ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-500 transition hover:border-neutral-500 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-35 md:size-12"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function CastingStatusPosterCard({ item }: { item: CastingStatusPosterItem }) {
  return (
    <article
      className="group section-casting-status-poster relative flex h-full min-h-[320px] overflow-hidden rounded-xl bg-neutral-200 shadow-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:min-h-[360px] lg:min-h-[400px]"
      tabIndex={0}
    >
      {item.imageUrl ? (
        <Image
          alt={`${item.title} 포스터`}
          className="section-casting-status-poster__image absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.035]"
          fill
          loading="lazy"
          sizes="(max-width: 639px) 220px, (max-width: 1023px) 248px, 275px"
          src={item.imageUrl}
          unoptimized
        />
      ) : (
        <div className="flex size-full items-center justify-center type-label-m font-semibold text-neutral-500">
          준비중입니다.
        </div>
      )}

      <div
        className={cn(
          'section-casting-status-poster__overlay absolute inset-0 flex flex-col justify-end bg-black/72 p-5 text-white opacity-100 transition duration-200',
          'md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100',
        )}
      >
        <dl className="space-y-3">
          <div>
            <dt className="type-caption-s font-medium leading-[1.35] text-white/55">캐스팅 회사</dt>
            <dd className="mt-1 type-label-m font-bold leading-[1.35]">{item.castingCompany}</dd>
          </div>
          <div>
            <dt className="type-caption-s font-medium leading-[1.35] text-white/55">작품명</dt>
            <dd className="mt-1 line-clamp-2 type-title-s font-extrabold leading-[1.35]">
              {item.title}
            </dd>
          </div>
          <div>
            <dt className="type-caption-s font-medium leading-[1.35] text-white/55">출연 배우</dt>
            <dd className="mt-2 space-y-1.5">
              {item.castMembers.length > 0 ? (
                item.castMembers.slice(0, 4).map((member, index) => (
                  <p
                    className="line-clamp-1 type-caption-m font-medium leading-[1.45] text-white/85"
                    key={`${member.actorName}-${member.roleName}-${index}`}
                  >
                    {formatCastMember(member)}
                  </p>
                ))
              ) : (
                <p className="type-caption-m font-medium leading-[1.45] text-white/75">
                  출연 배우 정보 준비중
                </p>
              )}
              {item.castMembers.length > 4 && (
                <p className="type-caption-s font-medium text-red-200">
                  외 {item.castMembers.length - 4}명
                </p>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

function formatCastMember(member: CastingStatusCastMember) {
  const role = member.roleName ? ` · ${member.roleName}` : ''
  const episodes = member.episodeNumbers ? ` · ${member.episodeNumbers}회차` : ''

  return `${member.actorName || '배우명 미정'}${role}${episodes}`
}

function mergePosterItems(
  currentItems: CastingStatusPosterItem[],
  incomingItems: CastingStatusPosterItem[],
) {
  const existingIds = new Set(currentItems.map((item) => item.id))
  const nextItems = incomingItems.filter((item) => !existingIds.has(item.id))

  return [...currentItems, ...nextItems]
}

function mergeYearGroups(
  currentGroups: CastingStatusYearGroup[],
  incomingGroups: CastingStatusYearGroup[],
) {
  const existingYears = new Set(currentGroups.map((group) => group.year))
  const nextGroups = incomingGroups.filter((group) => !existingYears.has(group.year))

  return [...currentGroups, ...nextGroups]
}

function isSentinelInLoadRange(sentinel: HTMLDivElement | null) {
  if (!sentinel) {
    return false
  }

  const rect = sentinel.getBoundingClientRect()

  return rect.top <= window.innerHeight + 640 && rect.bottom >= -640
}
