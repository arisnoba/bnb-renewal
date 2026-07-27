import type { Profile } from '@/payload-types'
import { publishedImageSrc } from '@/utilities/publishedImageSrc'

import type { ProfileImageItem } from './ProfileDetailGallery.client'

const profileGalleryFields = [
  'photoImage1',
  'photoImage2',
  'photoImage3',
  'photoImage4',
  'photoImage5',
  'photoImage6',
] as const satisfies ReadonlyArray<keyof Profile>

type ProfileGallerySource = Pick<Profile, (typeof profileGalleryFields)[number]>

export function profileDetailImages(profile: ProfileGallerySource): ProfileImageItem[] {
  return profileGalleryFields
    .map((field) => publishedImageSrc(profile[field]))
    .filter((src): src is string => Boolean(src))
    .map((src) => ({ src, type: 'legacy' }))
}
