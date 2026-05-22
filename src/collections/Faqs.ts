import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
  Validate,
} from 'payload'

import { createKoreanSlugifyWithFallback } from '../utilities/koreanSlugify'
import { centerScopedCollectionAccess } from './access'
import {
  adminRow,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  sidebarFields,
  slugField,
} from './shared'

const faqSlugify = createKoreanSlugifyWithFallback('faq')

const faqCategoryOptions = [
  { label: '입학/상담', value: 'admission' },
  { label: '수업/과정', value: 'class' },
  { label: '수강료/할인', value: 'tuition' },
  { label: '캐스팅/프로필', value: 'casting' },
  { label: '입시', value: 'exam' },
  { label: '스타카드', value: 'starcard' },
  { label: '기타', value: 'etc' },
]

const answerModeOptions = [
  { label: '공통 답변', value: 'shared' },
  { label: '센터별 답변', value: 'centerVariants' },
]

const variantCenterFields = [
  { field: 'centerArt', label: '아트센터' },
  { field: 'centerExam', label: '입시센터' },
  { field: 'centerKids', label: '키즈센터' },
  { field: 'centerHighteen', label: '하이틴센터' },
  { field: 'centerAvenue', label: '애비뉴센터' },
] as const

type FaqVariant = {
  [key: string]: unknown
}

const validateSharedAnswer: Validate<
  string | null | undefined,
  unknown,
  { answerMode?: unknown }
> = (value, { siblingData }) => {
  if (siblingData?.answerMode === 'shared' && !String(value ?? '').trim()) {
    return '공통 답변을 입력해야 합니다.'
  }

  return true
}

const validateFaqVariants: Validate<
  unknown[] | null | undefined,
  unknown,
  { answerMode?: unknown }
> = (value, { siblingData }) => {
  if (siblingData?.answerMode !== 'centerVariants') {
    return true
  }

  const variants = Array.isArray(value) ? (value as FaqVariant[]) : []

  if (variants.length === 0) {
    return '센터별 답변을 하나 이상 입력해야 합니다.'
  }

  const selectedCenters = new Set<string>()

  for (const [index, variant] of variants.entries()) {
    const variantCenters = variantCenterFields.filter(({ field }) => variant[field] === true)

    if (variantCenters.length === 0) {
      return `센터별 답변 ${index + 1}번에서 센터를 하나 이상 선택해야 합니다.`
    }

    for (const { field, label } of variantCenters) {
      if (selectedCenters.has(field)) {
        return `${label}가 센터별 답변에 중복 선택되었습니다.`
      }

      selectedCenters.add(field)
    }
  }

  return true
}

const normalizeFaqData: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data
  }

  const nextData = { ...data }
  const variants = Array.isArray(nextData.variants) ? nextData.variants : []

  if (!nextData.answerMode) {
    nextData.answerMode = variants.length > 0 ? 'centerVariants' : 'shared'
  }

  return nextData
}

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    plural: 'FAQ',
    singular: 'FAQ',
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      'title',
      'centers',
      'category',
      'answerMode',
      'displayStatus',
      'updatedAt',
    ],
    group: '운영/소식',
    useAsTitle: 'title',
  },
  defaultSort: 'displayOrder',
  hooks: {
    beforeValidate: [normalizeFaqData, centerScopedBeforeValidate],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '질문',
      required: true,
    },
    adminRow([
      {
        name: 'category',
        type: 'select',
        label: '분류',
        defaultValue: 'etc',
        options: faqCategoryOptions,
        required: true,
        admin: {
          width: '50%',
        },
      },
      {
        name: 'answerMode',
        type: 'radio',
        label: '답변 방식',
        defaultValue: 'shared',
        options: answerModeOptions,
        admin: {
          className: 'bnb-faq-answer-mode',
          layout: 'horizontal',
          width: '50%',
        },
      },
    ]),
    {
      name: 'sharedAnswer',
      type: 'textarea',
      label: '공통 답변',
      validate: validateSharedAnswer,
      admin: {
        className: 'bnb-admin-required-field',
        condition: (_data, siblingData) => siblingData?.answerMode === 'shared',
        description: '모든 선택 센터에 같은 답변을 노출할 때 사용합니다.',
        rows: 8,
      },
    },
    {
      name: 'variants',
      type: 'array',
      label: '센터별 답변',
      validate: validateFaqVariants,
      labels: {
        plural: '센터별 답변',
        singular: '센터별 답변',
      },
      admin: {
        condition: (_data, siblingData) =>
          siblingData?.answerMode !== 'shared',
        components: {
          RowLabel:
            '@/components/payload/FaqAnswerVariantRowLabel#FaqAnswerVariantRowLabel',
        },
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          admin: {
            className: 'bnb-faq-centers-row',
          },
          fields: [
            {
              name: 'centerArt',
              type: 'checkbox',
              label: '아트센터',
              defaultValue: false,
              admin: {
                width: '20%',
              },
            },
            {
              name: 'centerExam',
              type: 'checkbox',
              label: '입시센터',
              defaultValue: false,
              admin: {
                width: '20%',
              },
            },
            {
              name: 'centerKids',
              type: 'checkbox',
              label: '키즈센터',
              defaultValue: false,
              admin: {
                width: '20%',
              },
            },
            {
              name: 'centerHighteen',
              type: 'checkbox',
              label: '하이틴센터',
              defaultValue: false,
              admin: {
                width: '20%',
              },
            },
            {
              name: 'centerAvenue',
              type: 'checkbox',
              label: '애비뉴센터',
              defaultValue: false,
              admin: {
                width: '20%',
              },
            },
          ],
        },
        {
          name: 'questionOverride',
          type: 'text',
          label: '센터별 질문 문구',
          admin: {
            description: '기본 질문과 다르게 보여야 할 때만 입력합니다.',
          },
        },
        {
          name: 'answer',
          type: 'textarea',
          label: '답변',
          required: true,
          admin: {
            rows: 8,
          },
        },
      ],
    },
    ...sidebarFields([
      centersField,
      {
        name: 'displayStatus',
        type: 'select',
        label: '상태',
        defaultValue: 'draft',
        options: displayStatusOptions,
      },
      {
        name: 'displayOrder',
        type: 'number',
        label: '노출 순서',
        defaultValue: 0,
      },
      publishedAtField,
      authorNameField,
    ]),
    slugField({
      slugify: faqSlugify,
    }),
  ],
}
