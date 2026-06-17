export type FacilityImage = {
  alt: string
  height: number
  id: string
  src: string
  width: number
}

const galleryNumbers = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
  45, 46, 47, 48, 49, 51, 52, 53, 54,
  70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
]

export const facilityImages: FacilityImage[] = [
  ...galleryNumbers.map((number) => {
    const id = `gallery_${String(number).padStart(2, '0')}`
    const isGallery51 = number === 51

    return {
      alt: `배우앤배움 시설 이미지 ${number}`,
      height: isGallery51 ? 585 : 584,
      id,
      src: `/assets/facilities/${id}.jpg`,
      width: isGallery51 ? 1019 : 1018,
    }
  }),
  {
    alt: '배우앤배움 시설 이미지 UC 01',
    height: 584,
    id: 'gallery_uc01',
    src: '/assets/facilities/gallery_uc01.jpg',
    width: 1018,
  },
  {
    alt: '배우앤배움 시설 이미지 UC 02',
    height: 584,
    id: 'gallery_uc02',
    src: '/assets/facilities/gallery_uc02.jpg',
    width: 1018,
  },
]
