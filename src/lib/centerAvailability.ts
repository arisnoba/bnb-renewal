import type { CenterSlug } from './centers'

import { centers } from './centers'

export type CenterPublicStatus = 'open' | 'preparing'

export const centerPublicStatuses: Record<CenterSlug, CenterPublicStatus> = {
  art: 'open',
  avenue: 'preparing',
  exam: 'open',
  highteen: 'open',
  kids: 'open',
}

export const centerPreparationBadge = 'OPENING SOON'
export const centerPreparationMessage =
  '더 좋은 교육과 서비스를 제공하기 위해 마지막 준비를 진행하고 있습니다. 곧 새로운 모습으로 만나 뵙겠습니다.'

export function centerPreparationTitle(center: CenterSlug) {
  return `${centers[center]} 오픈을 준비하고 있습니다.`
}

export function isCenterPubliclyAvailable(
  center: CenterSlug | null | undefined,
): boolean {
  return center ? centerPublicStatuses[center] === 'open' : true
}

export function isCenterPreparationPathname(pathname: string): boolean {
  const [firstSegment, secondSegment] = pathname.split('/').filter(Boolean)
  const center =
    firstSegment === 'opening-soon' ? secondSegment : firstSegment

  return (
    Boolean(center) &&
    center in centerPublicStatuses &&
    !isCenterPubliclyAvailable(center as CenterSlug)
  )
}
