import configPromise from '@payload-config'
import { BookOpen, CalendarDays, ChevronDown, Clock3, UserRound, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { ReactNode } from 'react'
import { getPayload } from 'payload'

import { Media } from '@/components/Media/Renderer'
import type { CenterSlug } from '@/lib/centers'
import type { Curriculum, Media as PayloadMedia, Teacher } from '@/payload-types'

import { CurriculumStickyCta } from './CurriculumBottomSheet.client'

type CurriculumDetailPageProps = {
  center: Extract<CenterSlug, 'art' | 'highteen'>
  curriculumSlug: string
}

type DetailModel = {
  capacity: string
  className: string
  consultHref: string
  dayLabel: string
  educationDate: string
  lessonCount: string
  lessons: {
    content: string
    topic: string
  }[]
  summaryMeta: string
  teacher: TeacherSummary
  timeRange: string
  title: string
}

type TeacherSummary = {
  careerItems: {
    content: string | null
    title: string
  }[]
  image: number | PayloadMedia | null
  name: string
  role: string | null
  summary: string | null
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

export async function CurriculumDetailPage({
  center,
  curriculumSlug,
}: CurriculumDetailPageProps) {
  const curriculum = await queryCurriculumBySlug({ center, slug: curriculumSlug }).catch(() => null)

  if (!curriculum) {
    notFound()
  }

  const model = toDetailModel(curriculum, center)

  return (
    <main
      className="page page-light page-curriculum-detail page-top-offset pb-30 text-neutral-900 lg:pb-0"
      data-center={center}
    >
      <section className="section-curriculum-detail section-p-block-base bg-white">
        <div className="container">
          <div className="section-curriculum-detail__layout mx-auto grid max-w-[1160px] gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12">
            <header className="section-curriculum-detail__intro order-1 min-w-0 lg:col-start-1">
              <p className="mb-5 inline-flex min-h-9 items-center rounded-full bg-neutral-900 px-4 type-label-m font-extrabold text-white">
                {model.className}
              </p>
              <h1 className="type-headline-xl font-black leading-[1.18] text-neutral-900">
                {model.lessons[0]?.topic ?? model.title}
              </h1>
              <p className="mt-5 type-title-s font-bold leading-[1.45] text-neutral-500">
                {model.dayLabel} / {model.timeRange}
              </p>
            </header>

            <aside className="section-curriculum-detail__side order-3 lg:sticky lg:top-[calc(var(--page-top-offset)+32px)] lg:order-2 lg:col-start-2 lg:row-span-4 lg:row-start-1">
              <CurriculumOverview model={model} />
              <Link
                className="mt-4 hidden min-h-[58px] w-full items-center justify-center bg-brand px-7 type-label-l font-extrabold text-white transition-opacity hover:opacity-90 lg:inline-flex"
                href={model.consultHref}
              >
                수강상담신청
              </Link>
            </aside>

            <div className="section-curriculum-detail__visual relative order-2 aspect-[16/8.4] w-full overflow-hidden bg-neutral-300 md:mt-2 lg:col-start-1">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/assets/curriculum/hero.png')" }}
              />
              <div aria-hidden="true" className="absolute inset-0 bg-black/10" />
            </div>

            <TeacherBrief className="order-4 lg:col-start-1" teacher={model.teacher} />

            <section
              aria-labelledby="curriculum-lessons-title"
              className="section-curriculum-detail__lessons order-5 mt-6 md:mt-10 lg:col-start-1"
            >
              <div className="mb-8 border-b-[3px] border-neutral-900 pb-5 md:mb-10">
                <p className="type-caption-m font-extrabold uppercase tracking-normal text-brand">
                  Curriculum
                </p>
                <h2
                  className="mt-2 type-title-l font-black leading-[1.25] text-neutral-900"
                  id="curriculum-lessons-title"
                >
                  주차별 커리큘럼
                </h2>
              </div>

              <ol>
                {model.lessons.map((lesson, index) => (
                  <li
                    className="grid gap-5 border-b border-black/10 py-8 md:grid-cols-[108px_minmax(0,1fr)] md:gap-10 md:py-10"
                    key={`${lesson.topic}-${index}`}
                  >
                    <div className="flex items-end gap-2 md:block">
                      <span className="block type-headline-l font-black leading-[1.1] text-brand">
                        {index + 1}
                      </span>
                      <span className="block pb-1 type-label-l font-bold text-neutral-400 md:pb-0">
                        주차
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="type-title-s font-extrabold leading-[1.4] text-neutral-900">
                        {lesson.topic}
                      </h3>
                      <p className="mt-2 whitespace-pre-line type-body-m font-medium leading-[1.65] text-neutral-600">
                        {lesson.content}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </section>

      <CurriculumStickyCta
        consultHref={model.consultHref}
        meta={model.summaryMeta}
        title={model.title}
      />
    </main>
  )
}

export const queryCurriculumBySlug = cache(
  async ({ center, slug }: { center: string; slug: string }) => {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'curriculums',
      depth: 2,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            centers: {
              equals: center,
            },
          },
        ],
      },
    })

    return (result.docs?.[0] as Curriculum | undefined) ?? null
  },
)

export const queryCurriculumStaticParams = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'curriculums',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      centers: true,
      slug: true,
    },
  })

  return result.docs as Pick<Curriculum, 'centers' | 'slug'>[]
})

function CurriculumOverview({ model }: { model: DetailModel }) {
  return (
    <section
      aria-labelledby="curriculum-overview-title"
      className="section-curriculum-detail__overview mt-10 bg-neutral-100 p-4 text-black md:mt-12 md:p-8 lg:mt-0"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-caption-m font-extrabold uppercase tracking-normal text-brand">
            Class Overview
          </p>
          <h2
            className="mt-2 type-title-m font-black leading-[1.3]"
            id="curriculum-overview-title"
          >
            수강 정보
          </h2>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 bg-white/10">
        <OverviewItem
          icon={<BookOpen aria-hidden="true" className="size-5" strokeWidth={2.2} />}
          label="클래스"
          value={model.className}
        />
        <OverviewItem
          icon={<CalendarDays aria-hidden="true" className="size-5" strokeWidth={2.2} />}
          label="수업 요일"
          value={model.dayLabel}
        />
        <OverviewItem
          icon={<Clock3 aria-hidden="true" className="size-5" strokeWidth={2.2} />}
          label="교육 시간"
          value={model.timeRange}
        />
        <OverviewItem
          icon={<CalendarDays aria-hidden="true" className="size-5" strokeWidth={2.2} />}
          label="교육 시작일"
          value={model.educationDate}
        />
        <OverviewItem
          icon={<Users aria-hidden="true" className="size-5" strokeWidth={2.2} />}
          label="교육 횟수"
          value={model.lessonCount}
        />
        <OverviewItem
          icon={<UserRound aria-hidden="true" className="size-5" strokeWidth={2.2} />}
          label="정원"
          value={model.capacity}
        />
      </div>
    </section>
  )
}

function OverviewItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2 text-black/45">
        {icon}
        <p className="type-label-m font-bold">{label}</p>
      </div>
      <p className="type-title-s font-bold text-neutral-900">
        {value}
      </p>
    </div>
  )
}

function TeacherBrief({
  className = '',
  teacher,
}: {
  className?: string
  teacher: TeacherSummary
}) {
  const image = teacher.image
  const hasImage = image && typeof image === 'object'
  const careerItems = teacher.careerItems

  return (
    <section
      aria-labelledby="curriculum-teacher-title"
      className={`section-curriculum-detail__teacher border border-neutral-200 bg-neutral-50 p-6 md:p-8 ${className}`}
    >
      <div className="grid gap-6 md:grid-cols-[156px_minmax(0,1fr)] md:items-start">
        <div className="relative aspect-square w-36 overflow-hidden bg-neutral-900 md:w-full">
          {hasImage ? (
            <Media
              fill
              htmlElement={null}
              imgClassName="size-full object-cover object-top grayscale"
              pictureClassName="block size-full"
              resource={image}
              size="156px"
            />
          ) : (
            <div className="grid size-full place-items-center type-headline-m font-black text-white">
              {teacher.name.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex flex-col justify-center h-full">
          <p className="type-caption-m font-extrabold uppercase tracking-normal text-brand">
            Instructor
          </p>
          <div className="mt-2">
            <h2
              className="type-title-l font-black leading-[1.25] text-neutral-900"
              id="curriculum-teacher-title"
            >
              {teacher.name}
            </h2>
            {(teacher.role || teacher.summary) && (
              <p className="mt-2 type-body-m font-semibold leading-[1.55] text-neutral-500">
                {[teacher.role, teacher.summary].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {careerItems.length > 0 ? (
            <details className="group border-neutral-200 mt-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 type-label-m font-extrabold text-neutral-900 transition-colors hover:border-brand hover:text-brand [&::-webkit-details-marker]:hidden">
                <span>프로필 자세히보기</span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition-transform group-open:rotate-180"
                  strokeWidth={2.4}
                />
              </summary>
              <dl className="mt-6 grid gap-3">
                {careerItems.map((item) => (
                  <div className="grid gap-1 md:grid-cols-[120px_minmax(0,1fr)]" key={item.title}>
                    <dt className="type-label-m font-extrabold text-neutral-900">{item.title}</dt>
                    {item.content ? (
                      <dd className="whitespace-pre-line type-body-s font-medium leading-[1.55] text-neutral-600">
                        {item.content}
                      </dd>
                    ) : null}
                  </div>
                ))}
              </dl>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function toDetailModel(curriculum: Curriculum, center: CurriculumDetailPageProps['center']): DetailModel {
  const className = curriculum.className ?? '클래스 미정'
  const days = getEducationDays(curriculum)
  const teacher = typeof curriculum.teacher === 'object' ? (curriculum.teacher as Teacher) : null
  const timeRange = formatTimeRange(curriculum.educationStartTime, curriculum.educationEndTime)
  const startTime = normalizeTime(curriculum.educationStartTime) ?? ''
  const lessons = normalizeLessons(curriculum)
  const summaryMeta = [days.join(''), startTime]
    .filter(Boolean)
    .join(' / ')

  return {
    capacity: curriculum.capacity ? String(curriculum.capacity) : '문의',
    className,
    consultHref: `/consult?center=${center}&curriculum=${encodeURIComponent(curriculum.slug)}`,
    dayLabel: days.length > 0 ? days.join('') : '요일 문의',
    educationDate: formatEducationDate(curriculum.educationStartDate),
    lessonCount: lessons.length > 0 ? `${lessons.length}회` : '문의',
    lessons,
    summaryMeta: summaryMeta || timeRange,
    teacher: toTeacherSummary(teacher),
    timeRange,
    title: className,
  }
}

function toTeacherSummary(teacher: Teacher | null): TeacherSummary {
  if (!teacher) {
    return {
      careerItems: [],
      image: null,
      name: '교육진 미정',
      role: null,
      summary: null,
    }
  }

  return {
    careerItems: (teacher.careerItems ?? []).map((item) => ({
      content: item.content ?? null,
      title: item.title,
    })),
    image: teacher.profileImageMedia ?? null,
    name: teacher.name,
    role: teacher.role ?? null,
    summary: teacher.summary ?? null,
  }
}

function normalizeLessons(curriculum: Curriculum) {
  const lessons = curriculum.curriculumLessons
    ?.filter((lesson) => lesson.topic || lesson.content)
    .map((lesson) => ({
      content: lesson.content ?? '강의 내용 준비 중입니다.',
      topic: lesson.topic ?? '강의 주제 미정',
    }))

  if (lessons?.length) {
    return lessons
  }

  return [
    {
      content: curriculum.title ?? '강의 내용 준비 중입니다.',
      topic: '강의 주제 미정',
    },
  ]
}

function getEducationDays(curriculum: Curriculum) {
  return educationDayFields
    .filter(([field]) => curriculum[field] === true)
    .map(([, label]) => label)
}

function normalizeTime(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/\d{1,2}:\d{2}/)

  return match?.[0] ?? value
}

function formatTimeRange(start: string | null | undefined, end: string | null | undefined) {
  const normalizedStart = normalizeTime(start)
  const normalizedEnd = normalizeTime(end)

  if (normalizedStart && normalizedEnd) {
    return `${normalizedStart} ~ ${normalizedEnd}`
  }

  return normalizedStart ?? normalizedEnd ?? '시간 문의'
}

function formatEducationDate(value: string | null | undefined) {
  if (!value) {
    return '일정 문의'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.split('T')[0] ?? value
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
