import Link from 'next/link'

import { getMariaDbCounts, mariaDbTestCollections } from '@/lib/mariaDbTest'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function MariaDbTestIndexPage() {
  const counts = await getMariaDbCounts()

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">MariaDB Work DB</span>
        <h1>MariaDB 기준 리스트 검수</h1>
        <p>
          로컬 Docker MariaDB의 <code>bnb_legacy_work</code> 테이블을 직접 조회하는
          임시 검수 메뉴입니다. 최종 Neon 업로드 전 기준 데이터 확인용입니다.
        </p>
        <div className="test-summary">
          <Link className="filter-pill" href="/test">
            테스트 홈
          </Link>
          <span>work table {mariaDbTestCollections.length}개</span>
          <span>source: legacy-mariadb</span>
        </div>
      </section>

      <section className="test-menu-grid" aria-label="MariaDB 테스트 메뉴">
        {mariaDbTestCollections.map((collection) => (
          <Link className="surface test-menu-button" href={collection.href} key={collection.slug}>
            <strong>{collection.label}</strong>
            <span>{collection.description}</span>
            <code>
              {collection.table} · {counts[collection.slug] ?? 0}건
            </code>
          </Link>
        ))}
      </section>
    </main>
  )
}
