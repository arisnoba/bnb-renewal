import assert from 'node:assert/strict'
import test from 'node:test'

import { profileDetailImages } from './profileDetailImages'

test('프로필 상세 이미지는 목록 대표 이미지를 제외하고 갤러리 필드만 사용한다', () => {
  const profile = {
    photoImage1: 'media/profiles/gallery-images/1/color-1.jpg',
    photoImage2: null,
    photoImage3: 'media/profiles/gallery-images/1/color-2.jpg',
    photoImage4: null,
    photoImage5: null,
    photoImage6: null,
    profileImageMedia: {
      id: 1,
      url: '/media/profiles/profile-images/1/black-and-white.jpg',
    },
    profileImagePath: '/legacy/profiles/black-and-white.jpg',
  }

  assert.deepEqual(profileDetailImages(profile), [
    {
      src: '/media/profiles/gallery-images/1/color-1.jpg',
      type: 'legacy',
    },
    {
      src: '/media/profiles/gallery-images/1/color-2.jpg',
      type: 'legacy',
    },
  ])
})
