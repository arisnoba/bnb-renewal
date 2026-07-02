import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import {
  RichText as ConvertRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
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
      converters={linksOpenInNewTab ? linksOpenInNewTabConverters : undefined}
      {...rest}
    />
  )
}

const linksOpenInNewTabConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
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
