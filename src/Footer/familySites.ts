import type { Footer as FooterData } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import {
  apexHostname,
  centerHostname,
  centerPublicHref,
  primaryHostname,
} from '@/lib/centerDomains'
import { isCenterPubliclyAvailable } from '@/lib/centerAvailability'

export type FamilySiteLink = {
  href: string
  label: string
  mobileLabel?: string
  name: string
  statusLabel?: string
}

type FooterFamilySiteSource = Pick<FooterData, 'centerInfos'>

const fallbackFamilySites: Array<FamilySiteLink & { center: CenterSlug }> = [
  { center: 'art', href: centerPublicHref('art'), label: 'ART CENTER', name: '아트센터' },
  { center: 'exam', href: centerPublicHref('exam'), label: 'EXAM CENTER', name: '입시센터' },
  {
    center: 'highteen',
    href: centerPublicHref('highteen'),
    label: 'HIGH TEEN CENTER',
    name: '하이틴센터',
  },
  {
    center: 'kids',
    href: centerPublicHref('kids'),
    label: 'KIDS CENTER',
    mobileLabel: 'KID CENTER',
    name: '키즈센터',
  },
  {
    center: 'avenue',
    href: centerPublicHref('avenue'),
    label: 'AVENUE CENTER',
    name: '애비뉴센터',
  },
]

export function familySitesFromFooter(footer: FooterFamilySiteSource | null): FamilySiteLink[] {
  const centerInfos = footer?.centerInfos ?? []

  return fallbackFamilySites.map((site) => {
    const centerInfo = centerInfos.find((item) => item.centerName === site.name)

    return {
      href: resolveFamilySiteHref(centerInfo?.url, site.center),
      label: site.label,
      mobileLabel: site.mobileLabel,
      name: site.name,
      statusLabel: isCenterPubliclyAvailable(site.center) ? undefined : '준비중',
    }
  })
}

function resolveFamilySiteHref(configuredHref: string | null | undefined, center: CenterSlug) {
  const fallbackHref = centerPublicHref(center)
  const href = configuredHref?.trim()

  if (!href) {
    return fallbackHref
  }

  try {
    const url = new URL(href, `https://${primaryHostname}`)
    const legacyCenterPath = url.pathname === `/${center}` || url.pathname === `/${center}/`
    const canonicalCenterRoot = url.hostname === centerHostname(center) && url.pathname === '/'
    const officialHostname =
      url.hostname === primaryHostname ||
      url.hostname === apexHostname ||
      url.hostname === centerHostname(center)

    if (officialHostname && (legacyCenterPath || canonicalCenterRoot)) {
      return fallbackHref
    }
  } catch {
    return href
  }

  return href
}
