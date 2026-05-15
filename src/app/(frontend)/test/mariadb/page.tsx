import type { Metadata } from 'next'
import Link from 'next/link'

import { getMariaDbCounts, mariaDbTestCollections } from '@/lib/mariaDbTest'

import { TestNavigation } from '../_components/TestNavigation'
import { testNavigationGroups } from '../_components/testNavigationData'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'MariaDB 테스트',
}

export default async function MariaDbTestPage() {
  const countsResult = await getCounts()

  return (
    <main className="pt-24 pb-24">
      <section className="container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              MariaDB Test
            </p>
            <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">
              MariaDB 테스트
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              레거시 MariaDB work table의 원본 정제 상태와 이미지 경로를 확인합니다.
            </p>
          </div>
          <Link
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            href="/test"
          >
            테스트 목록
          </Link>
        </div>
      </section>

      <section className="container mt-10">
        <TestNavigation groups={testNavigationGroups} />
      </section>

      <section className="container mt-10">
        {countsResult.ok ? null : (
          <p className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {countsResult.message}
          </p>
        )}
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[minmax(160px,1fr)_minmax(220px,1.5fr)_120px_minmax(160px,1fr)] gap-0 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <div>Table</div>
              <div>Description</div>
              <div>Count</div>
              <div>Path</div>
            </div>
            <div className="divide-y divide-border">
              {mariaDbTestCollections.map((collection) => (
                <Link
                  className="grid grid-cols-[minmax(160px,1fr)_minmax(220px,1.5fr)_120px_minmax(160px,1fr)] items-center gap-0 px-4 py-3 text-sm transition-colors hover:bg-accent"
                  href={collection.href}
                  key={collection.href}
                >
                  <div>
                    <div className="font-medium">{collection.label}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      {collection.table}
                    </div>
                  </div>
                  <div className="pr-4 text-muted-foreground">{collection.description}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {countsResult.ok ? `${countsResult.counts[collection.slug] ?? 0}건` : '실패'}
                  </div>
                  <div className="break-all font-mono text-xs text-muted-foreground">
                    {collection.href}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

async function getCounts() {
  try {
    return {
      counts: await getMariaDbCounts(),
      ok: true as const,
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : String(error),
      ok: false as const,
    }
  }
}
