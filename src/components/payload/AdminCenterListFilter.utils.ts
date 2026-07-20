import type { Where } from 'payload'

export const adminCenterListFilterComponentPath =
  '@/components/payload/AdminCenterListFilter#AdminCenterListFilter'

export const centerListFilterFields = ['center', 'centers'] as const

export type CenterListFilterField = (typeof centerListFilterFields)[number]
export type CenterListFilterValue = 'all' | 'art' | 'avenue' | 'exam' | 'highteen' | 'kids'
export type CenterListFilterConfig = {
  fieldName: CenterListFilterField
  hasMany: boolean
}
export type ExamResultTypeListFilterValue = 'all' | 'university' | 'arts_high_school'
export type CompanyListFilterValue = string
export type SelectListFilterOption = {
  label: string
  value: string
}

const validCenterValues = new Set<CenterListFilterValue>([
  'all',
  'art',
  'avenue',
  'exam',
  'highteen',
  'kids',
])
const validExamResultTypeValues = new Set<ExamResultTypeListFilterValue>([
  'all',
  'university',
  'arts_high_school',
])

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function nestedFields(field: unknown): unknown[] {
  const record = field as Record<string, unknown>
  const fields = Array.isArray(record.fields) ? record.fields : []
  const tabs = Array.isArray(record.tabs)
    ? record.tabs.flatMap((tab) => {
        const tabRecord = objectValue(tab)

        return Array.isArray(tabRecord?.fields) ? tabRecord.fields : []
      })
    : []
  const blocks = Array.isArray(record.blocks)
    ? record.blocks.flatMap((block) => {
        const blockRecord = objectValue(block)

        return Array.isArray(blockRecord?.fields) ? blockRecord.fields : []
      })
    : []

  return [...fields, ...tabs, ...blocks]
}

function findFieldNamed(
  fields: unknown[],
  fieldName: string,
): Record<string, unknown> | undefined {
  for (const field of fields) {
    const record = objectValue(field)

    if (record?.name === fieldName) {
      return record
    }

    const nestedField = findFieldNamed(nestedFields(field), fieldName)

    if (nestedField) {
      return nestedField
    }
  }

  return undefined
}

export function centerListFilterConfig(fields: unknown[]): CenterListFilterConfig | undefined {
  const centerField = findFieldNamed(fields, 'center')

  if (centerField) {
    return {
      fieldName: 'center',
      hasMany: false,
    }
  }

  const centersField = findFieldNamed(fields, 'centers')

  if (!centersField) {
    return undefined
  }

  return {
    fieldName: 'centers',
    hasMany: centersField.hasMany === true,
  }
}

export function centerListFilterFieldName(fields: unknown[]): CenterListFilterField | undefined {
  return centerListFilterConfig(fields)?.fieldName
}

export function selectListFilterOptions(
  fields: unknown[],
  fieldName: string,
): SelectListFilterOption[] {
  const options = findFieldNamed(fields, fieldName)?.options

  if (!Array.isArray(options)) {
    return []
  }

  return options.flatMap((option) => {
    if (typeof option === 'string') {
      return [{ label: option, value: option }]
    }

    const record = objectValue(option)

    return typeof record?.label === 'string' && typeof record.value === 'string'
      ? [{ label: record.label, value: record.value }]
      : []
  })
}

function omitListWhereFields(
  value: unknown,
  fieldNames: ReadonlySet<string>,
): Record<string, unknown> | undefined {
  const record = objectValue(value)

  if (!record) {
    return undefined
  }

  const next: Record<string, unknown> = {}

  for (const [key, item] of Object.entries(record)) {
    if (fieldNames.has(key)) {
      continue
    }

    if (key === 'and' || key === 'or') {
      const children = Array.isArray(item)
        ? item
        : Object.values(objectValue(item) ?? {})
      const filtered = children
        .map((child) => omitListWhereFields(child, fieldNames))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry && Object.keys(entry).length))

      if (filtered.length > 0) {
        next[key] = filtered
      }

      continue
    }

    next[key] = item
  }

  const nextKeys = Object.keys(next)

  if (nextKeys.length === 0) {
    return undefined
  }

  if (nextKeys.length === 1 && (nextKeys[0] === 'and' || nextKeys[0] === 'or')) {
    const logicalItems = next[nextKeys[0]]

    if (Array.isArray(logicalItems) && logicalItems.length === 1) {
      return logicalItems[0] as Record<string, unknown>
    }
  }

  return next
}

const centerListFilterFieldSet = new Set<string>(centerListFilterFields)
const examResultTypeListFilterFieldSet = new Set<string>([
  'resultType',
  ...centerListFilterFields,
])
const companyListFilterFieldSet = new Set<string>(['company', ...centerListFilterFields])

function omitCenterListWhere(value: unknown): Record<string, unknown> | undefined {
  return omitListWhereFields(value, centerListFilterFieldSet)
}

function centerWhere({
  center,
  fieldName,
  hasMany,
}: {
  center: CenterListFilterValue
  fieldName: CenterListFilterField
  hasMany: boolean
}): Where | undefined {
  if (center === 'all') {
    return undefined
  }

  if (!hasMany) {
    return {
      [fieldName]: {
        equals: center,
      },
    }
  }

  return {
    or: [
      {
        centers: {
          contains: center,
        },
      },
      {
        centers: {
          contains: 'all',
        },
      },
    ],
  }
}

export function buildCenterListWhere({
  center,
  existingWhere,
  fieldName,
  hasMany = fieldName === 'centers',
}: {
  center: CenterListFilterValue
  existingWhere?: unknown
  fieldName: CenterListFilterField
  hasMany?: boolean
}): Where {
  const baseWhere = omitCenterListWhere(existingWhere)
  const nextCenterWhere = centerWhere({ center, fieldName, hasMany })

  if (!baseWhere && !nextCenterWhere) {
    return {}
  }

  if (!baseWhere) {
    return nextCenterWhere ?? {}
  }

  if (!nextCenterWhere) {
    return baseWhere as Where
  }

  return {
    and: [baseWhere as Where, nextCenterWhere],
  }
}

function centerValueFromCondition(fieldName: CenterListFilterField, value: unknown) {
  const condition = objectValue(value)
  const operatorValue = condition?.equals ?? condition?.contains

  return typeof operatorValue === 'string' && validCenterValues.has(operatorValue as CenterListFilterValue)
    ? (operatorValue as CenterListFilterValue)
    : undefined
}

function iterableWhereChildren(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }

  const record = objectValue(value)

  return record ? Object.values(record) : []
}

export function selectedCenterFromWhere(
  value: unknown,
  fieldName: CenterListFilterField,
): CenterListFilterValue | undefined {
  const record = objectValue(value)

  if (!record) {
    return undefined
  }

  const direct = centerValueFromCondition(fieldName, record[fieldName])

  if (direct && direct !== 'all') {
    return direct
  }

  for (const item of Object.values(record)) {
    const itemValue = selectedCenterFromWhere(item, fieldName)

    if (itemValue && itemValue !== 'all') {
      return itemValue
    }

    for (const child of iterableWhereChildren(item)) {
      const childValue = selectedCenterFromWhere(child, fieldName)

      if (childValue && childValue !== 'all') {
        return childValue
      }
    }
  }

  return undefined
}

function examResultTypeWhere(resultType: ExamResultTypeListFilterValue): Where | undefined {
  if (resultType === 'all') {
    return undefined
  }

  return {
    resultType: {
      equals: resultType,
    },
  }
}

export function buildExamResultTypeListWhere({
  existingWhere,
  resultType,
}: {
  existingWhere?: unknown
  resultType: ExamResultTypeListFilterValue
}): Where {
  const baseWhere = omitListWhereFields(existingWhere, examResultTypeListFilterFieldSet)
  const nextResultTypeWhere = examResultTypeWhere(resultType)

  if (!baseWhere && !nextResultTypeWhere) {
    return {}
  }

  if (!baseWhere) {
    return nextResultTypeWhere ?? {}
  }

  if (!nextResultTypeWhere) {
    return baseWhere as Where
  }

  return {
    and: [baseWhere as Where, nextResultTypeWhere],
  }
}

function examResultTypeValueFromCondition(value: unknown) {
  const condition = objectValue(value)
  const operatorValue = condition?.equals

  return typeof operatorValue === 'string' &&
    validExamResultTypeValues.has(operatorValue as ExamResultTypeListFilterValue)
    ? (operatorValue as ExamResultTypeListFilterValue)
    : undefined
}

export function selectedExamResultTypeFromWhere(
  value: unknown,
): ExamResultTypeListFilterValue | undefined {
  const record = objectValue(value)

  if (!record) {
    return undefined
  }

  const direct = examResultTypeValueFromCondition(record.resultType)

  if (direct && direct !== 'all') {
    return direct
  }

  for (const item of Object.values(record)) {
    const itemValue = selectedExamResultTypeFromWhere(item)

    if (itemValue && itemValue !== 'all') {
      return itemValue
    }

    for (const child of iterableWhereChildren(item)) {
      const childValue = selectedExamResultTypeFromWhere(child)

      if (childValue && childValue !== 'all') {
        return childValue
      }
    }
  }

  return undefined
}

export function buildCompanyListWhere({
  company,
  existingWhere,
}: {
  company: CompanyListFilterValue
  existingWhere?: unknown
}): Where {
  const baseWhere = omitListWhereFields(existingWhere, companyListFilterFieldSet)
  const nextCompanyWhere: Where | undefined =
    company === 'all'
      ? undefined
      : {
          company: {
            equals: company,
          },
        }

  if (!baseWhere && !nextCompanyWhere) {
    return {}
  }

  if (!baseWhere) {
    return nextCompanyWhere ?? {}
  }

  if (!nextCompanyWhere) {
    return baseWhere as Where
  }

  return {
    and: [baseWhere as Where, nextCompanyWhere],
  }
}

export function selectedCompanyFromWhere(value: unknown): CompanyListFilterValue | undefined {
  const record = objectValue(value)

  if (!record) {
    return undefined
  }

  const condition = objectValue(record.company)
  const direct = condition?.equals

  if (typeof direct === 'string' && direct !== 'all') {
    return direct
  }

  for (const item of Object.values(record)) {
    const itemValue = selectedCompanyFromWhere(item)

    if (itemValue) {
      return itemValue
    }

    for (const child of iterableWhereChildren(item)) {
      const childValue = selectedCompanyFromWhere(child)

      if (childValue) {
        return childValue
      }
    }
  }

  return undefined
}
