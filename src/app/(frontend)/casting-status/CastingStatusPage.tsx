import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import type { CenterSlug } from '@/lib/centers'
import configPromise from '@payload-config'
import Image from 'next/image'
import { getPayload } from 'payload'

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

const HERO_POSTER_COUNT = 15
const HERO_POSTER_CENTER_INDEX = Math.floor(HERO_POSTER_COUNT / 2)
const HERO_POSTER_COLUMNS = 5
const HERO_POSTER_SLOT_ORDER = getHeroPosterSlotOrder()

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
        className="section-casting-status-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <CastingStatusHeroVisual items={heroItems} />
        <div className="absolute inset-0 bg-black/65" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[36%] h-56 w-56 max-md:!hidden md:block md:-left-28 md:h-[360px] md:w-[360px]"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[12%] h-56 w-56 max-md:!hidden md:block md:right-[-104px] md:h-[360px] md:w-[360px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[18%] bottom-[8%] h-48 w-48 max-md:!hidden md:block md:h-[300px] md:w-[300px]"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1
            className="section-casting-status-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
            id="casting-status-hero-title"
          >
            <span className="block text-brand">캐스팅</span>
            <span className="block">
              진행중인
              <br />
              출연현황
            </span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="casting-status-list-title"
        className="section-casting-status-list section-p-block-base bg-white text-neutral-900"
      >
        <div className="container">
          <header className="section-casting-status-list__head mb-16 md:mb-20">
            <p className="section-casting-status-list__eyebrow mb-8 type-title-s font-bold leading-[1.4] text-brand md:mb-10">
              진행중인 캐스팅 출연현황
            </p>
            <h2
              className="section-casting-status-list__title type-display-m font-extrabold leading-[1.35] md:type-display-l"
              id="casting-status-list-title"
            >
              <span className="block md:inline">배우앤배움 수강생들의</span>{' '}
              <span className="block md:inline">출연 작품은</span>
              <br className="hidden md:block" />
              <span className="block md:inline">유캐스팅의 단독 캐스팅으로</span>{' '}
              <span className="block md:inline">이어지고 있습니다.</span>
            </h2>
            <p className="section-casting-status-list__description mt-6 type-body-m leading-[1.6] text-neutral-500 md:mt-8">
              유캐스팅 에이전시와 사전협의 없는
              <br className="md:hidden" />
              무단도용 및 복제, 배포를 금합니다.
            </p>
          </header>

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
    return <div className="absolute inset-0 bg-neutral-950" aria-hidden="true" />
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 grid w-[210vw] -translate-x-1/2 -translate-y-1/2 grid-cols-5 gap-2 opacity-55 md:w-[92vw] md:rotate-[-4deg] md:scale-110 md:gap-4">
        {items.map((item, index) => (
          <div
            className="relative aspect-[2/3] overflow-hidden bg-neutral-900"
            key={`${item.id}-${index}`}
          >
            <Image
              alt=""
              className="size-full object-cover"
              fill
              loading={index === HERO_POSTER_CENTER_INDEX || index < 4 ? 'eager' : 'lazy'}
              sizes="(max-width: 767px) 42vw, 18vw"
              src={item.imageUrl}
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function getCastingStatusHeroItems(items: CastingStatusPosterItem[]) {
  const posters = items.filter((item) => item.imageUrl)

  if (posters.length === 0) {
    return []
  }

  const arrangedItems = Array.from(
    { length: HERO_POSTER_COUNT },
    () => posters[posters.length - 1],
  )

  HERO_POSTER_SLOT_ORDER.forEach((slotIndex, sourceIndex) => {
    arrangedItems[slotIndex] = posters[Math.min(sourceIndex, posters.length - 1)]
  })

  return arrangedItems
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
