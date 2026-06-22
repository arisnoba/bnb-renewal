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

test('partnership attachment link downloads without opening a new tab', () => {
  const html = renderToStaticMarkup(
    <TestInquirySummaryField
      clientField={{ admin: {}, name: 'summary' }}
      data={{
        attachmentFileName: 'proposal.pdf',
        attachmentUrl: 'https://cdn.example.com/inquiries/attachments/partnership/proposal.pdf',
        companyName: '배우앤배움',
        inquiryType: 'partnership',
      }}
      field={{ admin: {}, name: 'summary', type: 'ui' }}
      path="summary"
    />,
  )

  assert.match(html, /href="https:\/\/cdn\.example\.com\/inquiries\/attachments\/partnership\/proposal\.pdf"/)
  assert.match(html, /download=""/)
  assert.doesNotMatch(html, /target="_blank"/)
})
