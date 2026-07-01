import type { CollectionConfig, Field } from 'payload'

const hiddenListAdmin = {
  disableGroupBy: true,
  disableListColumn: true,
  disableListFilter: true,
} as const

const hiddenListFieldTypes = new Set(['array', 'richText', 'textarea', 'upload'])
const legacyMetricFieldNames = new Set(['reviewCount', 'viewCount'])

const collectionHiddenFieldNames: Record<string, Set<string>> = {
  'main-banners': new Set(['broadcaster']),
}

type OptimizeContext = {
  collectionSlug: string
  defaultColumns: Set<string>
  inSeoTab?: boolean
}

function fieldName(field: Field) {
  return 'name' in field && typeof field.name === 'string' ? field.name : undefined
}

function adminRecord(field: Field) {
  return field.admin as Record<string, unknown> | undefined
}

function hideFromList(field: Field): Field {
  const fieldWithAdmin = field as Field & {
    admin?: Record<string, unknown>
  }

  return {
    ...field,
    admin: {
      ...fieldWithAdmin.admin,
      ...hiddenListAdmin,
    },
  } as Field
}

function shouldHideFromList(field: Field, context: OptimizeContext) {
  const name = fieldName(field)
  const isDefaultColumn = Boolean(name && context.defaultColumns.has(name))

  if (context.inSeoTab) {
    return true
  }

  if (field.type === 'ui' && !isDefaultColumn) {
    return true
  }

  if (name && collectionHiddenFieldNames[context.collectionSlug]?.has(name)) {
    return true
  }

  if (name && legacyMetricFieldNames.has(name)) {
    return true
  }

  if (adminRecord(field)?.hidden === true && !isDefaultColumn) {
    return true
  }

  return hiddenListFieldTypes.has(field.type)
}

function optimizeField(field: Field, context: OptimizeContext): Field {
  if (field.type === 'tabs') {
    return {
      ...field,
      tabs: field.tabs.map((tab) => ({
        ...tab,
        fields: optimizeFields(tab.fields, {
          ...context,
          inSeoTab:
            context.inSeoTab ||
            ('name' in tab && tab.name === 'meta') ||
            tab.label === 'SEO',
        }),
      })),
    }
  }

  const fieldWithChildren =
    'fields' in field && Array.isArray(field.fields)
      ? ({
          ...field,
          fields: optimizeFields(field.fields, context),
        } as Field)
      : field

  return shouldHideFromList(fieldWithChildren, context)
    ? hideFromList(fieldWithChildren)
    : fieldWithChildren
}

function optimizeFields(fields: Field[], context: OptimizeContext) {
  return fields.map((field) => optimizeField(field, context))
}

function collectFieldsByPath(fields: Field[], prefix = '', output = new Map<string, Field>()) {
  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        collectFieldsByPath(tab.fields, prefix, output)
      }

      continue
    }

    const name = fieldName(field)

    if (name) {
      output.set(`${prefix}${name}`, field)
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      collectFieldsByPath(field.fields, name ? `${prefix}${name}.` : prefix, output)
    }
  }

  return output
}

function listDefaultColumns(fields: Field[], defaultColumns?: string[]) {
  if (!defaultColumns) {
    return defaultColumns
  }

  const fieldsByPath = collectFieldsByPath(fields)

  return defaultColumns.filter((column) => {
    const field = fieldsByPath.get(column)

    return !field || adminRecord(field)?.disableListColumn !== true
  })
}

export function applyAdminListSelectOptimization(collections: CollectionConfig[]) {
  return collections.map((collection) => {
    const defaultColumns = new Set(collection.admin?.defaultColumns ?? [])
    const fields = optimizeFields(collection.fields, {
      collectionSlug: collection.slug,
      defaultColumns,
    })

    return {
      ...collection,
      admin: {
        ...collection.admin,
        defaultColumns: listDefaultColumns(fields, collection.admin?.defaultColumns),
        enableListViewSelectAPI: true,
      },
      fields,
    }
  })
}
