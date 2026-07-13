'use client'

import { ChevronDown, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

import type { CurriculumSearchField } from '@/lib/curriculumSearch'

type CurriculumSearchFormProps = {
  action: string
  fields: CurriculumSearchField[]
  variant: 'centerHome' | 'curriculumArchive'
}

const variantClasses = {
  centerHome: {
    emptyLabel: '선택하세요',
    field:
      'section-center-home-course__filter relative block min-h-[82px] cursor-pointer bg-neutral-900 px-5 py-4 transition hover:bg-neutral-800 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand',
    fieldGroup: 'section-center-home-course__filters grid gap-1 md:grid-cols-3',
    form: 'section-center-home-course__panel mt-8 grid gap-3 lg:grid-cols-[1fr_228px]',
    icon: 'right-5 text-white',
    label: 'type-body-s font-medium leading-normal text-neutral-400',
    submitIcon: 'size-5',
    submit:
      'section-center-home-course__submit flex min-h-[72px] items-center justify-between bg-brand px-6 py-5 type-title-m font-bold leading-[1.4] text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    value: 'mt-1 type-body-m font-medium leading-normal text-white',
  },
  curriculumArchive: {
    emptyLabel: '전체',
    field:
      'section-curriculum-search__field relative block cursor-pointer bg-neutral-900 px-5 py-4 transition-colors hover:bg-neutral-800 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand md:py-5',
    fieldGroup: null,
    form: 'section-curriculum-search__form grid gap-2 md:grid-cols-4',
    icon: 'right-5 text-white',
    label: 'type-caption-m font-medium leading-[1.45] text-white/45',
    submitIcon: 'size-4',
    submit:
      'section-curriculum-search__submit min-h-16 inline-flex cursor-pointer items-center justify-center gap-2 bg-brand px-6 type-label-l font-extrabold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    value: 'mt-2 type-label-l font-semibold text-white',
  },
} as const

const curriculumSearchScrollKey = 'bnb.curriculumSearch.scrollY'

function restoreScrollPosition(scrollY: number) {
  if (!Number.isFinite(scrollY)) {
    return
  }

  const restoreScroll = () => window.scrollTo({ top: scrollY, behavior: 'auto' })

  window.requestAnimationFrame(() => {
    restoreScroll()

    for (const delay of [0, 50, 150, 300, 600, 1000]) {
      window.setTimeout(restoreScroll, delay)
    }
  })
}

export function CurriculumSearchForm({ action, fields, variant }: CurriculumSearchFormProps) {
  const classes = variantClasses[variant]
  const router = useRouter()
  const controls = fields.map((field) => (
    <CurriculumFilterSelect
      emptyLabel={classes.emptyLabel}
      field={field}
      key={`${field.name}-${field.defaultValue ?? ''}`}
      variant={variant}
    />
  ))

  useEffect(() => {
    if (variant !== 'curriculumArchive') {
      return
    }

    const storedScrollY = window.sessionStorage.getItem(curriculumSearchScrollKey)

    if (!storedScrollY) {
      return
    }

    window.sessionStorage.removeItem(curriculumSearchScrollKey)

    const scrollY = Number(storedScrollY)

    if (!Number.isFinite(scrollY)) {
      return
    }

    restoreScrollPosition(scrollY)
  })

  const handleSubmit =
    variant === 'curriculumArchive'
      ? (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()

          const targetUrl = new URL(action, window.location.origin)
          const params = new URLSearchParams()
          const formData = new FormData(event.currentTarget)

          for (const [key, value] of formData.entries()) {
            const normalizedValue = String(value).trim()

            if (normalizedValue) {
              params.set(key, normalizedValue)
            }
          }

          const query = params.toString()
          const href = `${targetUrl.pathname}${query ? `?${query}` : ''}${targetUrl.hash}`
          const scrollY = window.scrollY

          window.sessionStorage.setItem(curriculumSearchScrollKey, String(scrollY))
          router.push(href, { scroll: false })
          restoreScrollPosition(scrollY)
        }
      : undefined

  return (
    <form action={action} className={classes.form} onSubmit={handleSubmit}>
      {classes.fieldGroup ? <div className={classes.fieldGroup}>{controls}</div> : controls}
      <button className={classes.submit} type="submit">
        <span>강의검색</span>
        <Search
          aria-hidden="true"
          className={`${classes.submitIcon} shrink-0`}
          strokeWidth={2.4}
        />
      </button>
    </form>
  )
}

function CurriculumFilterSelect({
  emptyLabel,
  field,
  variant,
}: {
  emptyLabel: string
  field: CurriculumSearchField
  variant: CurriculumSearchFormProps['variant']
}) {
  const [selectedValue, setSelectedValue] = useState(field.defaultValue ?? '')
  const classes = variantClasses[variant]
  const selectedLabel =
    field.options.find((option) => option.value === selectedValue)?.label ?? emptyLabel

  return (
    <label className={classes.field}>
      <span className={`pointer-events-none block truncate pr-9 ${classes.label}`}>
        {field.label}
      </span>
      <span className={`pointer-events-none block truncate pr-9 ${classes.value}`}>
        {selectedLabel}
      </span>
      <select
        aria-label={field.label}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        name={field.name}
        onChange={(event) => setSelectedValue(event.target.value)}
        value={selectedValue}
      >
        <option value="">{emptyLabel}</option>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 ${classes.icon}`}
        strokeWidth={2.2}
      />
    </label>
  )
}
