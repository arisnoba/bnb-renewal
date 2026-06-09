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

type LexicalParagraphNode = {
  children?: LexicalTextNode[]
  direction?: 'ltr' | 'rtl' | null
  format?: ''
  indent?: number
  type: 'paragraph'
  version?: number
}

type LexicalListItemNode = {
  children: LexicalTextNode[]
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

function paragraphText(node: LexicalParagraphNode) {
  return (node.children ?? [])
    .filter((child) => child.type === 'text')
    .map((child) => child.text)
    .join('')
}

function textNode(text: string, source?: LexicalTextNode): LexicalTextNode {
  return {
    detail: source?.detail ?? 0,
    format: source?.format ?? 0,
    mode: source?.mode ?? 'normal',
    style: source?.style ?? '',
    text,
    type: 'text',
    version: source?.version ?? 1,
  }
}

function listNode(items: LexicalTextNode[]): LexicalListNode {
  return {
    children: items.map((item, index) => ({
      children: [item],
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

function normalizeBulletParagraphs(body: DefaultTypedEditorState) {
  const children = body.root.children as LexicalNode[]
  const nextChildren: LexicalNode[] = []
  let currentItems: LexicalTextNode[] = []

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
    const text = paragraphText(paragraph)
    const match = text.match(/^-\s+(.+)$/)

    if (!match) {
      flushItems()
      nextChildren.push(child)
      continue
    }

    currentItems.push(textNode(match[1], paragraph.children?.[0]))
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
