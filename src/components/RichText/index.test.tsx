import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { bodyTextStateConfig } from '@/fields/bodyTextStateConfig'

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

const styledBody = {
  root: {
    children: [
      {
        children: [
          {
            $: {
              color: 'text-red',
              fontSize: 'font-size-large',
            },
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: '강조 본문',
            type: 'text',
            version: 1,
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

test('RichText renders approved text size and color states with standard formatting', () => {
  const html = renderToStaticMarkup(<RichText data={styledBody} />)

  assert.match(html, /font-size:18px/)
  assert.match(html, /color:#B91C1C/)
  assert.match(html, /<strong>강조 본문<\/strong>/)
})

test('RichText text states expose all current center brand colors', () => {
  assert.deepEqual(
    Object.keys(bodyTextStateConfig.color).filter((key) => key.startsWith('brand-')),
    ['brand-art', 'brand-exam', 'brand-highteen', 'brand-kids', 'brand-avenue'],
  )
})

test('RichText default text color follows the current theme instead of forcing black', () => {
  assert.deepEqual(bodyTextStateConfig.color['text-default'], {
    css: { color: 'inherit' },
    label: '기본',
  })
  assert.equal(bodyTextStateConfig.color['text-black'], undefined)
})
