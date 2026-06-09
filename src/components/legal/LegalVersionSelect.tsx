'use client'

import { usePathname, useRouter } from 'next/navigation'

export type LegalVersionOption = {
  label: string
  value: string
}

type LegalVersionSelectProps = {
  label: string
  options: LegalVersionOption[]
  value: string
}

export function LegalVersionSelect({ label, options, value }: LegalVersionSelectProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        aria-label={`${label} 선택`}
        className="h-14 min-w-[150px] appearance-none rounded border border-white/15 bg-transparent py-0 pl-5 pr-12 text-base font-semibold text-white outline-none transition-colors hover:border-white/35 focus:border-white"
        onChange={(event) => {
          const params = new URLSearchParams()
          if (event.target.value) {
            params.set('version', event.target.value)
          }

          router.push(params.size ? `${pathname}?${params.toString()}` : pathname)
        }}
        value={value}
      >
        {options.map((option) => (
          <option className="bg-neutral-950 text-white" key={option.value || 'current'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
        fill="none"
        viewBox="0 0 16 16"
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    </label>
  )
}
