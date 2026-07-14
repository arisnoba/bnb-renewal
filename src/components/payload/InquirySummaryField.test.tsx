import { strict as assert } from 'node:assert'
import test from 'node:test'

import { renderToStaticMarkup } from 'react-dom/server'
import type { ComponentType } from 'react'

import { InquirySummaryField } from './InquirySummaryField'

const TestInquirySummaryField = InquirySummaryField as unknown as ComponentType<{
  clientField: { admin: Record<string, never>; name: string }
  data: Record<string, unknown>
  field: { admin: Record<string, never>; name: string; type: 'ui' }
  path: string
}>

test('partnership attachment link uses the authenticated download route', () => {
  const html = renderToStaticMarkup(
    <TestInquirySummaryField
      clientField={{ admin: {}, name: 'summary' }}
      data={{
        attachmentFileName: 'proposal.pdf',
        attachmentObjectKey: 'inquiries/attachments/partnership/2026/07/proposal.pdf',
        companyName: '배우앤배움',
        id: 12,
        inquiryType: 'partnership',
      }}
      field={{ admin: {}, name: 'summary', type: 'ui' }}
      path="summary"
    />,
  )

  assert.match(html, /href="\/api\/inquiries\/12\/attachment"/)
  assert.match(html, /download=""/)
  assert.doesNotMatch(html, /target="_blank"/)
})
