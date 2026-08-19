const ADMIN_TIME_ZONE = 'Asia/Seoul'

const adminDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  timeZone: ADMIN_TIME_ZONE,
  year: '2-digit',
})

const adminFullDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  timeZone: ADMIN_TIME_ZONE,
  year: 'numeric',
})

const adminDateOnlyFormatter = new Intl.DateTimeFormat('ko-KR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: ADMIN_TIME_ZONE,
  year: '2-digit',
})

const adminFullDateOnlyFormatter = new Intl.DateTimeFormat('ko-KR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: ADMIN_TIME_ZONE,
  year: 'numeric',
})

function toDateParts(
  value: Date | number | string,
  formatter: Intl.DateTimeFormat = adminDateFormatter,
) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const parts = formatter.formatToParts(date)
  const mapped = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  const year = mapped.year
  const month = mapped.month
  const day = mapped.day
  const hour = mapped.hour
  const minute = mapped.minute

  if (!year || !month || !day || !hour || !minute) {
    return null
  }

  return { day, hour, minute, month, year }
}

export function formatAdminDate(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (
    !(value instanceof Date) &&
    typeof value !== 'number' &&
    typeof value !== 'string'
  ) {
    return '-'
  }

  const parts = toDateParts(value)

  if (!parts) {
    return '-'
  }

  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`
}

export function formatAdminFullDate(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (!(value instanceof Date) && typeof value !== 'number' && typeof value !== 'string')
  ) {
    return '-'
  }

  const parts = toDateParts(value, adminFullDateFormatter)

  if (!parts) {
    return '-'
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

export function formatAdminDateOnly(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (!(value instanceof Date) && typeof value !== 'number' && typeof value !== 'string')
  ) {
    return '-'
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const parts = Object.fromEntries(
    adminDateOnlyFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return parts.year && parts.month && parts.day
    ? `${parts.year}.${parts.month}.${parts.day}`
    : '-'
}

export function formatAdminFullDateOnly(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (!(value instanceof Date) && typeof value !== 'number' && typeof value !== 'string')
  ) {
    return '-'
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const parts = Object.fromEntries(
    adminFullDateOnlyFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return parts.year && parts.month && parts.day
    ? `${parts.year}-${parts.month}-${parts.day}`
    : '-'
}
