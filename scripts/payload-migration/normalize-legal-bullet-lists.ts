import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type LexicalTextNode = {
  detail: number
  format: number
  mode: 'normal'
  style: string
  text: string
  type: 'text'
  version: number
}

type LexicalInlineNode = LexicalTextNode | Record<string, unknown>

type LexicalParagraphNode = {
  children?: LexicalInlineNode[]
  direction?: 'ltr' | 'rtl' | null
  format?: ''
  indent?: number
  type: 'paragraph'
  version?: number
}

type LexicalListItemNode = {
  children: LexicalInlineNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  type: 'listitem'
  value: number
  version: number
}

type LexicalListNode = {
  children: LexicalListItemNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  listType: 'bullet'
  start: number
  tag: 'ul'
  type: 'list'
  version: number
}

type LexicalNode = LexicalParagraphNode | LexicalListNode | Record<string, unknown>

function listNode(items: LexicalInlineNode[][]): LexicalListNode {
  return {
    children: items.map((item, index) => ({
      children: item,
      direction: null,
      format: '',
      indent: 0,
      type: 'listitem',
      value: index + 1,
      version: 1,
    })),
    direction: null,
    format: '',
    indent: 0,
    listType: 'bullet',
    start: 1,
    tag: 'ul',
    type: 'list',
    version: 1,
  }
}

function stripBulletMarker(children: LexicalInlineNode[]) {
  let stripped = false

  return children
    .map((child) => {
      if (stripped || child.type !== 'text' || typeof child.text !== 'string') {
        return child
      }

      const nextText = child.text.replace(/^-\s+/, '')
      if (nextText === child.text) {
        return child
      }

      stripped = true
      return {
        ...child,
        text: nextText,
      }
    })
    .filter((child) => {
      return !(child.type === 'text' && typeof child.text === 'string' && child.text.length === 0)
    })
}

function normalizeBulletParagraphs(body: DefaultTypedEditorState) {
  const children = body.root.children as LexicalNode[]
  const nextChildren: LexicalNode[] = []
  let currentItems: LexicalInlineNode[][] = []

  const flushItems = () => {
    if (!currentItems.length) {
      return
    }

    nextChildren.push(listNode(currentItems))
    currentItems = []
  }

  for (const child of children) {
    if (child.type !== 'paragraph') {
      flushItems()
      nextChildren.push(child)
      continue
    }

    const paragraph = child as LexicalParagraphNode
    const paragraphChildren = paragraph.children ?? []
    const firstText = paragraphChildren.find((node) => node.type === 'text' && typeof node.text === 'string')
    const hasBulletMarker = typeof firstText?.text === 'string' && /^-\s+/.test(firstText.text)

    if (!hasBulletMarker) {
      flushItems()
      nextChildren.push(child)
      continue
    }

    currentItems.push(stripBulletMarker(paragraphChildren))
  }

  flushItems()

  return {
    changed: nextChildren.length !== children.length || nextChildren.some((child, index) => child !== children[index]),
    body: {
      ...body,
      root: {
        ...body.root,
        children: nextChildren,
      },
    },
  }
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  let checked = 0
  let updated = 0

  try {
    const result = await payload.find({
      collection: 'terms',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      pagination: false,
    })

    for (const doc of result.docs) {
      checked += 1

      const normalized = normalizeBulletParagraphs(doc.body)
      if (!normalized.changed) {
        continue
      }

      await payload.update({
        collection: 'terms',
        data: {
          body: normalized.body,
        },
        depth: 0,
        id: doc.id,
        overrideAccess: true,
      })
      updated += 1
    }

    console.log(JSON.stringify({ checked, updated }, null, 2))
  } finally {
    await payload.destroy()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
