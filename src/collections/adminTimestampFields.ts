import type { CollectionConfig, Field } from 'payload'

function createCreatedAtDateOnlyField(): Field {
  return {
    name: 'createdAt',
    type: 'date',
    index: true,
    label: '등록일',
    admin: {
      date: {
        displayFormat: 'yyyy-MM-dd',
        pickerAppearance: 'dayOnly',
      },
      disableBulkEdit: true,
      hidden: true,
    },
  }
}

function fieldHasName(fields: Field[], name: string): boolean {
  return fields.some((field) => {
    if ('name' in field && field.name === name) {
      return true
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      return fieldHasName(field.fields, name)
    }

    if (field.type === 'tabs') {
      return field.tabs.some((tab) => fieldHasName(tab.fields, name))
    }

    return false
  })
}

export function applyAdminTimestampFields(collections: CollectionConfig[]) {
  return collections.map((collection) => {
    if (collection.timestamps === false || fieldHasName(collection.fields, 'createdAt')) {
      return collection
    }

    return {
      ...collection,
      fields: [...collection.fields, createCreatedAtDateOnlyField()],
    }
  })
}
