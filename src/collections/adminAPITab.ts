import type { CollectionConfig, DocumentTabCondition, EditConfig, GlobalConfig } from 'payload'

import { isMasterAdminUser } from './shared'

export const canViewAdminAPITab: DocumentTabCondition = ({ req }) =>
  isMasterAdminUser(req.user)

export function applyMasterAdminAPITab(collections: CollectionConfig[]) {
  return collections.map((collection): CollectionConfig => {
    const components = collection.admin?.components ?? {}
    const views = components.views ?? {}
    const edit = views.edit ?? {}

    if ('root' in edit && edit.root) {
      return collection
    }

    const api = edit.api ?? {}
    const editWithAPITab = {
      ...edit,
      api: {
        ...api,
        tab: {
          ...api.tab,
          condition: canViewAdminAPITab,
        },
      },
    } as EditConfig

    return {
      ...collection,
      admin: {
        ...collection.admin,
        components: {
          ...components,
          views: {
            ...views,
            edit: editWithAPITab,
          },
        },
      },
    }
  })
}

export function applyGlobalMasterAdminAPITab(globals: GlobalConfig[]) {
  return globals.map((global): GlobalConfig => {
    const components = global.admin?.components ?? {}
    const views = components.views ?? {}
    const edit = views.edit ?? {}

    if ('root' in edit && edit.root) {
      return global
    }

    const api = edit.api ?? {}
    const editWithAPITab = {
      ...edit,
      api: {
        ...api,
        tab: {
          ...api.tab,
          condition: canViewAdminAPITab,
        },
      },
    } as EditConfig

    return {
      ...global,
      admin: {
        ...global.admin,
        components: {
          ...components,
          views: {
            ...views,
            edit: editWithAPITab,
          },
        },
      },
    }
  })
}
