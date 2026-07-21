import type { CenterSlug } from '@/lib/centers'
import { centers } from '@/lib/centers'
import { centerOrigin } from '@/lib/centerDomains'

type GateNotFoundView = {
  actionLabel: string
  description: string
  href: '/'
  label: string
  scope: 'gate'
}

type CenterNotFoundView = {
  actionLabel: string
  center: CenterSlug
  description: string
  href: string
  label: string
  scope: 'center'
}

export type NotFoundView = GateNotFoundView | CenterNotFoundView

const centerSlugs = Object.keys(centers) as CenterSlug[]

export function centerFromPathname(pathname: string | null | undefined): CenterSlug | null {
  const firstSegment = pathname?.split('?')[0]?.split('/').filter(Boolean)[0]

  return centerSlugs.includes(firstSegment as CenterSlug) ? (firstSegment as CenterSlug) : null
}

export function notFoundViewFromPathname(pathname: string | null | undefined): NotFoundView {
  const center = centerFromPathname(pathname)

  if (center) {
    const label = centers[center]

    return {
      actionLabel: `${label} 메인으로 이동`,
      center,
      description: `${label}에서 요청하신 페이지를 찾을 수 없습니다. 센터 메인에서 필요한 메뉴를 다시 선택해 주세요.`,
      href: centerOrigin(center),
      label,
      scope: 'center',
    }
  }

  return {
    actionLabel: '센터 선택으로 이동',
    description:
      '주소가 잘못 입력되었거나 요청하신 페이지가 이동 또는 삭제되었습니다. 센터 선택 화면에서 다시 시작해 주세요.',
    href: '/',
    label: '배우앤배움',
    scope: 'gate',
  }
}
