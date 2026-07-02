import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
  SelectField,
  Validate,
} from 'payload'

import { centerScopedCollectionAccess } from './access'
import {
  adminRow,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  publishingStatusSelectAdmin,
  sidebarFields,
} from './shared'
import {
  createFinalizeIdSlugAfterCreate,
  createIdSlugBeforeValidate,
  idSlugField,
} from './slugUtils'
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from './revalidateFrontend'

const faqCategoryOptions = [
  { label: '입학/상담', value: 'admission' },
  { label: '수업/과정', value: 'class' },
  { label: '수강료/할인', value: 'tuition' },
  { label: '캐스팅/프로필', value: 'casting' },
  { label: '입시', value: 'exam' },
  { label: '스타카드', value: 'starcard' },
  { label: '이용방법', value: 'etc' },
]

const answerModeOptions = [
  { label: '단일 답변', value: 'shared' },
  { label: '센터별 답변', value: 'centerVariants' },
]

const faqAnswerMarkdownDescription =
  '표는 마크다운 표를 사용합니다. 버튼은 한 줄에 [버튼 문구](/현재-경로) 형식으로 입력합니다. 예: [수강료 안내 바로가기](/art#admission)'

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

type FaqData = {
  answerMode?: unknown
  centers?: unknown
  sharedAnswer?: unknown
  variants?: unknown
}

function selectedFaqCenters(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : []

  return values
    .map((item) => String(item ?? '').trim())
    .filter((item) => item && item !== 'all')
}

function hasMultipleFaqCenters(value: unknown) {
  return selectedFaqCenters(value).length >= 2
}

function hasFaqCenterValue(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : []

  return values.some((item) => String(item ?? '').trim())
}

const faqCentersField: SelectField = {
  ...(centersField as SelectField),
}

function valuesEqual(left: unknown, right: unknown) {
  if (Object.is(left, right)) {
    return true
  }

  try {
    return JSON.stringify(left) === JSON.stringify(right)
  } catch {
    return false
  }
}

function isFaqBulkUpdateRequest({
  operation,
  req,
}: {
  operation?: unknown
  req?: { url?: string }
}) {
  if (operation !== 'update') {
    return false
  }

  const url = req?.url

  if (typeof url !== 'string') {
    return false
  }

  try {
    return Array.from(new URL(url, 'http://payload.local').searchParams.keys()).some(
      (key) => key === 'where' || key.startsWith('where['),
    )
  } catch {
    return url.includes('where=') || url.includes('where[') || url.includes('where%5B')
  }
}

function isUnchangedFaqBulkUpdateValue({
  operation,
  previousValue,
  req,
  value,
}: {
  operation?: unknown
  previousValue?: unknown
  req?: { url?: string }
  value: unknown
}) {
  return isFaqBulkUpdateRequest({ operation, req }) && valuesEqual(value, previousValue)
}

const validateSharedAnswer: Validate<
  string | null | undefined,
  unknown,
  FaqData
> = (value, { operation, previousValue, req, siblingData }) => {
  if (isUnchangedFaqBulkUpdateValue({ operation, previousValue, req, value })) {
    return true
  }

  if (
    (siblingData?.answerMode !== 'centerVariants' ||
      !hasMultipleFaqCenters(siblingData?.centers)) &&
    !String(value ?? '').trim()
  ) {
    return '단일 답변을 입력해야 합니다.'
  }

  return true
}

const validateFaqVariants: Validate<
  unknown[] | null | undefined,
  unknown,
  FaqData
> = (value, { operation, previousValue, req, siblingData }) => {
  if (isUnchangedFaqBulkUpdateValue({ operation, previousValue, req, value })) {
    return true
  }

  if (siblingData?.answerMode !== 'centerVariants') {
    return true
  }

  if (!hasMultipleFaqCenters(siblingData?.centers)) {
    return '센터별 답변은 센터를 2개 이상 선택했을 때만 사용할 수 있습니다.'
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

const validateFaqCategory: Validate<unknown> = (
  value,
  { operation, previousValue, req },
) => {
  if (isUnchangedFaqBulkUpdateValue({ operation, previousValue, req, value })) {
    return true
  }

  return String(value ?? '').trim() ? true : '분류를 선택해야 합니다.'
}

const normalizeFaqData: CollectionBeforeValidateHook = (args) => {
  const { data } = args

  if (!data) {
    return data
  }

  if (
    args.operation === 'update' &&
    args.originalDoc &&
    valuesEqual(data.centers, args.originalDoc.centers) &&
    valuesEqual(data.answerMode, args.originalDoc.answerMode) &&
    valuesEqual(data.sharedAnswer, args.originalDoc.sharedAnswer) &&
    valuesEqual(data.variants, args.originalDoc.variants)
  ) {
    return data
  }

  const nextData = { ...data }

  if (
    args.operation === 'update' &&
    isFaqBulkUpdateRequest({ operation: args.operation, req: args.req }) &&
    hasFaqCenterValue(args.originalDoc?.centers) &&
    !hasFaqCenterValue(nextData.centers)
  ) {
    nextData.centers = args.originalDoc?.centers
  }

  const variants = Array.isArray(nextData.variants)
    ? (nextData.variants as FaqVariant[])
    : Array.isArray(args.originalDoc?.variants)
      ? (args.originalDoc.variants as FaqVariant[])
      : []
  const sharedAnswer = nextData.sharedAnswer ?? args.originalDoc?.sharedAnswer

  if (!hasMultipleFaqCenters(nextData.centers)) {
    nextData.answerMode = 'shared'

    if (!String(sharedAnswer ?? '').trim()) {
      const firstAnswer = variants
        .map((variant) =>
          variant && typeof variant === 'object'
            ? String((variant as { answer?: unknown }).answer ?? '').trim()
            : '',
        )
        .find(Boolean)

      if (firstAnswer) {
        nextData.sharedAnswer = firstAnswer
      }
    }
  } else if (!nextData.answerMode) {
    nextData.answerMode = args.originalDoc?.answerMode ?? (variants.length > 0 ? 'centerVariants' : 'shared')
  }

  return nextData
}

const setFaqSlug = createIdSlugBeforeValidate()
const finalizeFaqSlugAfterCreate = createFinalizeIdSlugAfterCreate('faqs')
const revalidateFaqAfterChange = createCenterRevalidationAfterChange({
  cacheTagPrefixes: ['frontend_faqs'],
  reason: 'faq',
  suffixes: ['faq'],
})
const revalidateFaqAfterDelete = createCenterRevalidationAfterDelete({
  cacheTagPrefixes: ['frontend_faqs'],
  reason: 'faq',
  suffixes: ['faq'],
})

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
    afterChange: [finalizeFaqSlugAfterCreate, revalidateFaqAfterChange],
    afterDelete: [revalidateFaqAfterDelete],
    beforeValidate: [normalizeFaqData, centerScopedBeforeValidate, setFaqSlug],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '질문',
      required: true,
    },
    faqCentersField,
    adminRow([
      {
        name: 'category',
        type: 'select',
        label: '분류',
        options: faqCategoryOptions,
        validate: validateFaqCategory,
        admin: {
          className: 'bnb-admin-required-field',
          placeholder: '선택해 주세요',
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
          condition: (_data, siblingData) => hasMultipleFaqCenters(siblingData?.centers),
          layout: 'horizontal',
          width: '50%',
        },
      },
    ]),
    {
      name: 'sharedAnswer',
      type: 'textarea',
      label: '단일 답변',
      validate: validateSharedAnswer,
      admin: {
        className: 'bnb-admin-required-field',
        condition: (_data, siblingData) =>
          siblingData?.answerMode !== 'centerVariants' ||
          !hasMultipleFaqCenters(siblingData?.centers),
        description: `선택한 센터에 같은 답변을 노출할 때 사용합니다. ${faqAnswerMarkdownDescription}`,
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
          siblingData?.answerMode === 'centerVariants' &&
          hasMultipleFaqCenters(siblingData?.centers),
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
            description: faqAnswerMarkdownDescription,
            rows: 8,
          },
        },
      ],
    },
    ...sidebarFields([
      {
        name: 'displayStatus',
        type: 'select',
        label: '상태',
        defaultValue: 'published',
        options: displayStatusOptions,
        admin: publishingStatusSelectAdmin(),
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
    idSlugField,
  ],
}
