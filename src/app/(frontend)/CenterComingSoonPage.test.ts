import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./CenterComingSoonPage.tsx', import.meta.url), 'utf8')

test('center coming soon page explains the status without a system alert', () => {
  assert.match(source, /centerPreparationBadge/)
  assert.match(source, /centerPreparationTitle\(center\)/)
  assert.match(source, /다른 센터 보기/)
  assert.match(source, /href=\{primaryPublicHref\(\)\}/)
  assert.match(source, /href="tel:15779929"/)
  assert.doesNotMatch(source, /alert\(/)
})
