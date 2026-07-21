import type { Metadata } from 'next'

import ImageGallery, {
  type ImageGalleryItem,
} from '@/components/ui/image-gallery'
import { centerOrigin } from '@/lib/centerDomains'
import { commonOpenGraphImage, mergeOpenGraph } from '@/utilities/mergeOpenGraph'

const gateCenters: ImageGalleryItem[] = [
  {
    center: 'art',
    title: '아트센터',
    description:
      '실전 중심의 전문 교육으로 배우의 꿈을 키우고 현장 경험을 담은 체계적인 커리큘럼으로 연기의 기본부터 작품 활동까지 성장을 함께하는 아티스트 교육을 제공합니다.',
    href: centerOrigin('art'),
    cta: '아트센터 바로가기',
    desktopImage: '/assets/gate/art-desktop.png',
    mobileImage: '/assets/gate/art-mobile.png',
    decoIcon: 'icon-b.svg',
    textTone: 'dark',
  },
  {
    center: 'exam',
    title: '입시센터',
    description:
      '예고·예대 입시를 위한 체계적인 커리큘럼과 실전 중심의 맞춤형 입시 전략으로 학생 개개인의 가능성을 극대화하며 목표 대학 합격을 함께 만들어갑니다.',
    href: centerOrigin('exam'),
    cta: '입시센터 바로가기',
    desktopImage: '/assets/gate/exam-desktop.png',
    mobileImage: '/assets/gate/exam-mobile.png',
    decoIcon: 'icon-ae.svg',
  },
  {
    center: 'highteen',
    title: '하이틴센터',
    description:
      '청소년의 가능성과 재능을 발견하고 즐겁고 체계적인 연기 교육을 통해 자신감과 표현력을 자연스럽게 키우며 배우로 성장하는 첫걸음을 함께합니다.',
    href: centerOrigin('highteen'),
    cta: '하이틴센터 바로가기',
    desktopImage: '/assets/gate/highteen-desktop.png',
    mobileImage: '/assets/gate/highteen-mobile.png',
    decoIcon: 'icon-ng.svg',
    textTone: 'dark',
  },
  {
    center: 'kids',
    title: '키즈센터',
    description:
      '아이들의 상상력과 자신감을 키워주는 놀이와 교육이 어우러진 연기 프로그램으로 창의적인 표현력과 바른 인성을 함께 배우며 즐겁게 성장하는 시간을 만들어갑니다.',
    href: centerOrigin('kids'),
    cta: '키즈센터 바로가기',
    desktopImage: '/assets/gate/kids-desktop.png',
    mobileImage: '/assets/gate/kids-mobile.png',
    decoIcon: 'icon-u.svg',
  },
  {
    center: 'avenue',
    title: '애비뉴센터',
    description:
      '오디션과 작품 활동을 위한 실전 교육으로 현장에서 요구하는 역량을 체계적으로 익히고 다양한 캐스팅 기회와 경험을 통해 배우의 가능성을 현실로 연결합니다.',
    href: centerOrigin('avenue'),
    cta: '애비뉴센터 바로가기',
    desktopImage: '/assets/gate/avenue-desktop.png',
    mobileImage: '/assets/gate/avenue-mobile.png',
    decoIcon: 'icon-m.svg',
  },
]

const gateDescription =
  '배우앤배움 아트센터, 입시센터, 하이틴센터, 키즈센터, 애비뉴센터의 교육과 캐스팅, 매니지먼트 과정을 선택해 확인하세요.'

function gateFaviconPath(fileName: string) {
  return `/assets/favicons/art/${fileName}`
}

export const metadata: Metadata = {
  title: '센터 선택 - 배우앤배움',
  description: gateDescription,
  icons: {
    icon: [
      { url: gateFaviconPath('favicon.ico'), sizes: 'any' },
      { url: gateFaviconPath('favicon-32x32.png'), sizes: '32x32', type: 'image/png' },
      { url: gateFaviconPath('favicon-16x16.png'), sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      {
        url: gateFaviconPath('apple-touch-icon.png'),
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: gateFaviconPath('site.webmanifest'),
  openGraph: mergeOpenGraph({
    description: gateDescription,
    images: [commonOpenGraphImage()],
    title: '센터 선택 - 배우앤배움',
  }),
  twitter: {
    card: 'summary_large_image',
    images: [commonOpenGraphImage().url],
  },
}

export default function GatePage() {
  return <ImageGallery items={gateCenters} />
}
