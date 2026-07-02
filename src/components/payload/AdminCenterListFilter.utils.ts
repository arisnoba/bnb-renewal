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

const validCenterValues = new Set<CenterListFilterValue>([
  'all',
  'art',
  'avenue',
  'exam',
  'highteen',
  'kids',
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
  fieldName: CenterListFilterField,
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

function omitCenterListWhere(value: unknown): Record<string, unknown> | undefined {
  const record = objectValue(value)

  if (!record) {
    return undefined
  }

  const next: Record<string, unknown> = {}

  for (const [key, item] of Object.entries(record)) {
    if (centerListFilterFields.includes(key as CenterListFilterField)) {
      continue
    }

    if ((key === 'and' || key === 'or') && Array.isArray(item)) {
      const filtered = item
        .map(omitCenterListWhere)
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
