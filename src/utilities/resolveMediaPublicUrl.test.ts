import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveMediaPublicUrl } from './resolveMediaPublicUrl'

const r2PublicBaseUrl = 'https://cdn.example.com'

test('resolves local media API URLs through R2 when the public base is configured', () => {
  assert.equal(
    resolveMediaPublicUrl({
      filename: 'image.jpg',
      isProduction: false,
      prefix: 'media/screen-appearances/body-images/123',
      publicBaseUrl: r2PublicBaseUrl,
      value: '/api/media/file/image.jpg',
    }),
    'https://cdn.example.com/media/screen-appearances/body-images/123/image.jpg',
  )
})

test('keeps local media API URLs unchanged outside production without the public base', () => {
  assert.equal(
    resolveMediaPublicUrl({
      filename: 'image.jpg',
      isProduction: false,
      prefix: 'media/screen-appearances/body-images/123',
      value: '/api/media/file/image.jpg',
    }),
    '/api/media/file/image.jpg',
  )
})

test('resolves production media API URLs with document prefix and filename', () => {
  assert.equal(
    resolveMediaPublicUrl({
      filename: 'image.jpg',
      isProduction: true,
      prefix: 'media/screen-appearances/body-images/123',
      publicBaseUrl: r2PublicBaseUrl,
      value: '/api/media/file/legacy-source-name.jpg',
    }),
    'https://cdn.example.com/media/screen-appearances/body-images/123/image.jpg',
  )
})

test('resolves absolute production media API URLs with document prefix and filename', () => {
  assert.equal(
    resolveMediaPublicUrl({
      filename: 'image.jpg',
      isProduction: true,
      prefix: 'media/screen-appearances/body-images/123',
      publicBaseUrl: r2PublicBaseUrl,
      value: 'https://www.example.com/api/media/file/legacy-source-name.jpg',
    }),
    'https://cdn.example.com/media/screen-appearances/body-images/123/image.jpg',
  )
})

test('uses media API prefix query when the document prefix is missing', () => {
  assert.equal(
    resolveMediaPublicUrl({
      filename: 'image.jpg',
      isProduction: true,
      publicBaseUrl: r2PublicBaseUrl,
      value: '/api/media/file/image.jpg?prefix=media/direct-castings/body-images',
    }),
    'https://cdn.example.com/media/direct-castings/body-images/image.jpg',
  )
})

test('resolves stored media paths directly as R2 object keys in production', () => {
  assert.equal(
    resolveMediaPublicUrl({
      isProduction: true,
      publicBaseUrl: r2PublicBaseUrl,
      value: '/media/casting-appearances/images/285/casting-appearance-image-285-large.jpg',
    }),
    'https://cdn.example.com/media/casting-appearances/images/285/casting-appearance-image-285-large.jpg',
  )
})

test('preserves external URLs', () => {
  assert.equal(
    resolveMediaPublicUrl({
      isProduction: true,
      publicBaseUrl: r2PublicBaseUrl,
      value: 'https://assets.example.com/image.jpg',
    }),
    'https://assets.example.com/image.jpg',
  )
})
