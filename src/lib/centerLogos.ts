import type { CenterSlug } from './centers'

import { centers } from './centers'

type CenterLogo = {
  alt: string
  height: number
  src: string
  width: number
}

const centerLogos: Record<CenterSlug, Omit<CenterLogo, 'alt'>> = {
  art: {
    height: 36,
    src: '/assets/common/logo/logo-art.svg',
    width: 115,
  },
  avenue: {
    height: 36,
    src: '/assets/common/logo/logo-art.svg',
    width: 115,
  },
  exam: {
    height: 36,
    src: '/assets/common/logo/logo-exam.svg',
    width: 119,
  },
  highteen: {
    height: 36,
    src: '/assets/common/logo/logo-highteen.svg',
    width: 123,
  },
  kids: {
    height: 36,
    src: '/assets/common/logo/logo-kids.svg',
    width: 115,
  },
}

export function centerLogoFor(center: CenterSlug): CenterLogo {
  const logo = centerLogos[center]

  return {
    ...logo,
    alt: `배우앤배움 ${centers[center]}`,
  }
}
