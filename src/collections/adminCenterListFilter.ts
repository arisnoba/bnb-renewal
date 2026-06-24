import type { CollectionConfig, Field } from 'payload'

import {
  adminCenterListFilterComponentPath,
  centerListFilterFieldName,
} from '../components/payload/AdminCenterListFilter.utils'

function hasCenterListFilterField(fields: Field[]) {
  return Boolean(centerListFilterFieldName(fields))
}

export function applyAdminCenterListFilter(collections: CollectionConfig[]) {
  return collections.map((collection) => {
    if (!hasCenterListFilterField(collection.fields)) {
      return collection
    }

    const components = collection.admin?.components ?? {}

    return {
      ...collection,
      admin: {
        ...collection.admin,
        components: {
          ...components,
          beforeListTable: [
            adminCenterListFilterComponentPath,
            ...(components.beforeListTable ?? []),
          ],
        },
      },
    }
  })
}
