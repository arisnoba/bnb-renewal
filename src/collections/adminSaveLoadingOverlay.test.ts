import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, GlobalConfig } from 'payload'

import {
  adminSaveLoadingOverlayComponentPath,
  applyAdminSaveLoadingOverlay,
  applyGlobalAdminSaveLoadingOverlay,
} from './adminSaveLoadingOverlay'

test('applyAdminSaveLoadingOverlay injects the save overlay into collection edit controls', () => {
  const [collection] = applyAdminSaveLoadingOverlay([
    {
      slug: 'example',
      admin: {
        components: {
          edit: {
            beforeDocumentControls: ['@/components/payload/Existing#Existing'],
          },
        },
      },
      fields: [],
    } satisfies CollectionConfig,
  ])

  assert.deepEqual(collection.admin?.components?.edit?.beforeDocumentControls, [
    adminSaveLoadingOverlayComponentPath,
    '@/components/payload/Existing#Existing',
  ])
})

test('applyGlobalAdminSaveLoadingOverlay injects the save overlay into global document controls', () => {
  const [global] = applyGlobalAdminSaveLoadingOverlay([
    {
      slug: 'example-global',
      admin: {
        components: {
          elements: {
            beforeDocumentControls: ['@/components/payload/Existing#Existing'],
          },
        },
      },
      fields: [],
    } satisfies GlobalConfig,
  ])

  assert.deepEqual(global.admin?.components?.elements?.beforeDocumentControls, [
    adminSaveLoadingOverlayComponentPath,
    '@/components/payload/Existing#Existing',
  ])
})
