import type { CollectionConfig, Field } from 'payload'

import {
  adminCenterListFilterComponentPath,
  centerListFilterFieldName,
} from '../components/payload/AdminCenterListFilter.utils'

function hasCenterListFilterField(fields: Field[]) {
  return Boolean(centerListFilterFieldName(fields))
}

const excludedCenterQuickFilterCollectionSlugs = new Set([
  'exam-passed-reviews',
  'exam-passed-videos',
  'exam-school-logos',
])

export function applyAdminCenterListFilter(collections: CollectionConfig[]) {
  return collections.map((collection) => {
    if (excludedCenterQuickFilterCollectionSlugs.has(collection.slug)) {
      return collection
    }

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
