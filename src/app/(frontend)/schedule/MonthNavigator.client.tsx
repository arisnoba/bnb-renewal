'use client'

import type { CenterSlug } from '@/lib/centers'
import type { MouseEvent } from 'react'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

type MonthNavigatorProps = {
  center: CenterSlug
  currentMonth: number
  currentYear: number
  currentLabel: string
  nextHref: string
  previousHref: string
}

export function MonthNavigator({
  center,
  currentMonth,
  currentYear,
  currentLabel,
  nextHref,
  previousHref,
}: MonthNavigatorProps) {
  const router = useRouter()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [yearLabel, monthLabel] = currentLabel.split(' ')

  function handleMonthClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    event.preventDefault()
    detailsRef.current?.removeAttribute('open')
    router.push(href, { scroll: false })
  }

  return (
    <nav
      aria-label="스케줄 월 이동"
      className="section-schedule-calendar__month-nav grid grid-cols-[44px_1fr_44px] items-center gap-4 min-[769px]:grid-cols-[48px_1fr_48px]"
    >
      <Link
        aria-label="이전 달 스케줄 보기"
        className="grid size-11 place-items-center rounded-full border border-neutral-200 text-neutral-900 transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand min-[769px]:size-12"
        href={previousHref}
        scroll={false}
      >
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </Link>
      <div className="section-schedule-calendar__month-label flex items-baseline justify-center gap-3 text-center type-display-m font-extrabold leading-[1.2] text-neutral-950 min-[769px]:gap-4 min-[769px]:type-display-l">
        <span>{yearLabel}년</span>
        <details className="group relative inline-flex" ref={detailsRef}>
          <summary
            aria-label={`${yearLabel}년 ${monthLabel} 월 선택 열기`}
            className="inline-flex cursor-pointer list-none items-center gap-2 text-neutral-950 transition hover:[color:var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [&::-webkit-details-marker]:hidden"
          >
            <span>{monthLabel}</span>
            <ChevronDown
              aria-hidden="true"
              className="size-5 transition-transform group-open:rotate-180 min-[769px]:size-6"
              strokeWidth={2.4}
            />
          </summary>
          <div className="absolute left-1/2 top-full z-20 mt-4 w-72 max-w-[82vw] -translate-x-1/2 border border-neutral-200 bg-white p-3 shadow-2xl min-[769px]:w-80">
            <p className="sr-only">{currentYear}년 월 선택</p>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1
                const isCurrentMonth = month === currentMonth
                const href = createMonthHref(center, currentYear, month)

                return (
                  <Link
                    aria-current={isCurrentMonth ? 'page' : undefined}
                    className={[
                      'grid min-h-10 place-items-center border type-label-m font-bold leading-[1.2] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                      isCurrentMonth
                        ? 'border-brand bg-brand text-white'
                        : 'border-neutral-200 bg-white text-neutral-900 hover:border-brand hover:text-brand',
                    ].join(' ')}
                    href={href}
                    key={month}
                    onClick={(event) => handleMonthClick(event, href)}
                    scroll={false}
                  >
                    {month}월
                  </Link>
                )
              })}
            </div>
          </div>
        </details>
      </div>
      <Link
        aria-label="다음 달 스케줄 보기"
        className="grid size-11 place-items-center rounded-full border border-neutral-200 text-neutral-900 transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand min-[769px]:size-12"
        href={nextHref}
        scroll={false}
      >
        <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </Link>
    </nav>
  )
}

function createMonthHref(center: CenterSlug, year: number, month: number) {
  return `/${center}/schedule?year=${year}&month=${month}`
}
