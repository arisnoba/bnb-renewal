import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import {
  RichText as ConvertRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import type { CSSProperties } from 'react'
import { bodyTextStateConfig } from '@/fields/bodyTextStateConfig'
import { cn } from '@/utilities/ui'

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
  linksOpenInNewTab?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const {
    className,
    enableProse = true,
    enableGutter = true,
    linksOpenInNewTab = false,
    ...rest
  } = props

  return (
    <ConvertRichText
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert': enableProse,
        },
        className,
      )}
      converters={linksOpenInNewTab ? linksOpenInNewTabConverters : textStateConverters}
      {...rest}
    />
  )
}

function hyphenToCamelCase(property: string) {
  return property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function textStateStyles(nodeState: Record<string, string> | undefined) {
  if (!nodeState) {
    return undefined
  }

  const styles: Record<string, string> = {}

  for (const [stateKey, stateValue] of Object.entries(nodeState)) {
    const css = bodyTextStateConfig[stateKey]?.[stateValue]?.css

    if (!css) {
      continue
    }

    for (const [property, value] of Object.entries(css)) {
      styles[hyphenToCamelCase(property)] = value
    }
  }

  return Object.keys(styles).length > 0 ? (styles as CSSProperties) : undefined
}

const textStateConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  text: (args) => {
    const { node } = args
    const defaultTextConverter = defaultConverters.text
    const text =
      typeof defaultTextConverter === 'function' ? defaultTextConverter(args) : node.text
    const styles = textStateStyles(
      (node as typeof node & { $?: Record<string, string> }).$,
    )

    return styles ? <span style={styles}>{text}</span> : text
  },
})

const linksOpenInNewTabConverters: JSXConvertersFunction = (args) => ({
  ...textStateConverters(args),
  autolink: ({ node, nodesToJSX }) => (
    <a href={node.fields.url} rel="noopener noreferrer" target="_blank">
      {nodesToJSX({ nodes: node.children })}
    </a>
  ),
  link: ({ node, nodesToJSX }) => {
    const href = node.fields.linkType === 'custom' ? (node.fields.url ?? '') : '#'

    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {nodesToJSX({ nodes: node.children })}
      </a>
    )
  },
})
