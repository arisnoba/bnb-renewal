import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { centerScopedCollectionAccess } from './access'
import {
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

const HANGUL_INITIALS = [
  'g',
  'kk',
  'n',
  'd',
  'tt',
  'r',
  'm',
  'b',
  'pp',
  's',
  'ss',
  '',
  'j',
  'jj',
  'ch',
  'k',
  't',
  'p',
  'h',
]

const HANGUL_MEDIALS = [
  'a',
  'ae',
  'ya',
  'yae',
  'eo',
  'e',
  'yeo',
  'ye',
  'o',
  'wa',
  'wae',
  'oe',
  'yo',
  'u',
  'wo',
  'we',
  'wi',
  'yu',
  'eu',
  'ui',
  'i',
]

const HANGUL_FINALS = [
  '',
  'k',
  'k',
  'ks',
  'n',
  'nj',
  'nh',
  't',
  'l',
  'lk',
  'lm',
  'lb',
  'ls',
  'lt',
  'lp',
  'lh',
  'm',
  'p',
  'ps',
  't',
  't',
  'ng',
  't',
  't',
  'k',
  't',
  'p',
  't',
]

type ArtistPressAgencyNormalizedKeyDoc = {
  id?: number | string
  normalizedKey?: unknown
}

const isArtistAdminMenuHidden = ({ user }: { user?: unknown }) => {
  return !isGlobalAdminUser(user) && userCenterValue(user) !== 'art'
}

function sameId(left: unknown, right: unknown) {
  return left != null && right != null && String(left) === String(right)
}

function normalizeKeyValue(value: unknown) {
  return String(value ?? '')
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function romanizeHangul(value: string) {
  return Array.from(value).map((char) => {
    const code = char.charCodeAt(0)

    if (code < 0xac00 || code > 0xd7a3) {
      return char
    }

    const offset = code - 0xac00
    const initialIndex = Math.floor(offset / 588)
    const medialIndex = Math.floor((offset % 588) / 28)
    const finalIndex = offset % 28

    return `${HANGUL_INITIALS[initialIndex]}${HANGUL_MEDIALS[medialIndex]}${HANGUL_FINALS[finalIndex]}`
  }).join('')
}

function normalizedKeyFromAgencyName(value: unknown) {
  const agencyName = String(value ?? '').trim()
  const latinKey = normalizeKeyValue(agencyName.replace(/[가-힣]+/g, ' '))

  if (latinKey) {
    return latinKey
  }

  return normalizeKeyValue(romanizeHangul(agencyName)) || 'agency'
}

function isGeneratedNormalizedKey(value: unknown) {
  const key = String(value ?? '').trim()

  return !key || key.startsWith('legacy-') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)
}

async function nextUniqueNormalizedKey({
  baseKey,
  currentId,
  payload,
}: {
  baseKey: string
  currentId?: unknown
  payload?: {
    find: (args: {
      collection: 'artist-press-agencies'
      depth: number
      limit: number
      overrideAccess: boolean
      pagination: false
    }) => Promise<{ docs: ArtistPressAgencyNormalizedKeyDoc[] }>
  }
}) {
  if (!payload) {
    return baseKey
  }

  const result = await payload.find({
    collection: 'artist-press-agencies',
    depth: 0,
    limit: 10000,
    overrideAccess: true,
    pagination: false,
  })
  const usedKeys = new Set(
    result.docs
      .filter((doc) => !sameId(doc.id, currentId))
      .map((doc) => String(doc.normalizedKey ?? '').trim())
      .filter(Boolean),
  )

  if (!usedKeys.has(baseKey)) {
    return baseKey
  }

  let suffix = 2

  while (usedKeys.has(`${baseKey}-${suffix}`)) {
    suffix += 1
  }

  return `${baseKey}-${suffix}`
}

const normalizeAgencyKey: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) {
    return data
  }

  const currentKey = data.normalizedKey ?? originalDoc?.normalizedKey
  const shouldGenerateKey = operation === 'create' || isGeneratedNormalizedKey(currentKey)

  if (!shouldGenerateKey) {
    return data
  }

  const baseKey = normalizedKeyFromAgencyName(data.agencyName ?? originalDoc?.agencyName)

  return {
    ...data,
    normalizedKey: await nextUniqueNormalizedKey({
      baseKey,
      currentId: data.id ?? originalDoc?.id,
      payload: req.payload,
    }),
  }
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
    plural: '소속사 로고 설정',
    singular: '소속사 로고 설정',
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ['agencyName', 'logoMedia', 'authorName', 'updatedAt'],
    group: '아티스트',
    hidden: isArtistAdminMenuHidden,
    useAsTitle: 'agencyName',
  },
  defaultSort: 'agencyName',
  hooks: {
    beforeValidate: [normalizeAgencyKey, forceArtCenter],
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
      name: 'normalizedKey',
      type: 'text',
      label: '정규화 키',
      required: true,
      unique: true,
      admin: {
        hidden: true,
      },
      validate: validateNormalizedKey,
    },
    {
      name: 'logoMedia',
      type: 'upload',
      label: '소속사 로고 이미지',
      relationTo: 'media',
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
    {
      name: 'legacyAliases',
      type: 'array',
      label: '레거시 파일명',
      labels: {
        plural: '레거시 파일명',
        singular: '레거시 파일명',
      },
      admin: {
        hidden: true,
        initCollapsed: true,
      },
      fields: [
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
