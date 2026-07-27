'use client'

import type { ToolbarGroup } from '@payloadcms/richtext-lexical'
import {
  createClientFeature,
  TextStateFeatureClient,
} from '@payloadcms/richtext-lexical/client'

import type { BodyTextStateFeatureProps } from './feature.server'

const FontSizeToolbarLabel = () => (
  <span aria-hidden="true" style={{ fontSize: 12, fontWeight: 600 }}>
    크기
  </span>
)

const TextColorToolbarLabel = () => (
  <span aria-hidden="true" style={{ fontSize: 12, fontWeight: 600 }}>
    색상
  </span>
)

function splitTextStateGroups(
  groups: ToolbarGroup[] | undefined,
  state: BodyTextStateFeatureProps['state'],
) {
  if (!groups) {
    return []
  }

  const textStateGroup = groups.find(
    (group) => group.key === 'textState' && group.type === 'dropdown',
  )

  if (!textStateGroup || textStateGroup.type !== 'dropdown') {
    return groups
  }

  const fontSizeKeys = new Set(Object.keys(state.fontSize ?? {}))
  const colorKeys = new Set(Object.keys(state.color ?? {}))
  const remainingGroups = groups.filter((group) => group !== textStateGroup)

  return [
    ...remainingGroups,
    {
      ...textStateGroup,
      ChildComponent: FontSizeToolbarLabel,
      items: textStateGroup.items.filter((item) => fontSizeKeys.has(item.key)),
      key: 'fontSizeState',
      order: 30,
    },
    {
      ...textStateGroup,
      ChildComponent: TextColorToolbarLabel,
      items: textStateGroup.items.filter((item) => colorKeys.has(item.key)),
      key: 'textColorState',
      order: 31,
    },
  ] satisfies ToolbarGroup[]
}

export const BodyTextStateFeatureClient = createClientFeature<BodyTextStateFeatureProps>(
  (args) => {
    const officialFeatureProvider = TextStateFeatureClient(args.props)
    const officialFeature =
      typeof officialFeatureProvider.feature === 'function'
        ? officialFeatureProvider.feature(args)
        : officialFeatureProvider.feature

    return {
      ...officialFeature,
      toolbarFixed: {
        groups: splitTextStateGroups(officialFeature.toolbarFixed?.groups, args.props.state),
      },
      toolbarInline: {
        groups: splitTextStateGroups(officialFeature.toolbarInline?.groups, args.props.state),
      },
    }
  },
)
