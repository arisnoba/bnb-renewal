import { MetaTitleField } from '@payloadcms/plugin-seo/fields'
import type { CollectionBeforeValidateHook } from 'payload'

export const seoTitleLength = {
  maxLength: 50,
  minLength: 30,
}

export function seoTitleField() {
  return MetaTitleField({
    hasGenerateFn: true,
    overrides: seoTitleLength,
  })
}

export function syncSeoMetaImageFromUpload(sourcePath: string): CollectionBeforeValidateHook {
  return ({ data, originalDoc }) => {
    if (!data) {
      return data
    }

    const hasSourceInData = hasPath(data, sourcePath)
    const sourceValue = hasSourceInData
      ? valueAtPath(data, sourcePath)
      : valueAtPath(originalDoc, sourcePath)
    const originalSourceValue = valueAtPath(originalDoc, sourcePath)
    const meta = objectValue(data.meta)
    const originalMeta = objectValue(originalDoc?.meta)
    const hasMetaInData = hasOwn(data, 'meta')
    const hasMetaImageInData = hasOwn(meta, 'image')
    const currentMetaImage = hasMetaImageInData ? meta.image : originalMeta?.image

    if (hasRelationValue(sourceValue)) {
      if (
        !hasRelationValue(currentMetaImage) ||
        relationValuesEqual(currentMetaImage, originalSourceValue)
      ) {
        return {
          ...data,
          meta: {
            ...meta,
            image: sourceValue,
          },
        }
      }

      return preserveOriginalMetaImage({
        data,
        hasMetaImageInData,
        hasMetaInData,
        meta,
        originalMeta,
      })
    }

    if (
      hasSourceInData &&
      hasRelationValue(currentMetaImage) &&
      relationValuesEqual(currentMetaImage, originalSourceValue)
    ) {
      return {
        ...data,
        meta: {
          ...meta,
          image: null,
        },
      }
    }

    return preserveOriginalMetaImage({
      data,
      hasMetaImageInData,
      hasMetaInData,
      meta,
      originalMeta,
    })
  }
}

function valueAtPath(value: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }

    return (current as Record<string, unknown>)[key]
  }, value)
}

function hasPath(value: unknown, path: string) {
  const keys = path.split('.')
  let current = value

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !hasOwn(current, key)) {
      return false
    }

    current = (current as Record<string, unknown>)[key]
  }

  return true
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function preserveOriginalMetaImage({
  data,
  hasMetaImageInData,
  hasMetaInData,
  meta,
  originalMeta,
}: {
  data: Record<string, unknown>
  hasMetaImageInData: boolean
  hasMetaInData: boolean
  meta: Record<string, unknown>
  originalMeta: Record<string, unknown>
}) {
  if (!hasMetaInData || hasMetaImageInData || !hasRelationValue(originalMeta.image)) {
    return data
  }

  return {
    ...data,
    meta: {
      ...meta,
      image: originalMeta.image,
    },
  }
}

function hasOwn(value: unknown, key: string) {
  return Boolean(
    value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key),
  )
}

function relationId(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }

  if (value && typeof value === 'object') {
    const id = (value as { id?: unknown }).id

    return typeof id === 'number' || typeof id === 'string' ? String(id) : undefined
  }

  return undefined
}

function hasRelationValue(value: unknown) {
  return relationId(value) !== undefined
}

function relationValuesEqual(left: unknown, right: unknown) {
  const leftId = relationId(left)
  const rightId = relationId(right)

  return leftId !== undefined && leftId === rightId
}
