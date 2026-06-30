import type { CSSProperties } from 'react'

import { Media } from '@/components/Media/Renderer'
import type { CenterSlug } from '@/lib/centers'
import type { Media as PayloadMedia, Teacher } from '@/payload-types'
import Link from 'next/link'
import React from 'react'

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
  teachers: TeacherListItem[]
}

export function TeachersGrid({ center, teachers }: TeachersGridProps) {
  return (
    <div className="section-teachers-list__grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {teachers.map((teacher, index) => (
        <TeacherCard
          center={center}
          index={index}
          key={teacher.id}
          teacher={teacher}
        />
      ))}
    </div>
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
              fadeIn={true}
              fill
              htmlElement={null}
              imgClassName="size-full object-cover object-center grayscale transition duration-300 group-hover:scale-105"
              loading="lazy"
              placeholder="empty"
              pictureClassName="block size-full opacity-55 transition duration-300 group-hover:opacity-85"
              resource={media}
              size="(max-width: 767px) 46vw, (max-width: 1279px) 30vw, 268px"
            />
          ) : (
            <div className="size-full bg-neutral-800" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/45" />
        </div>
        <div className="section-teachers-card__label absolute bottom-5 left-1/2 max-w-[calc(100%-32px)] -translate-x-1/2 text-center opacity-100 transition duration-200 md:max-w-[calc(100%-48px)] xl:bottom-auto xl:top-1/2 xl:-translate-y-[42%] xl:opacity-0 xl:group-hover:-translate-y-1/2 xl:group-hover:opacity-100 xl:group-focus-visible:-translate-y-1/2 xl:group-focus-visible:opacity-100">
          <p className="type-title-s font-bold leading-[1.4] text-white">
            {label}
          </p>
        </div>
      </article>
    </Link>
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
