import type { AfterErrorHook } from 'payload'

const duplicateMediaMessage =
  '같은 이름의 파일이 이미 등록되어 있습니다. 파일명을 변경한 뒤 다시 업로드해 주세요.'
const duplicateValueMessage = '이미 등록된 값입니다. 다른 값을 입력해 주세요.'

type ErrorResponseItem = {
  data?: {
    errors?: ValidationFieldError[]
    [key: string]: unknown
  }
  message?: string
  [key: string]: unknown
}

type ValidationFieldError = {
  label?: unknown
  message?: string
  path?: string
  [key: string]: unknown
}

type CollectionLike = {
  flattenedFields?: Array<{
    label?: unknown
    name?: string
  }>
  slug?: string
}

type RequestLike = {
  i18n: {
    language?: string
  }
  t: (key: 'error:valueMustBeUnique') => string
}

function validationErrors(item: ErrorResponseItem) {
  return Array.isArray(item.data?.errors) ? item.data.errors : []
}

function fieldNames(path: string | undefined) {
  return String(path ?? '')
    .split(',')
    .map((part) => part.trim().split('.').filter(Boolean).at(-1) ?? '')
    .filter(Boolean)
}

function staticLabel(label: unknown, language: string | undefined) {
  if (typeof label === 'string') {
    return label
  }

  if (!label || typeof label !== 'object') {
    return ''
  }

  const labels = label as Record<string, unknown>
  const translatedLabel = language ? labels[language] : undefined
  const fallbackLabel = Object.values(labels)[0]

  return typeof translatedLabel === 'string'
    ? translatedLabel
    : typeof fallbackLabel === 'string'
      ? fallbackLabel
      : ''
}

function fieldLabels(
  collection: CollectionLike,
  errors: ValidationFieldError[],
  language: string | undefined,
) {
  const labels = new Set<string>()

  for (const error of errors) {
    const errorLabel = staticLabel(error.label, language)

    if (errorLabel) {
      labels.add(errorLabel)
      continue
    }

    for (const name of fieldNames(error.path)) {
      const field = collection.flattenedFields?.find((candidate) => candidate.name === name)
      const label = staticLabel(field?.label, language)

      if (label) {
        labels.add(label)
      }
    }
  }

  return [...labels]
}

function duplicateSummary(collection: CollectionLike, errors: ValidationFieldError[], language?: string) {
  if (collection.slug === 'media') {
    return duplicateMediaMessage
  }

  const labels = fieldLabels(collection, errors, language)

  if (labels.length > 0) {
    return `${labels.join(', ')} 항목에 이미 등록된 값이 있습니다. 다른 값을 입력해 주세요.`
  }

  return '이미 등록된 값과 중복됩니다. 다른 값을 입력한 뒤 다시 저장해 주세요.'
}

export function friendlyAdminErrorResponse({
  collection,
  request,
  response,
}: {
  collection: CollectionLike
  request: RequestLike
  response: { errors: ErrorResponseItem[]; [key: string]: unknown }
}) {
  const uniqueValidationMessage = request.t('error:valueMustBeUnique')
  let changed = false
  const errors = response.errors.map((item) => {
    const itemValidationErrors = validationErrors(item)
    const uniqueErrors = itemValidationErrors.filter(
      (error) => error.message === uniqueValidationMessage,
    )

    if (uniqueErrors.length === 0) {
      return item
    }

    changed = true

    return {
      ...item,
      data: {
        ...item.data,
        errors: itemValidationErrors.map((error) =>
          error.message === uniqueValidationMessage
            ? { ...error, message: duplicateValueMessage }
            : error,
        ),
      },
      message: duplicateSummary(collection, uniqueErrors, request.i18n.language),
    }
  })

  return changed ? { ...response, errors } : response
}

export const applyFriendlyAdminErrorMessages: AfterErrorHook = ({ collection, req, result }) => {
  if (!collection || !result || !Array.isArray(result.errors)) {
    return
  }

  return {
    response: friendlyAdminErrorResponse({
      collection,
      request: req,
      response: result,
    }),
  }
}
