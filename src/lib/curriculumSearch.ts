import type { CenterSlug } from '@/lib/centers'
import type { Curriculum } from '@/payload-types'

export type CurriculumSearchField = {
  defaultValue?: string
  label: string
  name: string
  options: CurriculumSearchOption[]
}

export type CurriculumSearchOption = {
  label: string
  value: string
}

export type CurriculumPeriod = {
  end: string
  nextUpdate: string
  start: string
}

export const curriculumEducationDayFields = [
  ['educationDayMonday', '월'],
  ['educationDayTuesday', '화'],
  ['educationDayWednesday', '수'],
  ['educationDayThursday', '목'],
  ['educationDayFriday', '금'],
  ['educationDaySaturday', '토'],
  ['educationDaySunday', '일'],
] as const

const curriculumPeriodMonthsByCenter: Record<CenterSlug, 2 | 4> = {
  art: 2,
  avenue: 2,
  exam: 2,
  highteen: 4,
  kids: 2,
}

type CurriculumSearchSource = Pick<
  Curriculum,
  | 'educationDayFriday'
  | 'educationDayMonday'
  | 'educationDaySaturday'
  | 'educationDaySunday'
  | 'educationDayThursday'
  | 'educationDayTuesday'
  | 'educationDayWednesday'
  | 'educationStartTime'
>

export function buildCurriculumSearchFields({
  classOptions,
  curriculums,
  defaults = {},
}: {
  classOptions: CurriculumSearchOption[]
  curriculums: CurriculumSearchSource[]
  defaults?: {
    className?: string
    lessonCount?: string
    time?: string
  }
}): CurriculumSearchField[] {
  return [
    {
      defaultValue: defaults.className,
      label: '클래스(등급)',
      name: 'className',
      options: classOptions,
    },
    {
      defaultValue: defaults.lessonCount,
      label: '교육횟수',
      name: 'lessonCount',
      options: buildLessonCountOptions(curriculums),
    },
    {
      defaultValue: defaults.time,
      label: '시간대별 Class',
      name: 'time',
      options: buildTimeOptions(curriculums),
    },
  ]
}

export function getCurriculumPeriodMonths(center: CenterSlug) {
  return curriculumPeriodMonthsByCenter[center]
}

export function resolveCurrentCurriculumPeriod(
  center: CenterSlug,
  now = new Date(),
): CurriculumPeriod {
  const periodMonths = getCurriculumPeriodMonths(center)
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

export function getCurriculumEducationDays(curriculum: CurriculumSearchSource) {
  return curriculumEducationDayFields
    .filter(([field]) => curriculum[field] === true)
    .map(([, label]) => label)
}

export function buildLessonCountOptions(curriculums: CurriculumSearchSource[]) {
  const counts = Array.from(
    new Set(
      curriculums
        .map((curriculum) => getCurriculumEducationDays(curriculum).length)
        .filter((count) => count > 0),
    ),
  ).sort((left, right) => left - right)

  return counts.map((count) => ({
    label: `주 ${count}회`,
    value: String(count),
  }))
}

export function buildTimeOptions(curriculums: CurriculumSearchSource[]) {
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

export function normalizeTime(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/\d{1,2}:\d{2}/)

  return match?.[0] ?? value
}

export function getTimeGroup(value: string | null | undefined) {
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
