'use client'

import Link from 'next/link'

type CurriculumStickyCtaProps = {
  consultHref: string
  meta: string
  title: string
}

export function CurriculumStickyCta({
  consultHref,
  meta,
  title,
}: CurriculumStickyCtaProps) {
  return (
    <div className="section-curriculum-detail__mobile-cta fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white px-4 py-3 shadow-[0_-12px_32px_rgba(0,0,0,0.12)] lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 rounded-lg bg-neutral-100 px-4 py-3">
          <p className="truncate type-label-l font-extrabold text-neutral-900">
            {title}
          </p>
          <p className="mt-1 truncate type-caption-m font-medium text-neutral-500">
            {meta}
          </p>
        </div>
        <Link
          className="inline-flex min-h-[58px] shrink-0 items-center justify-center rounded-lg bg-brand px-5 type-label-m font-extrabold text-white transition-opacity hover:opacity-90"
          href={consultHref}
        >
          상담 신청
        </Link>
      </div>
    </div>
  )
}
