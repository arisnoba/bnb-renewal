import type { Footer as FooterData } from '@/payload-types'

export type FamilySiteLink = {
  href: string
  label: string
  mobileLabel?: string
  name: string
}

type FooterFamilySiteSource = Pick<FooterData, 'centerInfos'>

const fallbackFamilySites: FamilySiteLink[] = [
  { href: '/art', label: 'ART CENTER', name: '아트센터' },
  { href: '/exam', label: 'EXAM CENTER', name: '입시센터' },
  { href: '/highteen', label: 'HIGH TEEN CENTER', name: '하이틴센터' },
  { href: '/kids', label: 'KIDS CENTER', mobileLabel: 'KID CENTER', name: '키즈센터' },
  { href: '/avenue', label: 'AVENUE CENTER', name: '애비뉴센터' },
]

export function familySitesFromFooter(footer: FooterFamilySiteSource | null): FamilySiteLink[] {
  const centerInfos = footer?.centerInfos ?? []

  return fallbackFamilySites.map((site) => {
    const centerInfo = centerInfos.find((item) => item.centerName === site.name)

    return {
      ...site,
      href: centerInfo?.url || site.href,
    }
  })
}
