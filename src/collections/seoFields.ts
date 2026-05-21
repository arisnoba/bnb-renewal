import { MetaTitleField } from '@payloadcms/plugin-seo/fields'

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
