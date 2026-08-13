import { centers, type CenterSlug } from '@/lib/centers'

export type FacilityImage = {
  alt: string
  height: number
  id: string
  src: string
  width: number
}

type FacilityFolder = 'art-avenue' | 'exam' | 'highteen' | 'kids'

const facilityFolderByCenter: Record<CenterSlug, FacilityFolder> = {
  art: 'art-avenue',
  avenue: 'art-avenue',
  exam: 'exam',
  highteen: 'highteen',
  kids: 'kids',
}

const facilityImageNumbersByFolder: Record<FacilityFolder, readonly number[]> = {
  'art-avenue': numberRange(1, 34),
  exam: [...numberRange(1, 35), 38, 39, 40, 41],
  highteen: numberRange(1, 32),
  kids: numberRange(1, 34),
}

const nonStandardImageDimensions = new Map<string, { height: number; width: number }>([
  ['art-avenue/img_26.png', { height: 585, width: 1019 }],
  ['highteen/img_30.png', { height: 585, width: 1019 }],
])

function numberRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function getFacilityImages(center: CenterSlug): FacilityImage[] {
  const folder = facilityFolderByCenter[center]

  return facilityImageNumbersByFolder[folder].map((number, index) => {
    const filename = `img_${String(number).padStart(2, '0')}.png`
    const relativePath = `${folder}/${filename}`
    const dimensions = nonStandardImageDimensions.get(relativePath) ?? {
      height: 584,
      width: 1018,
    }

    return {
      alt: `배우앤배움 ${centers[center]} 시설 이미지 ${index + 1}`,
      ...dimensions,
      id: `${folder}-${filename}`,
      src: `/assets/facilities/${relativePath}`,
    }
  })
}
