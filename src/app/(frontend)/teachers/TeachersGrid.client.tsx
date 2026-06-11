'use client'

import type { CSSProperties } from 'react'

import { Media } from '@/components/Media/Renderer'
import type { CenterSlug } from '@/lib/centers'
import type { Media as PayloadMedia, Teacher } from '@/payload-types'
import { ChevronDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'

export const INITIAL_VISIBLE_TEACHERS = 16
const VISIBLE_INCREMENT = 8
const LOAD_MORE_DELAY = 260

const teacherMaskIcons = [
  'iruda-d.svg',
  'iruda-u.svg',
  'iruda-a.svg',
  'iruda-i.svg',
  'iruda-r.svg',
] as const

type TeacherMaskIcon = (typeof teacherMaskIcons)[number]

type TeacherListItem = Pick<Teacher, 'id' | 'name' | 'role' | 'slug'> & {
  profileImageMedia?: number | PayloadMedia | null
}

type TeacherMaskStyle = CSSProperties & {
  WebkitMaskImage: string
  WebkitMaskPosition: string
  WebkitMaskRepeat: string
  WebkitMaskSize: string
  maskImage: string
  maskPosition: string
  maskRepeat: string
  maskSize: string
}

type TeachersGridProps = {
  center: CenterSlug
  initialVisible: number
  teachers: TeacherListItem[]
}

export function TeachersGrid({ center, initialVisible, teachers }: TeachersGridProps) {
  const normalizedInitialVisible = Math.min(
    Math.max(initialVisible, INITIAL_VISIBLE_TEACHERS),
    teachers.length,
  )
  const [visibleCount, setVisibleCount] = useState(normalizedInitialVisible)
  const [isLoading, setIsLoading] = useState(false)
  const visibleTeachers = useMemo(
    () => teachers.slice(0, visibleCount),
    [teachers, visibleCount],
  )
  const remainingCount = teachers.length - visibleCount
  const skeletonCount = Math.min(VISIBLE_INCREMENT, Math.max(remainingCount, 0))
  const hasMore = remainingCount > 0

  function handleLoadMore() {
    if (isLoading || !hasMore) {
      return
    }

    setIsLoading(true)
    window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + VISIBLE_INCREMENT, teachers.length))
      setIsLoading(false)
    }, LOAD_MORE_DELAY)
  }

  return (
    <>
      <div className="section-teachers-list__grid grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {visibleTeachers.map((teacher, index) => (
          <TeacherCard
            center={center}
            index={index}
            key={teacher.id}
            teacher={teacher}
          />
        ))}
        {isLoading &&
          Array.from({ length: skeletonCount }, (_, index) => (
            <TeacherSkeletonCard index={visibleCount + index} key={`teacher-skeleton-${index}`} />
          ))}
      </div>

      {hasMore && (
        <div className="section-teachers-list__more mt-12 flex justify-center md:mt-16">
          <button
            className="inline-flex min-h-11 items-center gap-3 px-5 type-label-l font-bold leading-none text-white transition hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:cursor-wait disabled:text-white/45"
            disabled={isLoading}
            onClick={handleLoadMore}
            type="button"
          >
            {isLoading ? '불러오는 중' : '더보기'}
            {isLoading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <ChevronDown aria-hidden="true" className="size-4" strokeWidth={2.4} />
            )}
          </button>
        </div>
      )}
    </>
  )
}

function TeacherCard({
  center,
  index,
  teacher,
}: {
  center: CenterSlug
  index: number
  teacher: TeacherListItem
}) {
  const media = teacher.profileImageMedia
  const hasMediaImage = media && typeof media === 'object'
  const maskIcon = getTeacherMaskIcon(index)
  const maskStyle = teacherMaskStyle(maskIcon)
  const label = [teacher.name, teacher.role || '배우'].filter(Boolean).join(' ')

  return (
    <Link
      className="section-teachers-card group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      href={`/${center}/teachers/${encodeURIComponent(teacher.slug)}`}
    >
      <article className="section-teachers-card__inner relative aspect-square overflow-hidden bg-transparent">
        <div
          className="section-teachers-card__media relative size-full overflow-hidden bg-neutral-800"
          style={maskStyle}
        >
          {hasMediaImage ? (
            <Media
              fill
              htmlElement={null}
              imgClassName="size-full object-cover object-top grayscale opacity-55 transition duration-300 group-hover:scale-105 group-hover:opacity-85"
              pictureClassName="block size-full"
              resource={media}
              size="(max-width: 767px) 46vw, (max-width: 1279px) 30vw, 268px"
            />
          ) : (
            <div className="size-full bg-neutral-800" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/45" />
        </div>
        <div className="section-teachers-card__label absolute left-1/2 top-1/2 max-w-[calc(100%-48px)] -translate-x-1/2 -translate-y-[42%] text-center opacity-0 transition duration-200 group-hover:-translate-y-1/2 group-hover:opacity-100 group-focus-visible:-translate-y-1/2 group-focus-visible:opacity-100">
          <p className="whitespace-nowrap type-title-s font-bold leading-[1.4] text-white">
            {label}
          </p>
        </div>
      </article>
    </Link>
  )
}

function TeacherSkeletonCard({ index }: { index: number }) {
  const maskIcon = teacherMaskIcons[index % teacherMaskIcons.length]

  return (
    <div
      aria-hidden="true"
      className="section-teachers-card__skeleton aspect-square animate-pulse bg-white/[0.06]"
      style={teacherMaskStyle(maskIcon)}
    />
  )
}

function getTeacherMaskIcon(index: number): TeacherMaskIcon {
  return teacherMaskIcons[index % teacherMaskIcons.length]
}

function teacherMaskStyle(icon: TeacherMaskIcon): TeacherMaskStyle {
  const image = `url('/assets/icons/grade-system/${icon}')`

  return {
    WebkitMaskImage: image,
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskImage: image,
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskSize: '100% 100%',
  }
}
