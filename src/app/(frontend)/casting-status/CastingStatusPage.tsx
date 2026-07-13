import { PageIntro } from '@/components/PageIntro'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import type { CenterSlug } from '@/lib/centers'
import configPromise from '@payload-config'
import Image from 'next/image'
import { getPayload } from 'payload'

import { HeroMosaicDim } from '../_components/HeroMosaicDim'
import {
  findCastingStatusOverview,
  getEmptyCastingStatusOverview,
} from './CastingStatus.data'
import {
  CastingStatusYearSwiper,
  type CastingStatusPosterItem,
} from './CastingStatusYearSwiper.client'

import './CastingStatus.scss'

type CastingStatusPageProps = {
  center: CenterSlug
}

const HERO_POSTER_COUNT = 21
const HERO_POSTER_CENTER_INDEX = Math.floor(HERO_POSTER_COUNT / 2)
const HERO_POSTER_COLUMNS = 7
const HERO_POSTER_SLOT_ORDER = getHeroPosterSlotOrder()
const HERO_POSTER_PRIORITY_COUNT = 7
const heroPosterPlaceholder =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 2 3%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%22%23111111%22/%3E%3Cstop offset=%221%22 stop-color=%22%23333333%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%222%22 height=%223%22 fill=%22url(%23g)%22/%3E%3C/svg%3E'

export async function CastingStatusPage({ center }: CastingStatusPageProps) {
  const payload = await getPayload({ config: configPromise })
  const decoIcons = getPageDecoIcons(3, `casting-status-${center}`)
  const pageData = await findCastingStatusOverview({
    center,
    payload,
  }).catch(() => getEmptyCastingStatusOverview())
  const heroItems = getCastingStatusHeroItems(pageData.items)

  return (
    <main className="page page-light page-casting-status" data-center={center}>
      <section
        aria-labelledby="casting-status-hero-title"
        className="section-casting-status-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <CastingStatusHeroVisual items={heroItems} />
        <HeroMosaicDim />
        <PageDeco
          className="-left-20 top-[36%] md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[12%] md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[18%] bottom-[8%] md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[142px]">
          <div
            className="section-casting-status-hero__title page-hero-label"
            id="casting-status-hero-title"
          >
            <span className="block text-brand">캐스팅</span>
            <span className="block">
              출연현황
            </span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="casting-status-list-title"
        className="section-casting-status-list section-p-block-base bg-white text-neutral-900"
      >
        <div className="container">
          <PageIntro
            className="section-casting-status-list__head mb-16 md:mb-20"
            description="ARKO Lab 에이전시와 사전협의 없는 무단 도용 및 복제, 배포를 금합니다."
            descriptionClassName="section-casting-status-list__description"
            eyebrow="캐스팅 출연현황"
            eyebrowClassName="section-casting-status-list__eyebrow"
            id="casting-status-list-title"
            title={'배우앤배움 수강생들의 출연 작품은\nARKO Lab의 단독 캐스팅으로 이어지고 있습니다.'}
            titleClassName="section-casting-status-list__title"
          />

          {pageData.groups.length > 0 ? (
            <CastingStatusYearSwiper
              center={center}
              initialHasNextYearPage={pageData.hasNextYearPage}
              initialGroups={pageData.groups}
              initialNextYearOffset={pageData.nextYearOffset}
            />
          ) : (
            <p className="section-casting-status-list__empty border-y border-neutral-200 py-18 text-center type-title-s font-semibold text-neutral-500">
              등록된 캐스팅 출연현황이 없습니다.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function CastingStatusHeroVisual({ items }: { items: CastingStatusPosterItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="section-casting-status-hero__visual absolute inset-0 bg-neutral-950"
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className="section-casting-status-hero__visual absolute inset-0 overflow-hidden"
    >
      <div className="section-casting-status-hero__poster-grid absolute left-1/2 top-1/2 grid w-[250vw] -translate-x-1/2 -translate-y-1/2 grid-cols-7 gap-2 opacity-55 md:w-[104vw] md:rotate-[-4deg] md:scale-100 md:gap-4">
        {items.map((item, index) => (
          <div
            className="section-casting-status-hero__poster relative aspect-2/3 overflow-hidden rounded-xl bg-linear-to-br from-neutral-950 to-neutral-800"
            key={`${item.id}-${index}`}
          >
            <Image
              alt=""
              className="size-full object-cover"
              blurDataURL={heroPosterPlaceholder}
              fill
              loading="eager"
              placeholder="blur"
              priority={isPriorityHeroPoster(index)}
              sizes="(max-width: 767px) 34vw, 13vw"
              src={item.imageUrl}
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function isPriorityHeroPoster(index: number) {
  return index === HERO_POSTER_CENTER_INDEX || index < HERO_POSTER_PRIORITY_COUNT
}

function getCastingStatusHeroItems(items: CastingStatusPosterItem[]) {
  const posters = items.filter((item) => item.imageUrl)
  const preferredPosters = posters.filter((item) => !isLegacyHeroImage(item.imageUrl))
  const heroPosters = preferredPosters.length > 0 ? preferredPosters : posters

  if (heroPosters.length === 0) {
    return []
  }

  const arrangedItems = Array.from(
    { length: HERO_POSTER_COUNT },
    () => heroPosters[heroPosters.length - 1],
  )

  HERO_POSTER_SLOT_ORDER.forEach((slotIndex, sourceIndex) => {
    arrangedItems[slotIndex] = heroPosters[Math.min(sourceIndex, heroPosters.length - 1)]
  })

  return arrangedItems
}

function isLegacyHeroImage(value: string) {
  try {
    return new URL(value, 'http://local.test').pathname.startsWith('/legacy/')
  } catch {
    return value.startsWith('/legacy/') || value.startsWith('legacy/')
  }
}

function getHeroPosterSlotOrder() {
  return Array.from({ length: HERO_POSTER_COUNT }, (_, index) => index).sort((left, right) => {
    const distanceDiff = getHeroPosterSlotDistance(left) - getHeroPosterSlotDistance(right)

    if (distanceDiff !== 0) {
      return distanceDiff
    }

    return left - right
  })
}

function getHeroPosterSlotDistance(index: number) {
  const centerRow = Math.floor(HERO_POSTER_CENTER_INDEX / HERO_POSTER_COLUMNS)
  const centerColumn = HERO_POSTER_CENTER_INDEX % HERO_POSTER_COLUMNS
  const row = Math.floor(index / HERO_POSTER_COLUMNS)
  const column = index % HERO_POSTER_COLUMNS

  return (row - centerRow) ** 2 + (column - centerColumn) ** 2
}
