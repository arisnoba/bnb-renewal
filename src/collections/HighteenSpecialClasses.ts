import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { createKoreanSlugifyWithFallback } from '../utilities/koreanSlugify'
import { centerScopedAccess, centerScopedReadAccess } from './access'
import {
  adminTabs,
  authorNameField,
  authorNameFromCenters,
  centerOptions,
  displayStatusOptions,
  isGlobalAdminUser,
  publishedAtField,
  sidebarFields,
  userCenterValue,
} from './shared'
import { newsBodyEditor } from './News'

const highteenSpecialClassSlugify = createKoreanSlugifyWithFallback(
  'highteen-special-class',
)

const highteenOnlyCreateAccess: Access = ({ req }) => {
  if (!req.user || typeof req.user !== 'object') {
    return false
  }

  const role = (req.user as { role?: unknown }).role
  const center = (req.user as { center?: unknown }).center

  return role === 'master' || role === 'admin' || center === 'highteen'
}

const isHighteenAdminMenuHidden = ({ user }: { user?: unknown }) => {
  return !isGlobalAdminUser(user) && userCenterValue(user) !== 'highteen'
}

const forceHighteenCenter: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data
  }

  return {
    ...data,
    authorName: data.authorName ?? authorNameFromCenters(['highteen']),
    centers: ['highteen'],
  }
}

export const HighteenSpecialClasses: CollectionConfig = {
  slug: 'highteen-special-classes',
  labels: {
    plural: '하이틴센터 특강',
    singular: '하이틴센터 특강',
  },
  access: {
    create: highteenOnlyCreateAccess,
    delete: centerScopedAccess,
    read: centerScopedReadAccess,
    update: centerScopedAccess,
  },
  admin: {
    defaultColumns: [
      'title',
      'publishedAt',
      'youtubeUrl',
      'displayStatus',
      'updatedAt',
    ],
    group: '교육',
    hidden: isHighteenAdminMenuHidden,
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  hooks: {
    beforeValidate: [forceHighteenCenter],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '제목',
      required: true,
    },
    ...adminTabs([
      {
        label: '콘텐츠',
        fields: [
          {
            name: 'youtubeUrl',
            type: 'text',
            label: '유튜브 URL',
            admin: {
              width: '50%',
            },
          },
          {
            name: 'youtubePreview',
            type: 'ui',
            admin: {
              components: {
                Field: '@/components/payload/YouTubePreviewField#YouTubePreviewField',
              },
            },
          },
          {
            name: 'body',
            type: 'richText',
            editor: newsBodyEditor,
            label: '본문',
          },
        ],
      },
      {
        label: '이미지',
        fields: [
          {
            name: 'thumbnailMedia',
            type: 'upload',
            label: '대표 이미지',
            relationTo: 'media',
          },
          {
            name: 'galleryImages',
            type: 'array',
            label: '첨부 이미지',
            labels: {
              plural: '첨부 이미지',
              singular: '첨부 이미지',
            },
            admin: {
              components: {
                RowLabel:
                  '@/components/payload/HighteenSpecialClassGalleryImageRowLabel#HighteenSpecialClassGalleryImageRowLabel',
              },
              initCollapsed: true,
            },
            fields: [
              {
                name: 'sourceFile',
                type: 'text',
                label: '원본 파일명',
                required: true,
              },
              {
                name: 'imageMedia',
                type: 'upload',
                label: '이미지',
                relationTo: 'media',
              },
              {
                name: 'displayOrder',
                type: 'number',
                label: '정렬',
                defaultValue: 0,
              },
            ],
          },
        ],
      },
    ]),
    ...sidebarFields([
      {
        name: 'centers',
        type: 'select',
        label: '센터',
        defaultValue: ['highteen'],
        hasMany: true,
        options: centerOptions,
        required: true,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'displayStatus',
        type: 'select',
        label: '상태',
        defaultValue: 'published',
        options: displayStatusOptions,
      },
      publishedAtField,
      authorNameField,
    ]),
    slugField({
      slugify: highteenSpecialClassSlugify,
    }),
  ],
}
