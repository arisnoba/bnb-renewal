import type { CenterSlug } from './centers'

export type CenterLocation = {
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  fax?: string
  label: string
  name: string
  phone: string
  slug: CenterSlug
}

export const centerLocationOrder: CenterSlug[] = ['art', 'exam', 'kids', 'highteen', 'avenue']

export const centerLocations: Record<CenterSlug, CenterLocation> = {
  art: {
    address: '서울 서초구 사평대로55길 126 대솔빌딩 1-5층',
    coordinates: {
      lat: 37.5076046,
      lng: 127.0212856,
    },
    fax: '02-540-3987',
    label: '아트센터',
    name: '배우앤배움 아트센터',
    phone: '1577-9929',
    slug: 'art',
  },
  avenue: {
    address: '서울 서초구 사평대로53길 107',
    coordinates: {
      lat: 37.508215,
      lng: 127.0198408,
    },
    label: '애비뉴센터',
    name: '배우앤배움 애비뉴센터',
    phone: '1577-9929',
    slug: 'avenue',
  },
  exam: {
    address: '서울 서초구 사평대로53길 107',
    coordinates: {
      lat: 37.508215,
      lng: 127.0198408,
    },
    label: '입시센터',
    name: '배우앤배움 입시센터',
    phone: '1577-9929',
    slug: 'exam',
  },
  highteen: {
    address: '서울 서초구 사평대로53길 107',
    coordinates: {
      lat: 37.508215,
      lng: 127.0198408,
    },
    label: '하이틴센터',
    name: '배우앤배움 하이틴센터',
    phone: '1577-9929',
    slug: 'highteen',
  },
  kids: {
    address: '서울 서초구 사평대로57길 135',
    coordinates: {
      lat: 37.5053143,
      lng: 127.0231185,
    },
    label: '키즈센터',
    name: '배우앤배움 키즈센터',
    phone: '1577-9929',
    slug: 'kids',
  },
}

export const centerLocationList = centerLocationOrder.map((slug) => centerLocations[slug])
