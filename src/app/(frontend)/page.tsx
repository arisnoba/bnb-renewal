import type { Metadata } from 'next'

import ImageGallery, {
  type ImageGalleryItem,
} from '@/components/ui/image-gallery'

export const dynamic = 'force-dynamic'

const gateCenters: ImageGalleryItem[] = [
  {
    label: 'ART CENTER',
    title: '아트센터',
    description: '연기 교육과 현장 캐스팅을 연결하는 배우 과정',
    href: '/art',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'EXAM CENTER',
    title: '입시센터',
    description: '예고, 대학 입시를 위한 단계별 실기 준비',
    href: '/exam',
    image:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'HIGH TEEN CENTER',
    title: '하이틴센터',
    description: '청소년 배우를 위한 연기, 매니지먼트, 캐스팅 과정',
    href: '/highteen',
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'KIDS CENTER',
    title: '키즈센터',
    description: '아역 배우 성장에 맞춘 교육과 현장 경험',
    href: '/kids',
    image:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'AVENUE CENTER',
    title: '애비뉴센터',
    description: '제휴와 프로필, 캐스팅을 연결하는 확장 과정',
    href: '/avenue',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    enabled: false,
  },
]

export const metadata: Metadata = {
  title: '센터 선택 - 배우앤배움',
  description:
    '배우앤배움 아트센터, 입시센터, 하이틴센터, 키즈센터를 선택하는 게이트 페이지입니다.',
}

export default function GatePage() {
  return <ImageGallery items={gateCenters} />
}
