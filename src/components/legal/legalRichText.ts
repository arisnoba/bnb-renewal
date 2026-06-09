import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import type { LegalDocument } from './legalDocuments'

type LexicalTextNode = {
  detail: number
  format: number
  mode: 'normal'
  style: string
  text: string
  type: 'text'
  version: number
}

type LexicalElementNode = {
  children: LexicalTextNode[]
  direction: 'ltr' | 'rtl' | null
  format: ''
  indent: number
  tag?: 'h2'
  type: 'heading' | 'paragraph'
  version: number
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

type LexicalRootChildNode = LexicalElementNode | LexicalListNode

function textNode(text: string): LexicalTextNode {
  return {
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    type: 'text',
    version: 1,
  }
}

function listItemNode(text: string, value: number): LexicalListItemNode {
  return {
    children: [textNode(text)],
    direction: null,
    format: '',
    indent: 0,
    type: 'listitem',
    value,
    version: 1,
  }
}

function listNode(items: string[]): LexicalListNode {
  return {
    children: items.map((item, index) => listItemNode(item, index + 1)),
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

function elementNode(type: LexicalElementNode['type'], text: string): LexicalElementNode {
  return {
    children: text ? [textNode(text)] : [],
    direction: null,
    format: '',
    indent: 0,
    ...(type === 'heading' ? { tag: 'h2' as const } : {}),
    type,
    version: 1,
  }
}

function tableRowToText(headers: string[], row: string[]) {
  return row
    .map((cell, index) => {
      const header = headers[index]
      return header ? `${header}: ${cell}` : cell
    })
    .join(' / ')
}

export function legalDocumentToRichText(document: LegalDocument): DefaultTypedEditorState {
  const children: LexicalRootChildNode[] = []

  for (const section of document.sections) {
    children.push(elementNode('heading', section.title))

    for (const paragraph of section.body ?? []) {
      children.push(elementNode('paragraph', paragraph))
    }

    if (section.list?.length) {
      children.push(listNode(section.list))
    }

    if (section.table) {
      children.push(
        listNode(section.table.rows.map((row) => tableRowToText(section.table!.headers, row))),
      )
    }
  }

  return {
    root: {
      children,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as DefaultTypedEditorState
}
