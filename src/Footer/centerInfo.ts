import type { Footer } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import { centers } from '@/lib/centers'

export type FooterCenterInfo = NonNullable<Footer['centerInfos']>[number]

const centerSlugs = Object.keys(centers) as CenterSlug[]

const fallbackCenterInfo: FooterCenterInfo = {
  address: '서울특별시 서초구 사평대로55길 126 (반포동 708-12)',
  centerName: centers.art,
  operationRegistrationNumber: '제10617호',
  url: '/art',
}

export function centerSlugFromPathname(pathname: string | null | undefined): CenterSlug | null {
  const firstSegment = pathname?.split('?')[0]?.split('/').filter(Boolean)[0]

  return centerSlugs.includes(firstSegment as CenterSlug) ? (firstSegment as CenterSlug) : null
}

export function footerCenterInfoForPathname(
  centerInfos: FooterCenterInfo[],
  pathname: string | null | undefined,
) {
  return footerCenterInfoForCenter(centerInfos, centerSlugFromPathname(pathname))
}

export function footerCenterInfoForCenter(
  centerInfos: FooterCenterInfo[],
  center: CenterSlug | null,
) {
  const targetName = center ? centers[center] : centers.art

  return (
    centerInfos.find((item) => centerNameMatches(item.centerName, targetName)) ??
    centerInfos.find((item) => centerNameMatches(item.centerName, centers.art)) ??
    fallbackCenterInfo
  )
}

export function footerAddressLines(centerInfo: FooterCenterInfo) {
  const centerName = centerInfo.centerName.trim() || fallbackCenterInfo.centerName
  const operationRegistrationNumber =
    centerInfo.operationRegistrationNumber.trim() ||
    fallbackCenterInfo.operationRegistrationNumber
  const addressLines = (centerInfo.address || fallbackCenterInfo.address)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return [
    '(주)비앤비 인더스트리 | 사업자등록번호 : 105-87-39761',
    `${academyName(centerName)} | 운영등록번호 : ${operationRegistrationNumber}`,
    ...addressLines,
  ]
}

function academyName(centerName: string) {
  if (
    centerName.includes('배우앤배움') ||
    centerName.includes('배움앤배움') ||
    centerName.endsWith('학원')
  ) {
    return centerName
  }

  return `배움앤배움 ${centerName} 학원`
}

function centerNameMatches(centerName: string, targetName: string) {
  const normalizedCenterName = normalizeCenterName(centerName)
  const normalizedTargetName = normalizeCenterName(targetName)

  return (
    normalizedCenterName === normalizedTargetName ||
    normalizedCenterName.includes(normalizedTargetName)
  )
}

function normalizeCenterName(value: string) {
  return value.replace(/\s+/g, '').trim()
}
