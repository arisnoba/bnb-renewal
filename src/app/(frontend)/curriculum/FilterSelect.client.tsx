'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

type FilterSelectOption = {
  label: string
  value: string
}

type FilterSelectProps = {
  defaultValue?: string
  label: string
  name: string
  options: FilterSelectOption[]
}

export function FilterSelect({
  defaultValue,
  label,
  name,
  options,
}: FilterSelectProps) {
  const [selectedValue, setSelectedValue] = useState(defaultValue ?? '')
  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label ?? '전체'

  return (
    <label className="section-curriculum-search__field relative block cursor-pointer bg-neutral-900 px-5 py-4 transition-colors hover:bg-neutral-800 focus-within:ring-2 focus-within:ring-white/10 md:py-5">
      <span className="pointer-events-none block type-caption-m font-medium leading-[1.45] text-white/45">
        {label}
      </span>
      <span className="pointer-events-none mt-2 block truncate pr-9 type-label-l font-semibold text-white">
        {selectedLabel}
      </span>
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        name={name}
        onChange={(event) => setSelectedValue(event.target.value)}
        value={selectedValue}
      >
        <option value="">전체</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-white"
        strokeWidth={2.2}
      />
    </label>
  )
}
