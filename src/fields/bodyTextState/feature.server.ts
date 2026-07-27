import { createServerFeature } from '@payloadcms/richtext-lexical'

import type { TextStateStyleConfig } from '../bodyTextStateConfig'

export type BodyTextStateFeatureProps = {
  state: TextStateStyleConfig
}

export const BodyTextStateFeature = createServerFeature<
  BodyTextStateFeatureProps,
  BodyTextStateFeatureProps,
  BodyTextStateFeatureProps
>({
  feature: ({ props }) => ({
    ClientFeature: '@/fields/bodyTextState/feature.client#BodyTextStateFeatureClient',
    clientFeatureProps: props,
  }),
  key: 'bodyTextState',
})
