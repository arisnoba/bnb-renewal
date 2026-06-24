'use client'

import type { CenterSlug } from '@/lib/centers'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const [yearLabel, monthLabel] = currentLabel.split(' ')

  function handleMonthChange(value: string) {
    const nextMonth = Number(value)

    if (!Number.isInteger(nextMonth) || nextMonth === currentMonth) {
      return
    }

    router.push(createMonthHref(center, currentYear, nextMonth), { scroll: false })
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
      <div className="section-schedule-calendar__month-label flex gap-1 items-baseline justify-center text-center type-display-m font-extrabold leading-[1.2] text-neutral-950 min-[769px]:type-display-l">
        <span>{yearLabel}년</span>
        <Select
          onValueChange={handleMonthChange}
          value={String(currentMonth)}
        >
          <SelectTrigger
            aria-label={`${yearLabel}년 ${monthLabel} 월 선택 열기`}
            className="h-auto w-auto gap-2 border-0 bg-transparent px-2 [font-size:inherit]! font-extrabold leading-[1.2] text-inherit shadow-none transition hover:[color:var(--brand)] focus-visible:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [&>span]:![font-size:inherit] [&>span]:line-clamp-none [&_svg]:size-5 [&_svg]:text-current [&_svg]:opacity-100 min-[769px]:[&_svg]:size-6"
          >
            <SelectValue placeholder={monthLabel} />
          </SelectTrigger>
          <SelectContent
            align="center"
            className="w-72 max-w-[calc(100vw-32px)] rounded-none border-neutral-200 bg-white p-0 shadow-2xl min-[769px]:w-80"
            side="bottom"
            sideOffset={12}
            viewportClassName="h-auto! p-3"
          >
            <SelectGroup className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1
                const isCurrentMonth = month === currentMonth

                return (
                  <SelectItem
                    aria-current={isCurrentMonth ? 'page' : undefined}
                    className={[
                      'flex min-h-10 justify-center rounded-none border px-2 pr-2 type-label-l font-extrabold leading-[1.2] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&>span:first-child]:hidden',
                      isCurrentMonth
                        ? 'border-brand bg-brand text-white focus:bg-brand focus:text-white data-[highlighted]:bg-brand data-[highlighted]:text-white'
                        : 'border-neutral-200 bg-white text-neutral-900 focus:border-brand focus:bg-white focus:text-brand data-[highlighted]:border-brand data-[highlighted]:bg-white data-[highlighted]:text-brand',
                    ].join(' ')}
                    key={month}
                    value={String(month)}
                  >
                    {month}월
                  </SelectItem>
                )
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
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
