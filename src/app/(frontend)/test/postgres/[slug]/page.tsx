import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import {
  getPostgresRows,
  getPostgresTestCollection,
  postgresTestCollections,
} from '@/lib/postgresTest'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const collection = getPostgresTestCollection(slug)

  return {
    title: collection ? `${collection.label} Postgres 테스트` : 'Postgres 테스트',
  }
}

export default async function PostgresCollectionTestPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const collection = getPostgresTestCollection(slug)

  if (!collection) {
    notFound()
  }

  const rowsResult = await getRows(collection)
  const rows = rowsResult.ok ? rowsResult.rows : []

  return (
    <main className="pt-24 pb-24">
      <section className="container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Postgres Collection Test
            </p>
            <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">
              {collection.label}
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              {collection.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/test/postgres">Postgres 목록</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/test">테스트 목록</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mt-10">
        <div className="rounded-lg border border-border bg-card p-5">
          <dl className="grid gap-4 text-sm md:grid-cols-4">
            <InfoItem label="컬렉션" value={collection.slug} />
            <InfoItem label="테이블" value={collection.table} />
            <InfoItem label="경로" value={collection.href} />
            <InfoItem label="표시 건수" value={`${rows.length}건`} />
          </dl>
          {rowsResult.ok ? null : (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {rowsResult.message}
            </p>
          )}
        </div>
      </section>

      <section className="container mt-8">
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[72px_minmax(180px,1.4fr)_repeat(3,minmax(140px,1fr))] gap-0 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <div>Image</div>
            <div>Title</div>
            <div>Meta 1</div>
            <div>Meta 2</div>
            <div>Meta 3</div>
          </div>
          <div className="divide-y divide-border">
            {rows.length > 0 ? (
              rows.map((row) => (
                <article
                  className="grid grid-cols-[72px_minmax(180px,1.4fr)_repeat(3,minmax(140px,1fr))] items-center gap-0 px-4 py-3 text-sm"
                  key={`${row.id}-${row.slug}`}
                >
                  <div>
                    {row.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="h-12 w-12 rounded-md border border-border object-cover"
                        loading="lazy"
                        src={row.imagePath}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                        없음
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pr-4">
                    <div className="truncate font-medium">{row.title || '(제목 없음)'}</div>
                    <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {row.slug || row.id}
                    </div>
                  </div>
                  <MetaCell value={row.meta1} />
                  <MetaCell value={row.meta2} />
                  <MetaCell value={row.meta3} />
                </article>
              ))
            ) : (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                표시할 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export function generateStaticParams() {
  return postgresTestCollections.map((collection) => ({
    slug: collection.slug,
  }))
}

async function getRows(collection: (typeof postgresTestCollections)[number]) {
  try {
    return {
      ok: true as const,
      rows: await getPostgresRows(collection),
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : String(error),
      ok: false as const,
    }
  }
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-all font-medium">{value}</dd>
    </div>
  )
}

function MetaCell({ value }: { value: string }) {
  return (
    <div className="min-w-0 pr-4 text-muted-foreground">
      <span className="line-clamp-2 break-words">{value || '-'}</span>
    </div>
  )
}
