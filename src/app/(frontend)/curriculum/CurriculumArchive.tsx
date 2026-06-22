import configPromise from '@payload-config'
import { ChevronRight, Info, Search } from 'lucide-react'
import Link from 'next/link'
import { getPayload, type Where } from 'payload'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { CenterSlug } from '@/lib/centers'
import {
  curriculumClassOptionsByCenter,
  type CurriculumCenter,
} from '@/lib/curriculumOptions'
import type { Curriculum, Teacher } from '@/payload-types'
import { FilterSelect } from './FilterSelect.client'

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

const educationDayFields = [
  ['educationDayMonday', '월'],
  ['educationDayTuesday', '화'],
  ['educationDayWednesday', '수'],
  ['educationDayThursday', '목'],
  ['educationDayFriday', '금'],
  ['educationDaySaturday', '토'],
  ['educationDaySunday', '일'],
] as const

type SearchableCurriculumCenter = Extract<CurriculumCenter, 'art' | 'highteen'>

const curriculumCenters = new Set<SearchableCurriculumCenter>([
  'art',
  'highteen',
])

const curriculumPeriodMonthsByCenter: Record<SearchableCurriculumCenter, 2 | 4> = {
  art: 2,
  highteen: 4,
}

export function isCurriculumCenter(center: CenterSlug): center is SearchableCurriculumCenter {
  return curriculumCenters.has(center as SearchableCurriculumCenter)
}

export async function CurriculumArchive({ center, filters }: CurriculumArchiveProps) {
  const [curriculums, queryFailed] = await queryCurriculums(center)
  const classOptions = curriculumClassOptionsByCenter[center]
  const lessonCountOptions = buildLessonCountOptions(curriculums)
  const timeOptions = buildTimeOptions(curriculums)
  const visibleItems = curriculums
    .filter((curriculum) => matchesFilters(curriculum, filters))
    .sort((left, right) => curriculumSort(left, right, center))
    .map(toCurriculumCardItem)
  const period = resolveCurrentCurriculumPeriod(center)
  const periodMonths = curriculumPeriodMonthsByCenter[center]
  const decoIcons = getPageDecoIcons(4, `curriculum-${center}`)
  const hasActiveFilters = Boolean(filters.className || filters.lessonCount || filters.time)

  return (
    <main className="page page-light page-curriculum" data-center={center}>
      <section
        aria-labelledby="curriculum-hero-title"
        className="section-curriculum-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-70 grayscale"
          style={{ backgroundImage: "url('/assets/curriculum/hero.png')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/70" />
        <PageDeco
          className="-left-20 top-[36%] max-md:hidden! md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[12%] max-md:hidden! md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1
            className="section-curriculum-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
            id="curriculum-hero-title"
          >
            <span className="block text-brand">교육</span>
            <span className="block">커리큘럼</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="curriculum-search-title"
        className="section-curriculum-search bg-neutral-950 py-8 text-white md:py-10"
      >
        <div className="container grid gap-6 lg:grid-cols-[177px_minmax(0,1fr)] lg:items-center">
          <div className="section-curriculum-search__heading">
            <h2
              className="type-title-l font-extrabold leading-[1.3]"
              id="curriculum-search-title"
            >
              강의검색
            </h2>
            <p className="mt-1 inline-flex items-center gap-1 type-caption-m font-medium text-white/45">
              적용기간({periodMonths}개월단위로 갱신)
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      aria-label="적용기간 안내"
                      className="inline-grid size-5 place-items-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      type="button"
                    >
                      <Info aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-sm leading-normal">
                    기간 : {period.start} ~ {period.end}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          </div>

          <form
            action={`/${center}/curriculum`}
            className="section-curriculum-search__form grid gap-2 md:grid-cols-4"
          >
            <FilterSelect
              defaultValue={filters.className}
              key={`className-${filters.className ?? ''}`}
              label="클래스(등급)"
              name="className"
              options={classOptions.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
            />
            <FilterSelect
              defaultValue={filters.lessonCount}
              key={`lessonCount-${filters.lessonCount ?? ''}`}
              label="교육횟수"
              name="lessonCount"
              options={lessonCountOptions}
            />
            <FilterSelect
              defaultValue={filters.time}
              key={`time-${filters.time ?? ''}`}
              label="시간대별 Class"
              name="time"
              options={timeOptions}
            />
            <button
              className="section-curriculum-search__submit min-h-16 inline-flex items-center justify-center gap-2 bg-brand px-6 type-label-l font-extrabold text-white transition-opacity hover:opacity-90 cursor-pointer"
              type="submit"
            >
              강의검색
              <Search aria-hidden="true" className="size-4" strokeWidth={2.4} />
            </button>
          </form>
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

          <CurriculumNotice period={period} />
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
        <p className="type-label-m font-bold leading-[1.2] text-neutral-800">
          {item.className}
        </p>
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
          <p className="mt-3 type-body-m font-medium text-neutral-500">
            {item.teacherName}
          </p>
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

function CurriculumNotice({ period }: { period: CurriculumPeriod }) {
  return (
    <div className="section-curriculum-list__notice mt-12 type-body-s leading-[1.6] text-neutral-500 md:mt-16">
      <p>
        · 커리큘럼은 &lt;2개월 단위&gt;로 갱신되며,
        {` 다음 커리큘럼은 ${period.nextUpdate} 새롭게 업데이트 됩니다.`}
      </p>
      <p>
        · 모든 커리큘럼은 같은 레벨의 클래스라도 각 선생님의 특성에 따라 디테일한
        차이가 있습니다. 신규학생은 각반의 커리큘럼을 반드시 확인하시기 바랍니다.
      </p>
      <p>
        · 적용기간 : {period.start} ~ {period.end}
      </p>
    </div>
  )
}

async function queryCurriculums(center: SearchableCurriculumCenter): Promise<[Curriculum[], boolean]> {
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

  if (filters.lessonCount && !matchesLessonCount(getEducationDays(curriculum).length, filters.lessonCount)) {
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
    days: getEducationDays(curriculum),
    id: curriculum.id,
    slug: curriculum.slug,
    startTime: normalizeTime(curriculum.educationStartTime),
    teacherName: teacher?.name ? `배우 ${teacher.name}` : '교육진 미정',
    topic: firstLesson?.topic ?? curriculum.title ?? '강의 주제 미정',
  }
}

function getEducationDays(curriculum: Curriculum) {
  return educationDayFields
    .filter(([field]) => curriculum[field] === true)
    .map(([, label]) => label)
}

function buildLessonCountOptions(curriculums: Curriculum[]) {
  const counts = Array.from(
    new Set(
      curriculums
        .map((curriculum) => getEducationDays(curriculum).length)
        .filter((count) => count > 0),
    ),
  ).sort((left, right) => left - right)

  return counts.map((count) => ({
    label: `주 ${count}회`,
    value: String(count),
  }))
}

function buildTimeOptions(curriculums: Curriculum[]) {
  const startTimes = Array.from(
    new Set(
      curriculums
        .map((curriculum) => normalizeTime(curriculum.educationStartTime))
        .filter((time): time is string => Boolean(time)),
    ),
  ).sort((left, right) => left.localeCompare(right))

  return startTimes.map((time) => ({
    label: `${time} 시작`,
    value: time,
  }))
}

function normalizeTime(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/\d{1,2}:\d{2}/)

  return match?.[0] ?? value
}

function getTimeGroup(value: string | null | undefined) {
  const time = normalizeTime(value)
  const hour = time ? Number(time.split(':')[0]) : Number.NaN

  if (Number.isNaN(hour)) {
    return undefined
  }

  if (hour < 12) {
    return 'morning'
  }

  if (hour < 18) {
    return 'afternoon'
  }

  return 'evening'
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

type CurriculumPeriod = {
  end: string
  nextUpdate: string
  start: string
}

function resolveCurrentCurriculumPeriod(
  center: SearchableCurriculumCenter,
  now = new Date(),
): CurriculumPeriod {
  const periodMonths = curriculumPeriodMonthsByCenter[center]
  const { month, year } = getKoreaDateParts(now)
  const startMonth = Math.floor((month - 1) / periodMonths) * periodMonths
  const start = new Date(year, startMonth, 1)

  const end = new Date(start)
  end.setMonth(end.getMonth() + periodMonths)
  end.setDate(end.getDate() - 1)

  const nextUpdate = new Date(end)
  nextUpdate.setDate(nextUpdate.getDate() + 1)

  return {
    end: formatDate(end),
    nextUpdate: formatKoreanDate(nextUpdate),
    start: formatDate(start),
  }
}

function getKoreaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(date)

  const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    month: Number(valueByType.month),
    year: Number(valueByType.year),
  }
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}

function formatKoreanDate(date: Date) {
  return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`
}
