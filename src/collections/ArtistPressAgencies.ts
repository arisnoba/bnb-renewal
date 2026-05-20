import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { centerScopedCollectionAccess } from './access'
import {
  adminRow,
  authorNameField,
  authorNameFromCenters,
  centerOptions,
  isGlobalAdminUser,
  sidebarFields,
  userCenterValue,
} from './shared'

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

function validateNormalizedKey(value: unknown) {
  const key = String(value ?? '').trim()

  if (!key) {
    return '정규화 키를 입력하세요.'
  }

  if (!/^[a-z0-9-]+$/.test(key)) {
    return '정규화 키는 영문 소문자, 숫자, 하이픈(-)만 입력할 수 있습니다.'
  }

  return true
}

export const ArtistPressAgencies: CollectionConfig = {
  slug: 'artist-press-agencies',
  labels: {
    plural: '출신 아티스트 소속사 설정',
    singular: '출신 아티스트 소속사 설정',
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ['agencyName', 'reviewStatus', 'logoMedia', 'authorName', 'updatedAt'],
    group: '아티스트',
    hidden: isArtistAdminMenuHidden,
    useAsTitle: 'agencyName',
  },
  defaultSort: 'agencyName',
  hooks: {
    beforeValidate: [forceArtCenter],
  },
  fields: [
    adminRow([
      {
        name: 'agencyName',
        type: 'text',
        label: '소속사명',
        required: true,
      },
      {
        name: 'normalizedKey',
        type: 'text',
        label: '정규화 키',
        required: true,
        unique: true,
        admin: {
          description: '영문 소문자, 숫자, 하이픈(-)만 입력하세요.',
        },
        validate: validateNormalizedKey,
      },
    ]),
    {
      name: 'logoMedia',
      type: 'upload',
      label: '소속사 로고 이미지',
      relationTo: 'media',
    },
    {
      name: 'reviewStatus',
      type: 'select',
      label: '검수 상태',
      defaultValue: 'needs-review',
      options: [
        { label: '확인 필요', value: 'needs-review' },
        { label: '확인 완료', value: 'confirmed' },
      ],
      required: true,
    },
    {
      name: 'legacyAliases',
      type: 'array',
      label: '레거시 파일명',
      labels: {
        plural: '레거시 파일명',
        singular: '레거시 파일명',
      },
      admin: {
        components: {
          RowLabel:
            '@/components/payload/ArtistPressAgencyAliasRowLabel#ArtistPressAgencyAliasRowLabel',
        },
        initCollapsed: true,
      },
      fields: [
        adminRow([
          {
            name: 'originalName',
            type: 'text',
            label: '원본 파일명',
            required: true,
          },
          {
            name: 'useCount',
            type: 'number',
            label: '사용 건수',
            admin: {
              readOnly: true,
            },
          },
        ]),
        {
          name: 'sampleTitle',
          type: 'text',
          label: '대표 글 제목',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'memo',
      type: 'textarea',
      label: '메모',
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
