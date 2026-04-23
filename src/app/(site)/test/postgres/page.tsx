import Link from 'next/link'

import { getPostgresCounts, postgresTestCollections } from '@/lib/postgresTest'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function PostgresTestIndexPage() {
  const counts = await getPostgresCounts()

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">PostgreSQL / Payload</span>
        <h1>PostgreSQL 기준 리스트 검수</h1>
        <p>
          로컬 Docker PostgreSQL과 Payload 컬렉션을 직접 조회하는 임시 검수 메뉴입니다.
          MariaDB work table 이관 결과를 확인하는 용도입니다.
        </p>
        <div className="test-summary">
          <Link className="filter-pill" href="/test">
            테스트 홈
          </Link>
          <Link className="filter-pill" href="/test/mariadb">
            MariaDB 기준 검수
          </Link>
          <span>payload collection {postgresTestCollections.length}개</span>
          <span>source: local-postgres</span>
        </div>
      </section>

      <section className="test-menu-grid" aria-label="PostgreSQL 테스트 메뉴">
        {postgresTestCollections.map((collection) => (
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
