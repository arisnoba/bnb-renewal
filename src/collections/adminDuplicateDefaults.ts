import type { CollectionConfig, Field, FieldHook } from 'payload'

const duplicatedTitleSuffix = ' - 복제됨'

export function duplicatedAdminTitle(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const title = value.trim()

  if (!title || title.endsWith(duplicatedTitleSuffix)) {
    return title
  }

  return `${title}${duplicatedTitleSuffix}`
}

export function duplicatedAdminStatus() {
  return 'draft'
}

export function duplicatedAdminPublishedAt() {
  return new Date().toISOString()
}

const duplicateTitleHook: FieldHook = ({ value }) => duplicatedAdminTitle(value)
const duplicateStatusHook: FieldHook = duplicatedAdminStatus
const duplicatePublishedAtHook: FieldHook = duplicatedAdminPublishedAt

function hasDraftOption(field: Field) {
  if (field.type !== 'select' || !Array.isArray(field.options)) {
    return false
  }

  return field.options.some((option) => {
    if (typeof option === 'string') {
      return option === 'draft'
    }

    return option.value === 'draft'
  })
}

function withBeforeDuplicateHook(field: Field, hook: FieldHook): Field {
  const fieldWithHooks = field as Field & {
    hooks?: {
      beforeDuplicate?: FieldHook[]
    }
  }

  if (fieldWithHooks.hooks?.beforeDuplicate?.length) {
    return field
  }

  return {
    ...field,
    hooks: {
      ...fieldWithHooks.hooks,
      beforeDuplicate: [hook],
    },
  } as Field
}

function duplicateHookForField(field: Field, path: string, titlePath?: string) {
  if (titlePath && path === titlePath) {
    return duplicateTitleHook
  }

  if (
    (path === 'displayStatus' || path === 'status') &&
    hasDraftOption(field)
  ) {
    return duplicateStatusHook
  }

  if (path === 'publishedAt' && field.type === 'date') {
    return duplicatePublishedAtHook
  }

  return undefined
}

function applyDuplicateDefaultsToFields(
  fields: Field[],
  titlePath?: string,
  parentPath = '',
): Field[] {
  return fields.map((field) => {
    if (field.type === 'tabs') {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: applyDuplicateDefaultsToFields(
            tab.fields,
            titlePath,
            'name' in tab ? `${parentPath}${tab.name}.` : parentPath,
          ),
        })),
      }
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      return {
        ...field,
        fields: applyDuplicateDefaultsToFields(field.fields, titlePath, parentPath),
      }
    }

    if (!('name' in field) || typeof field.name !== 'string') {
      return field
    }

    const path = `${parentPath}${field.name}`
    const duplicateHook = duplicateHookForField(field, path, titlePath)
    const fieldWithHook = duplicateHook
      ? withBeforeDuplicateHook(field, duplicateHook)
      : field

    if ('fields' in fieldWithHook && Array.isArray(fieldWithHook.fields)) {
      return {
        ...fieldWithHook,
        fields: applyDuplicateDefaultsToFields(
          fieldWithHook.fields,
          titlePath,
          `${path}.`,
        ),
      } as Field
    }

    return fieldWithHook
  })
}

export function applyAdminDuplicateDefaults(collections: CollectionConfig[]) {
  return collections.map((collection) => ({
    ...collection,
    fields: applyDuplicateDefaultsToFields(
      collection.fields,
      collection.admin?.useAsTitle,
    ),
  }))
}
