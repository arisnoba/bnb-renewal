import assert from 'node:assert/strict'
import test from 'node:test'

import configPromise from '../../payload.config'

const expectedLeadingGroups = [
  '컬렉션(삭제예정)',
  '메인 설정',
  '회사정보',
  '교육',
  '캐스팅/오디션',
]

test('payload admin collection groups keep the requested leading order', async () => {
  const config = await configPromise
  const groupOrder: string[] = []

  for (const collection of config.collections) {
    const group = collection.admin?.group

    if (typeof group === 'string' && !groupOrder.includes(group)) {
      groupOrder.push(group)
    }
  }

  assert.deepEqual(groupOrder.slice(0, expectedLeadingGroups.length), expectedLeadingGroups)
})
