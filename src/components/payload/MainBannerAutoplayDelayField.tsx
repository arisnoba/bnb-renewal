'use client'

import type { NumberFieldClientComponent } from 'payload'

import { NumberField, useField } from '@payloadcms/ui'

function autoplayPathFromDelayPath(path?: string) {
  return path?.replace(/BannerAutoplayDelay$/, 'BannerAutoplay') ?? ''
}

export const MainBannerAutoplayDelayField: NumberFieldClientComponent = (props) => {
  const autoplayPath = autoplayPathFromDelayPath(props.path)
  const { value: autoplayValue } = useField<boolean>({
    path: autoplayPath,
  })
  const readOnly = autoplayValue === false

  return (
    <NumberField
      {...props}
      readOnly={readOnly}
      field={{
        ...props.field,
      }}
    />
  )
}
