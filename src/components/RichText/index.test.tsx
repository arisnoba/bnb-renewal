import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import RichText from './index'

const linkedBody = {
  root: {
    children: [
      {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '관련 기사',
                type: 'text',
                version: 1,
              },
            ],
            direction: null,
            fields: {
              linkType: 'custom',
              newTab: false,
              url: 'https://example.com/article',
            },
            format: '',
            id: 'link-id',
            indent: 0,
            type: 'link',
            version: 3,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as DefaultTypedEditorState

test('RichText keeps links in the same tab by default', () => {
  const html = renderToStaticMarkup(<RichText data={linkedBody} />)

  assert.match(html, /href="https:\/\/example\.com\/article"/)
  assert.doesNotMatch(html, /target="_blank"/)
  assert.doesNotMatch(html, /rel="noopener noreferrer"/)
})

test('RichText can force links to open in a new tab', () => {
  const html = renderToStaticMarkup(<RichText data={linkedBody} linksOpenInNewTab />)

  assert.match(html, /href="https:\/\/example\.com\/article"/)
  assert.match(html, /target="_blank"/)
  assert.match(html, /rel="noopener noreferrer"/)
})
