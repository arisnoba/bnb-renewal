const LEGAL_DATE_TIME_ZONE = 'Asia/Seoul'

const legalDateKeyFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: '2-digit',
  timeZone: LEGAL_DATE_TIME_ZONE,
  year: 'numeric',
})

export function legalDateKey(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const parts = Object.fromEntries(
    legalDateKeyFormatter
      .formatToParts(date)
      .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
      .map((part) => [part.type, part.value]),
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

export function sortByLegalDateDescending<T>(
  values: T[],
  getDate: (value: T) => string | null | undefined,
) {
  return [...values].sort((left, right) => {
    const leftDate = legalDateKey(getDate(left))
    const rightDate = legalDateKey(getDate(right))

    if (!leftDate) {
      return rightDate ? 1 : 0
    }

    if (!rightDate) {
      return -1
    }

    return rightDate.localeCompare(leftDate)
  })
}

export function formatLegalDate(value: string | null | undefined) {
  if (!value) {
    return '날짜 미정'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'numeric',
    timeZone: LEGAL_DATE_TIME_ZONE,
    year: 'numeric',
  }).format(date)
}
