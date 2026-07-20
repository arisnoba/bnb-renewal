import type { Access, CollectionBeforeValidateHook, CollectionConfig, Validate } from 'payload'

import { anyone } from '@/access/anyone'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'
import {
  authorNameField,
  authorNameFromCenters,
  centerOptions,
  isGlobalAdminUser,
  sidebarFields,
  userCenterValue,
} from './shared'
import {
  createFinalizeIdSlugAfterCreate,
  createIdSlugBeforeValidate,
} from './slugUtils'

const forceArtCenter: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data
  }

  return {
    ...data,
    authorName: data.authorName ?? authorNameFromCenters(['art']),
    centers: ['art'],
  }
}

const isArtistAdminMenuHidden = ({ user }: { user?: unknown }) => {
  return !isGlobalAdminUser(user) && userCenterValue(user) !== 'art'
}

const artistPressAgencyAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  return isGlobalAdminUser(req.user) || userCenterValue(req.user) === 'art'
}

const normalizeAgencySlug = createIdSlugBeforeValidate()
const finalizeAgencySlugAfterCreate = createFinalizeIdSlugAfterCreate('artist-press-agencies')

function validateSlug(value: unknown) {
  const slug = String(value ?? '').trim()

  if (!slug) {
    return '슬러그를 입력하세요.'
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return '슬러그는 영문 소문자, 숫자, 하이픈(-)만 입력할 수 있습니다.'
  }

  return true
}

const validateAgencyLogoMedia: Validate<unknown> = (value) => {
  return value ? true : '소속사 로고 이미지를 선택해야 합니다.'
}

export const ArtistPressAgencies: CollectionConfig = {
  slug: 'artist-press-agencies',
  labels: {
    plural: '소속사 로고 설정',
    singular: '소속사 로고 설정',
  },
  access: {
    create: artistPressAgencyAccess,
    delete: artistPressAgencyAccess,
    read: anyone,
    update: artistPressAgencyAccess,
  },
  admin: {
    defaultColumns: ['agencyName', 'logoMedia', 'authorName', 'updatedAt'],
    group: '아티스트',
    hidden: isArtistAdminMenuHidden,
    useAsTitle: 'agencyName',
  },
  defaultSort: 'agencyName',
  hooks: {
    afterChange: [
      finalizeAgencySlugAfterCreate,
      normalizeUploadedMediaPrefixes([{ path: 'logoMedia', role: 'artist-press.agency-logo' }]),
    ],
    beforeValidate: [normalizeAgencySlug, forceArtCenter],
  },
  fields: [
    {
      name: 'agencyName',
      type: 'text',
      label: '소속사명',
      required: true,
      admin: {
        placeholder: '예: SM ENT(에스엠엔터)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: '슬러그',
      required: true,
      unique: true,
      admin: {
        hidden: true,
      },
      validate: validateSlug,
    },
    {
      name: 'logoMedia',
      type: 'upload',
      label: '소속사 로고 이미지',
      relationTo: 'media',
      validate: validateAgencyLogoMedia,
      admin: {
        className: 'bnb-admin-required-field',
        description: '400×400px 이상의 정사각형 이미지를 권장합니다.',
      },
    },
    {
      name: 'linkedArtists',
      type: 'ui',
      label: '연결 배우 수',
      admin: {
        components: {
          Cell:
            '@/components/payload/ArtistPressAgencyLinkedArtistsField#ArtistPressAgencyLinkedArtistsCell',
          Field:
            '@/components/payload/ArtistPressAgencyLinkedArtistsField#ArtistPressAgencyLinkedArtistsField',
        },
      },
    },
    ...sidebarFields([
      {
        name: 'centers',
        type: 'select',
        label: '센터',
        defaultValue: ['art'],
        hasMany: true,
        options: centerOptions,
        required: true,
        admin: {
          hidden: true,
        },
      },
      authorNameField,
    ]),
  ],
}
