import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { getPostgresCounts, postgresTestCollections } from '@/lib/postgresTest'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Postgres 테스트',
}

export default async function PostgresTestPage() {
  const countsResult = await getCounts()

  return (
    <main className="pt-24 pb-24">
      <section className="container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Postgres Test
            </p>
            <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">
              Postgres 테스트
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              마이그레이션된 Payload 컬렉션의 최근 데이터와 이미지 경로를 확인합니다.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/test">테스트 목록</Link>
          </Button>
        </div>
      </section>

      <section className="container mt-10">
        {countsResult.ok ? null : (
          <p className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {countsResult.message}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {postgresTestCollections.map((collection) => (
            <Button
              asChild
              className="h-auto justify-start rounded-lg border-border bg-card px-5 py-4 text-left text-card-foreground shadow-none hover:bg-accent"
              key={collection.href}
              variant="outline"
            >
              <Link href={collection.href}>
                <span className="grid gap-1">
                  <span className="text-base font-semibold">{collection.label}</span>
                  <span className="whitespace-normal text-sm font-normal leading-6 text-muted-foreground">
                    {collection.description}
                  </span>
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {collection.href}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {countsResult.ok ? `${countsResult.counts[collection.slug] ?? 0}건` : '건수 확인 실패'}
                  </span>
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </section>
    </main>
  )
}

async function getCounts() {
  try {
    return {
      counts: await getPostgresCounts(),
      ok: true as const,
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : String(error),
      ok: false as const,
    }
  }
}
