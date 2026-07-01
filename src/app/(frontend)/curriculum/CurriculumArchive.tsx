import configPromise from '@payload-config'
import { ChevronRight, Info } from 'lucide-react'
import Link from 'next/link'
import { getPayload, type Where } from 'payload'

import { getEducationHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
import { CurriculumSearchForm } from '@/components/CurriculumSearchForm.client'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CenterSlug } from '@/lib/centers'
import { curriculumClassOptionsByCenter, type CurriculumCenter } from '@/lib/curriculumOptions'
import {
  buildCurriculumSearchFields,
  type CurriculumPeriod,
  getCurriculumEducationDays,
  getCurriculumPeriodMonths,
  getTimeGroup,
  normalizeTime,
  resolveCurrentCurriculumPeriod,
} from '@/lib/curriculumSearch'
import type { Curriculum, Teacher } from '@/payload-types'

type CurriculumArchiveProps = {
  center: SearchableCurriculumCenter
  filters: CurriculumFilters
}

export type CurriculumFilters = {
  className?: string
  lessonCount?: string
  time?: string
}

type CurriculumCardItem = {
  className: string
  days: string[]
  id: number
  slug: string
  startTime: string | null
  teacherName: string
  topic: string
}

type SearchableCurriculumCenter = Extract<CurriculumCenter, 'art' | 'highteen'>

const curriculumCenters = new Set<SearchableCurriculumCenter>(['art', 'highteen'])

export function isCurriculumCenter(center: CenterSlug): center is SearchableCurriculumCenter {
  return curriculumCenters.has(center as SearchableCurriculumCenter)
}

export async function CurriculumArchive({ center, filters }: CurriculumArchiveProps) {
  const [curriculums, queryFailed] = await queryCurriculums(center)
  const classOptions = curriculumClassOptionsByCenter[center]
  const searchFields = buildCurriculumSearchFields({
    classOptions,
    curriculums,
    defaults: filters,
  })
  const visibleItems = curriculums
    .filter((curriculum) => matchesFilters(curriculum, filters))
    .sort((left, right) => curriculumSort(left, right, center))
    .map(toCurriculumCardItem)
  const period = resolveCurrentCurriculumPeriod(center)
  const periodMonths = getCurriculumPeriodMonths(center)
  const decoIcons = getPageDecoIcons(4, `curriculum-${center}`)
  const hasActiveFilters = Boolean(filters.className || filters.lessonCount || filters.time)

  return (
    <main className="page page-light page-curriculum" data-center={center}>
      <section
        aria-labelledby="curriculum-hero-title"
        className="section-curriculum-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <PageHeroImage image={getEducationHeroImage(center)} />
        <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
        <PageDeco className="-left-20 top-[36%] max-md:hidden! md:-left-28" icon={decoIcons[0]} />
        <PageDeco
          className="right-[-72px] top-[12%] max-md:hidden! md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[142px]">
          <h1
            className="section-curriculum-hero__title page-hero-label"
            id="curriculum-hero-title"
          >
            <span className="block text-brand">교육</span>
            <span className="block">커리큘럼</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="curriculum-search-title"
        className="section-curriculum-search bg-neutral-950 py-6 text-white md:py-8"
      >
        <div className="container grid gap-6 lg:grid-cols-[177px_minmax(0,1fr)] lg:items-center">
          <div className="section-curriculum-search__heading">
            <h2 className="type-title-l font-extrabold leading-[1.3]" id="curriculum-search-title">
              강의검색
            </h2>
            <CurriculumPeriodTooltip center={center} period={period} periodMonths={periodMonths} />
          </div>

          <CurriculumSearchForm
            action={`/${center}/curriculum`}
            fields={searchFields}
            variant="curriculumArchive"
          />
        </div>
      </section>

      <section className="section-curriculum-list section-p-b-base bg-white pt-14 text-neutral-900 md:pt-20">
        <div className="container">
          {queryFailed ? (
            <p className="section-curriculum-list__empty border-y border-neutral-200 py-18 text-center type-title-s font-semibold text-neutral-500">
              커리큘럼을 불러오지 못했습니다.
            </p>
          ) : visibleItems.length > 0 ? (
            <div className="section-curriculum-list__grid grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <CurriculumCard center={center} item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="section-curriculum-list__empty mt-16 border-y border-neutral-200 py-18 text-center">
              <p className="type-title-s font-semibold text-neutral-500">
                조건에 맞는 커리큘럼이 없습니다.
              </p>
              {hasActiveFilters ? (
                <Link
                  className="mt-5 inline-flex h-[43px] items-center justify-center rounded-full bg-neutral-900 px-5 type-label-m font-bold text-white transition-colors hover:bg-brand"
                  href={`/${center}/curriculum`}
                >
                  전체 커리큘럼 보기
                  <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
                </Link>
              ) : null}
            </div>
          )}

          <CurriculumNotice period={period} periodMonths={periodMonths} />
        </div>
      </section>
    </main>
  )
}

function CurriculumCard({
  center,
  item,
}: {
  center: SearchableCurriculumCenter
  item: CurriculumCardItem
}) {
  const detailHref = `/${center}/curriculum/${encodeURIComponent(item.slug)}`

  return (
    <article className="section-curriculum-card group/card flex min-h-[429px] flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-8">
      <header className="section-curriculum-card__head flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-sm bg-brand/80 type-label-m font-black text-white"
        >
          {classMark(item.className)}
        </span>
        <p className="type-label-m font-bold leading-[1.2] text-neutral-800">{item.className}</p>
      </header>

      <div className="section-curriculum-card__body flex flex-1 flex-col justify-between pt-9">
        <div>
          <h3 className="type-headline-l font-bold leading-[1.35] text-neutral-900 line-clamp-3">
            <Link
              className="transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              href={detailHref}
            >
              {item.topic}
            </Link>
          </h3>
          <p className="mt-3 type-body-m font-medium text-neutral-500">{item.teacherName}</p>
        </div>

        <div className="section-curriculum-card__meta mt-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-neutral-300 px-5 type-label-m font-extrabold text-white transition-colors hover:bg-brand group-hover/card:bg-brand"
            href={detailHref}
          >
            수강 신청
          </Link>
          <div className="flex flex-wrap justify-end gap-1">
            {item.days.map((day) => (
              <span
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-black/5 px-3 type-label-m font-medium text-neutral-900"
                key={day}
              >
                {day}
              </span>
            ))}
            {item.startTime ? (
              <span className="inline-flex min-h-10 items-center justify-center rounded-full bg-black/5 px-3 type-label-m font-medium text-neutral-900">
                {item.startTime}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function CurriculumNotice({
  period,
  periodMonths,
}: {
  period: CurriculumPeriod
  periodMonths: number
}) {
  return (
    <ul className="section-curriculum-list__notice mt-12 list-disc space-y-1 pl-5 type-body-s leading-[1.6] text-neutral-500 md:mt-16">
      <li>
        커리큘럼은 &lt;{periodMonths}개월 단위&gt;로 갱신되며,
        {` 다음 커리큘럼은 ${period.nextUpdate} 새롭게 업데이트 됩니다.`}
      </li>
      <li>
        모든 커리큘럼은 같은 레벨의 클래스라도 각 선생님의 특성에 따라 디테일한
        차이가 있습니다. 신규학생은 각반의 커리큘럼을 반드시 확인하시기 바랍니다.
      </li>
      <li>적용기간 : {period.start} ~ {period.end}</li>
    </ul>
  )
}

async function queryCurriculums(
  center: SearchableCurriculumCenter,
): Promise<[Curriculum[], boolean]> {
  const payload = await getPayload({ config: configPromise })
  const where: Where = {
    centers: {
      equals: center,
    },
  }

  const result = await payload
    .find({
      collection: 'curriculums',
      depth: 1,
      limit: 200,
      overrideAccess: false,
      pagination: false,
      sort: '-educationStartDate',
      where,
    })
    .catch(() => null)

  if (!result) {
    return [[], true]
  }

  return [result.docs as Curriculum[], false]
}

function matchesFilters(curriculum: Curriculum, filters: CurriculumFilters) {
  if (filters.className && curriculum.className !== filters.className) {
    return false
  }

  if (
    filters.lessonCount &&
    !matchesLessonCount(getCurriculumEducationDays(curriculum).length, filters.lessonCount)
  ) {
    return false
  }

  if (filters.time && !matchesTimeFilter(curriculum.educationStartTime, filters.time)) {
    return false
  }

  return true
}

function matchesLessonCount(count: number, filter: string) {
  if (filter === '3plus') {
    return count >= 3
  }

  return String(count) === filter
}

function matchesTimeFilter(value: string | null | undefined, filter: string) {
  const startTime = normalizeTime(value)

  if (!startTime) {
    return false
  }

  return startTime === filter || getTimeGroup(startTime) === filter
}

function toCurriculumCardItem(curriculum: Curriculum): CurriculumCardItem {
  const firstLesson = curriculum.curriculumLessons?.find((lesson) => lesson.topic || lesson.content)
  const teacher = typeof curriculum.teacher === 'object' ? (curriculum.teacher as Teacher) : null

  return {
    className: curriculum.className ?? '클래스 미정',
    days: getCurriculumEducationDays(curriculum),
    id: curriculum.id,
    slug: curriculum.slug,
    startTime: normalizeTime(curriculum.educationStartTime),
    teacherName: teacher?.name ? `배우 ${teacher.name}` : '교육진 미정',
    topic: firstLesson?.topic ?? curriculum.title ?? '강의 주제 미정',
  }
}

function curriculumSort(left: Curriculum, right: Curriculum, center: SearchableCurriculumCenter) {
  const classOrder = curriculumClassOptionsByCenter[center].map((option) => option.value)
  const classDiff =
    classOrder.indexOf(left.className ?? '') - classOrder.indexOf(right.className ?? '')

  if (classDiff !== 0) {
    return classDiff
  }

  return (left.educationStartTime ?? '').localeCompare(right.educationStartTime ?? '')
}

function classMark(label: string) {
  const englishClass = label.match(/\b([A-Z])\s*CLASS\b/i)

  if (englishClass) {
    return englishClass[1].toUpperCase()
  }

  if (label.includes('입시예비')) {
    return '예비'
  }

  if (label.includes('예고')) {
    return '예고'
  }

  if (label.includes('특강')) {
    return '특강'
  }

  return label.slice(0, 2)
}

function CurriculumPeriodTooltip({
  center,
  period,
  periodMonths,
}: {
  center: SearchableCurriculumCenter
  period: CurriculumPeriod
  periodMonths: number
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label={`강의 갱신 기간 안내: ${period.start}부터 ${period.end}까지`}
            className="mt-1 inline-flex items-center gap-.5 text-sm font-medium text-white/45 transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            type="button"
          >
            강의 갱신 : {periodMonths}개월
            <Info aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-brand text-sm leading-normal"
          arrowClassName="fill-brand"
          data-center={center}
        >
          기간 : {period.start} ~ {period.end}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
