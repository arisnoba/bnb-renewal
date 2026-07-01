import type { CenterSlug } from '@/lib/centers'
import type { AuditionSchedule } from '@/payload-types'

import { PageIntro } from '@/components/PageIntro'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { getCenterLabel } from '@/lib/centers'
import configPromise from '@payload-config'
import Image from 'next/image'
import { getPayload, type Where } from 'payload'

import { MonthNavigator } from './MonthNavigator.client'

type SchedulePageProps = {
  center: CenterSlug
  month: number
  year: number
}

type ScheduleListItem = Pick<
  AuditionSchedule,
  'eventType' | 'id' | 'scheduleEndDate' | 'scheduleStartDate' | 'title'
>

type CalendarDay = {
  date: Date
  day: number
  events: ScheduleListItem[]
  inMonth: boolean
  key: string
}

type ScheduleEventType = NonNullable<AuditionSchedule['eventType']>

const scheduleHeroImage = '/assets/casting-system/hero.png'
const calendarWeekdays = ['일', '월', '화', '수', '목', '금', '토'] as const
const scheduleCenters = ['art', 'avenue', 'highteen', 'kids'] as const

const eventTypeMeta: Record<
  ScheduleEventType,
  {
    barClassName: string
    label: string
    textClassName: string
  }
> = {
  shooting: {
    barClassName: 'bg-[#4D94F8]',
    label: '촬영',
    textClassName: 'text-[#4D94F8]',
  },
  audition: {
    barClassName: 'bg-[#8A4FFF]',
    label: '오디션',
    textClassName: 'text-[#8A4FFF]',
  },
  schedule: {
    barClassName: 'bg-[#20C46B]',
    label: '일정',
    textClassName: 'text-[#20C46B]',
  },
}

export async function SchedulePage({ center, month, year }: SchedulePageProps) {
  const payload = await getPayload({ config: configPromise })
  const calendarMonth = normalizeMonth(month)
  const calendarYear = normalizeYear(year)
  const events = await findScheduleEvents({
    center,
    month: calendarMonth,
    payload,
    year: calendarYear,
  })
  const days = createCalendarDays(calendarYear, calendarMonth, events)
  const monthDays = days.filter((day) => day.inMonth)
  const filledMonthDays = monthDays.filter((day) => day.events.length > 0)
  const decoIcons = getPageDecoIcons(3, `schedule-${center}`)
  const currentLabel = `${calendarYear} ${calendarMonth}월`
  const previousHref = createMonthHref(center, calendarYear, calendarMonth, -1)
  const nextHref = createMonthHref(center, calendarYear, calendarMonth, 1)
  const centerLabel = getCenterLabel(center)

  return (
    <main className="page page-light page-schedule" data-center={center}>
      <section
        aria-labelledby="schedule-hero-title"
        className="section-schedule-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-center opacity-60"
          fill
          priority
          sizes="100vw"
          src={scheduleHeroImage}
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[36%] max-md:hidden! md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[12%] max-md:hidden! md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[18%] bottom-[-8%] max-md:hidden! md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[142px]">
          <div
            className="section-schedule-hero__title page-hero-label"
            id="schedule-hero-title"
          >
            <span className="block text-brand">캐스팅</span>
            <span className="block">촬영ㆍ오디션 스케줄</span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="schedule-calendar-title"
        className="section-schedule-calendar section-p-block-base bg-white text-neutral-900"
      >
        <div className="container">
          <PageIntro
            className="section-schedule-calendar__head mb-10 md:mb-16"
            eyebrow="이달의 촬영ㆍ오디션 스케줄"
            eyebrowClassName="section-schedule-calendar__eyebrow"
            id="schedule-calendar-title"
            title={`배우앤배움 ${centerLabel}의 촬영 및\n오디션 스케줄을 한눈에 보실 수 있습니다.`}
            titleClassName="section-schedule-calendar__title"
          />

          <MonthNavigator
            center={center}
            currentMonth={calendarMonth}
            currentYear={calendarYear}
            currentLabel={currentLabel}
            nextHref={nextHref}
            previousHref={previousHref}
          />

          <div className="section-schedule-calendar__desktop mt-10 hidden min-[769px]:block">
            <CalendarGrid days={days} />
          </div>

          <div className="section-schedule-calendar__mobile mt-8 min-[769px]:hidden">
            <TimelineList days={filledMonthDays} />
          </div>

          <ScheduleLegend className="mt-8 justify-end lg:justify-start md:mt-6" />
        </div>
      </section>
    </main>
  )
}

function CalendarGrid({ days }: { days: CalendarDay[] }) {
  return (
    <div className="section-schedule-calendar__grid overflow-hidden border border-neutral-200">
      <div className="grid grid-cols-7 border-b border-neutral-200 bg-white">
        {calendarWeekdays.map((weekday) => (
          <div
            className="border-r border-neutral-200 px-3 py-3 type-caption-s font-semibold text-neutral-500 last:border-r-0"
            key={weekday}
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => (
          <div
            className={[
              'section-schedule-calendar__day min-h-32 border-r border-b border-neutral-200 p-3 last:border-r-0 lg:min-h-38',
              (index + 1) % 7 === 0 ? 'border-r-0' : '',
              index >= days.length - 7 ? 'border-b-0' : '',
              day.inMonth ? 'bg-white' : 'bg-neutral-50 text-neutral-400',
            ].join(' ')}
            key={day.key}
          >
            <div className="type-label-m font-semibold leading-[1.2]">
              {day.day}
            </div>
            {day.events.length > 0 ? (
              <div className="mt-6 flex flex-col gap-1.5">
                {day.events.slice(0, 3).map((event) => (
                  <CalendarEvent event={event} key={event.id} />
                ))}
                {day.events.length > 3 ? (
                  <p className="type-caption-s font-medium text-neutral-500">
                    외 {day.events.length - 3}건
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarEvent({ event }: { event: ScheduleListItem }) {
  const meta = getEventTypeMeta(event.eventType)

  return (
    <div
      className={[
        'section-schedule-calendar__event rounded-sm px-2 py-1 type-caption-s font-medium leading-[1.35]',
        meta.textClassName,
        getEventBackgroundClassName(event.eventType),
      ].join(' ')}
    >
      <p className="line-clamp-2">{event.title}</p>
    </div>
  )
}

function TimelineList({ days }: { days: CalendarDay[] }) {
  if (days.length === 0) {
    return (
      <div className="section-schedule-calendar__empty flex flex-col items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 py-16 text-center">
        <p className="type-body-s font-semibold text-neutral-500">등록된 스케줄이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="section-schedule-calendar__timeline flex flex-col gap-8">
      {days.map((day) => (
        <article className="section-schedule-calendar__timeline-day flex gap-4 items-start" key={day.key}>
          <div className="w-14 shrink-0 flex flex-col items-center py-2.5 bg-neutral-50 rounded-xl text-center border border-neutral-100">
            <span className="type-caption-s font-bold text-neutral-400">
              {calendarWeekdays[day.date.getUTCDay()]}
            </span>
            <span className="mt-0.5 type-title-m font-extrabold text-neutral-900 leading-none">
              {day.day}
            </span>
          </div>
          <div className="section-schedule-calendar__timeline-events flex-1 flex flex-col gap-3 min-w-0">
            {day.events.map((event) => (
              <TimelineEvent event={event} key={event.id} />
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function TimelineEvent({ event }: { event: ScheduleListItem }) {
  const meta = getEventTypeMeta(event.eventType)

  return (
    <div
      className={[
        'section-schedule-calendar__timeline-event flex flex-col gap-2 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm',
        getEventBorderClassName(event.eventType),
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={[
            'inline-flex items-center px-2.5 py-0.5 rounded-full type-caption-s font-bold',
            meta.textClassName,
            getEventBackgroundClassName(event.eventType),
          ].join(' ')}
        >
          {meta.label}
        </span>
      </div>
      <p className="type-body-s font-medium text-neutral-800 leading-snug break-all">{event.title}</p>
    </div>
  )
}

function getEventBorderClassName(eventType: AuditionSchedule['eventType']) {
  if (eventType === 'audition') {
    return 'border-l-4 border-l-[#8A4FFF]'
  }
  if (eventType === 'shooting') {
    return 'border-l-4 border-l-[#4D94F8]'
  }
  return 'border-l-4 border-l-[#20C46B]'
}

function ScheduleLegend({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'section-schedule-calendar__legend flex flex-wrap items-center gap-x-6 gap-y-2 type-caption-l font-medium text-neutral-600',
        className,
      ].join(' ')}
    >
      {(Object.keys(eventTypeMeta) as ScheduleEventType[]).map((eventType) => {
        const meta = eventTypeMeta[eventType]

        return (
          <span className="inline-flex items-center gap-2" key={eventType}>
            <span
              aria-hidden="true"
              className={['size-2 rounded-full', meta.barClassName].join(' ')}
            />
            {meta.label}
          </span>
        )
      })}
    </div>
  )
}

async function findScheduleEvents({
  center,
  month,
  payload,
  year,
}: {
  center: CenterSlug
  month: number
  payload: Awaited<ReturnType<typeof getPayload>>
  year: number
}): Promise<ScheduleListItem[]> {
  const monthStart = toDateInput(year, month, 1)
  const nextMonthStart = toDateInput(...addMonths(year, month, 1), 1)
  const where: Where = {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      {
        or: [
          {
            centers: {
              equals: center,
            },
          },
          {
            centers: {
              equals: 'all',
            },
          },
        ],
      },
      {
        scheduleStartDate: {
          less_than: nextMonthStart,
        },
      },
      {
        scheduleEndDate: {
          greater_than_equal: monthStart,
        },
      },
    ],
  }

  const result = await payload
    .find({
      collection: 'audition-schedules',
      depth: 0,
      limit: 200,
      overrideAccess: false,
      pagination: false,
      select: {
        eventType: true,
        scheduleEndDate: true,
        scheduleStartDate: true,
        title: true,
      },
      sort: 'scheduleStartDate',
      where,
    })
    .catch(() => ({
      docs: [],
    }))

  return result.docs as ScheduleListItem[]
}

function createCalendarDays(
  year: number,
  month: number,
  events: ScheduleListItem[],
): CalendarDay[] {
  const firstDay = dateFromParts(year, month, 1)
  const lastDay = dateFromParts(year, month + 1, 0)
  const gridStart = addDays(firstDay, -firstDay.getUTCDay())
  const gridEnd = addDays(lastDay, 6 - lastDay.getUTCDay())
  const dayCount = differenceInCalendarDays(gridStart, gridEnd) + 1

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(gridStart, index)
    const dateKey = toDateKey(date)

    return {
      date,
      day: date.getUTCDate(),
      events: events.filter((event) => eventOccursOnDate(event, dateKey)),
      inMonth: date.getUTCMonth() === month - 1,
      key: dateKey,
    }
  })
}

function eventOccursOnDate(event: ScheduleListItem, dateKey: string) {
  const startKey = toDateKey(parsePayloadDate(event.scheduleStartDate))
  const endKey = toDateKey(parsePayloadDate(event.scheduleEndDate ?? event.scheduleStartDate))

  return startKey <= dateKey && dateKey <= endKey
}

function parsePayloadDate(value: string) {
  const [year = '1970', month = '1', day = '1'] = value.slice(0, 10).split('-')

  return dateFromParts(Number(year), Number(month), Number(day))
}

function dateFromParts(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)

  nextDate.setUTCDate(nextDate.getUTCDate() + days)

  return nextDate
}

function differenceInCalendarDays(startDate: Date, endDate: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.round((endDate.getTime() - startDate.getTime()) / millisecondsPerDay)
}

function addMonths(year: number, month: number, offset: number): [number, number] {
  const date = dateFromParts(year, month + offset, 1)

  return [date.getUTCFullYear(), date.getUTCMonth() + 1]
}

function toDateInput(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
}

function toDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function createMonthHref(
  center: CenterSlug,
  year: number,
  month: number,
  offset: number,
) {
  const [nextYear, nextMonth] = addMonths(year, month, offset)

  return `/${center}/schedule?year=${nextYear}&month=${nextMonth}`
}

function getEventTypeMeta(eventType: AuditionSchedule['eventType']) {
  return eventTypeMeta[eventType ?? 'schedule']
}

function getEventBackgroundClassName(eventType: AuditionSchedule['eventType']) {
  if (eventType === 'audition') {
    return 'bg-[#8A4FFF]/10'
  }

  if (eventType === 'shooting') {
    return 'bg-[#4D94F8]/10'
  }

  return 'bg-[#20C46B]/10'
}

function normalizeMonth(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 12 ? value : currentMonth()
}

function normalizeYear(value: number) {
  return Number.isInteger(value) && value >= 2000 && value <= 2100 ? value : currentYear()
}

function currentMonth() {
  return new Date().getMonth() + 1
}

function currentYear() {
  return new Date().getFullYear()
}

export function isScheduleCenter(center: CenterSlug): center is (typeof scheduleCenters)[number] {
  return scheduleCenters.includes(center as (typeof scheduleCenters)[number])
}
