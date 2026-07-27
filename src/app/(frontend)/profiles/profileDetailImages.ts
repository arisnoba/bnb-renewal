import {
  profileGalleryImageSources,
  type ProfileGallerySource,
} from '@/utilities/profileGalleryImages'

import type { ProfileImageItem } from './ProfileDetailGallery.client'

export function profileDetailImages(profile: ProfileGallerySource): ProfileImageItem[] {
  return profileGalleryImageSources(profile).map((src) => ({ src, type: 'legacy' }))
}
