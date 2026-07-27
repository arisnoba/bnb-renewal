import type { Profile } from '@/payload-types'

import { publishedImageSrc } from './publishedImageSrc'

export const profileGalleryFields = [
  'photoImage1',
  'photoImage2',
  'photoImage3',
  'photoImage4',
  'photoImage5',
  'photoImage6',
] as const satisfies ReadonlyArray<keyof Profile>

export type ProfileGallerySource = Pick<Profile, (typeof profileGalleryFields)[number]>

export function profileGalleryImageSources(profile: ProfileGallerySource) {
  return profileGalleryFields
    .map((field) => publishedImageSrc(profile[field]))
    .filter((src): src is string => Boolean(src))
}

export function firstProfileGalleryImageSource(profile: ProfileGallerySource) {
  return profileGalleryImageSources(profile)[0] ?? ''
}
