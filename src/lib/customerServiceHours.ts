import type { CenterSlug } from './centers'

type CustomerServiceHours = {
  lunch: string
  weekday: string
  weekend: string
}

const defaultHours: CustomerServiceHours = {
  lunch: '12:00 ~ 13:00',
  weekday: '09:30 ~ 19:30',
  weekend: '09:30 ~ 16:00',
}

const updatedHours: CustomerServiceHours = {
  lunch: '12:00~13:00',
  weekday: '10:00~19:00',
  weekend: '10:00~19:00',
}

const updatedCenters = new Set<CenterSlug>(['exam', 'highteen', 'kids'])

export function customerServiceHoursForCenter(
  center: CenterSlug | null,
): CustomerServiceHours {
  return center && updatedCenters.has(center) ? updatedHours : defaultHours
}

export function customerServiceHourDetails(center: CenterSlug) {
  const hours = customerServiceHoursForCenter(center)

  return [
    { label: '평일', value: `${hours.weekday} / 점심시간 ${hours.lunch}` },
    { label: '주말', value: hours.weekend },
  ]
}

export function customerServiceHoursSummary(center: CenterSlug | null) {
  const hours = customerServiceHoursForCenter(center)

  if (!center || !updatedCenters.has(center)) {
    return `평일 ${hours.weekday} · 주말 ${hours.weekend}`
  }

  return `평일 ${hours.weekday} · 점심시간 ${hours.lunch} · 주말 ${hours.weekend}`
}
