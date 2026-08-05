import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./CurriculumSearchForm.client.tsx', import.meta.url), 'utf8')

test('curriculum search native select uses a dark Windows popup palette', () => {
  assert.match(source, /<select[\s\S]*?\[color-scheme:dark\][\s\S]*?>/)
  assert.equal(source.match(/<option className="bg-neutral-950 text-white"/g)?.length, 2)
})
