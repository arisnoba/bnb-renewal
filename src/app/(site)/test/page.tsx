import Link from 'next/link'

import { testCollections } from '@/lib/testCollections'

export const dynamic = 'force-dynamic'

export default function TestIndexPage() {
  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">Front Test</span>
        <h1>리스트 출력 확인</h1>
        <p>
          마이그레이션 검수용 임시 메뉴입니다. 최종 Neon 업로드 전 확인은 MariaDB
          work DB 기준 메뉴를 사용합니다.
        </p>
        <div className="test-summary">
          <Link className="filter-pill" href="/test/mariadb">
            MariaDB 기준 검수
          </Link>
          <span>Payload/Neon 참고 메뉴 {testCollections.length}개</span>
        </div>
      </section>

      <section className="surface card" style={{ marginTop: 24 }}>
        <h3>검수 기준</h3>
        <p>
          <code>/test/mariadb</code>는 로컬 Docker MariaDB의{' '}
          <code>bnb_legacy_work</code>를 직접 조회합니다. 아래 Payload 메뉴는 현재
          앱 환경변수에 연결된 DB 상태를 보는 참고 화면입니다.
        </p>
      </section>

      <section className="test-menu-grid" aria-label="테스트 메뉴">
        {testCollections.map((collection) => (
          <Link className="surface test-menu-button" href={collection.href} key={collection.slug}>
            <strong>{collection.label}</strong>
            <span>{collection.description}</span>
            <code>{collection.slug}</code>
          </Link>
        ))}
      </section>
    </main>
  )
}
