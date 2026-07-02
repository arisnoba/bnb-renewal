import type { CollectionConfig, GlobalConfig } from 'payload'

export const adminSaveLoadingOverlayComponentPath =
  '@/components/payload/AdminSaveLoadingOverlay#AdminSaveLoadingOverlay'

export function applyAdminSaveLoadingOverlay(collections: CollectionConfig[]) {
  return collections.map((collection) => {
    const components = collection.admin?.components ?? {}
    const edit = components.edit ?? {}

    return {
      ...collection,
      admin: {
        ...collection.admin,
        components: {
          ...components,
          edit: {
            ...edit,
            beforeDocumentControls: [
              adminSaveLoadingOverlayComponentPath,
              ...(edit.beforeDocumentControls ?? []),
            ],
          },
        },
      },
    }
  })
}

export function applyGlobalAdminSaveLoadingOverlay(globals: GlobalConfig[]) {
  return globals.map((global) => {
    const components = global.admin?.components ?? {}
    const elements = components.elements ?? {}

    return {
      ...global,
      admin: {
        ...global.admin,
        components: {
          ...components,
          elements: {
            ...elements,
            beforeDocumentControls: [
              adminSaveLoadingOverlayComponentPath,
              ...(elements.beforeDocumentControls ?? []),
            ],
          },
        },
      },
    }
  })
}
