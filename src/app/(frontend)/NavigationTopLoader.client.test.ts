import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('./NavigationTopLoader.client.tsx', import.meta.url),
  'utf8',
)

test('상단 로더는 경로에 센터가 없는 서브도메인에서도 현재 센터 색상을 사용한다', () => {
  assert.match(source, /import \{ useCurrentCenter \} from '\.\/CenterDomainContext\.client'/)
  assert.match(source, /const center = useCurrentCenter\(\)/)
  assert.match(source, /const color = centerTopLoaderColors\[center\]/)
  assert.doesNotMatch(source, /usePathname/)
})
