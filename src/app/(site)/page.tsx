const publicRoutes = [
  '/',
  '/news',
  '/art',
  '/art/faculty',
  '/art/casting',
  '/art/contact',
  '/test',
  '/test/mariadb',
  '/test/teachers',
]

const nextSteps = [
  '환경변수를 `.env.local`로 복사하고 `DATABASE_URL`, `PAYLOAD_SECRET`를 채운다.',
  '로컬 Postgres가 없으면 `docker compose up -d`로 개발 DB를 띄운다.',
  '`npm run db:migrate`로 Payload 스키마 마이그레이션을 적용한다.',
  '`npm run payload:generate-types`로 컬렉션 타입을 다시 생성한다.',
  '`npm run legacy:db:import` 후 `npm run legacy:work:news`처럼 필요한 work table을 재생성한다.',
]

export default function HomePage() {
  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">Scaffold Ready</span>
        <h1>BNB Renewal</h1>
        <p>
          Next.js App Router, Payload CMS, Postgres 기준으로 초기 골격을 올렸습니다.
          현재 단계는 공개 사이트의 최소 라우트와 Payload 관리자, 그리고 C0 기준
          마이그레이션 준비 상태를 먼저 검증하는 목적입니다.
        </p>
        <div className="route-list">
          {publicRoutes.map((route) => (
            <span className="route-pill" key={route}>
              {route}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-3">
        <article className="surface card">
          <h3>관리자</h3>
          <p>
            Payload 관리자 경로는 <code>/admin</code>입니다. 첫 실행 시 사용자가 없으면
            관리자 생성 흐름으로 이동합니다.
          </p>
        </article>
        <article className="surface card">
          <h3>현재 컬렉션</h3>
          <p>
            <code>teachers</code>, <code>news</code>, <code>profiles</code>,{' '}
            <code>castings</code>, <code>agencies</code> 기준으로 C0 전환을 준비 중입니다.
          </p>
        </article>
        <article className="surface card">
          <h3>마이그레이션</h3>
          <p>
            레거시 MySQL dump 전체 직이관이 아니라, 센터별 MariaDB 원본을 복원한 뒤{' '}
            <code>bnb_legacy_work</code> 기준으로 통합 테이블을 검증합니다.
          </p>
        </article>
      </section>

      <section className="surface card" style={{ marginTop: 24 }}>
        <h3>다음 검증</h3>
        <ul>
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}
