import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldRedirectAfterInquirySave } from './inquirySaveResult'

test('inquiry save redirects only after a successful response', () => {
  assert.equal(shouldRedirectAfterInquirySave({ res: { ok: true } }), true)
  assert.equal(shouldRedirectAfterInquirySave({ res: { ok: false } }), false)
  assert.equal(shouldRedirectAfterInquirySave(undefined), false)
})
