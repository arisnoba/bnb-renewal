import type { Footer as FooterData } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import {
  apexHostname,
  centerHostname,
  centerOrigin,
  primaryHostname,
} from '@/lib/centerDomains'

export type FamilySiteLink = {
  href: string
  label: string
  mobileLabel?: string
  name: string
}

type FooterFamilySiteSource = Pick<FooterData, 'centerInfos'>

const fallbackFamilySites: Array<FamilySiteLink & { center: CenterSlug }> = [
  { center: 'art', href: centerOrigin('art'), label: 'ART CENTER', name: '아트센터' },
  { center: 'exam', href: centerOrigin('exam'), label: 'EXAM CENTER', name: '입시센터' },
  {
    center: 'highteen',
    href: centerOrigin('highteen'),
    label: 'HIGH TEEN CENTER',
    name: '하이틴센터',
  },
  {
    center: 'kids',
    href: centerOrigin('kids'),
    label: 'KIDS CENTER',
    mobileLabel: 'KID CENTER',
    name: '키즈센터',
  },
  {
    center: 'avenue',
    href: centerOrigin('avenue'),
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
    }
  })
}

function resolveFamilySiteHref(configuredHref: string | null | undefined, center: CenterSlug) {
  const fallbackHref = centerOrigin(center)
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
