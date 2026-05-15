import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  getMariaDbRows,
  getMariaDbTestCollection,
  mariaDbTestCollections,
  type MariaDbRowsOptions,
} from '@/lib/mariaDbTest'

import { TestNavigation } from '../../_components/TestNavigation'
import { testNavigationGroups } from '../../_components/testNavigationData'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams?: Promise<{
    center?: string
  }>
}

const centerOptions = [
  { label: '전체', value: 'all' },
  { label: '아트센터', value: 'art' },
  { label: '입시센터', value: 'exam' },
  { label: '하이틴센터', value: 'highteen' },
  { label: '키즈센터', value: 'kids' },
] satisfies Array<{ label: string; value: NonNullable<MariaDbRowsOptions['center']> }>

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const collection = getMariaDbTestCollection(slug)

  return {
    title: collection ? `${collection.label} MariaDB 테스트` : 'MariaDB 테스트',
  }
}

export default async function MariaDbCollectionTestPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { slug = '' } = await paramsPromise
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const collection = getMariaDbTestCollection(slug)

  if (!collection) {
    notFound()
  }

  const center = normalizeCenter(searchParams.center)
  const rowsResult = await getRows(collection, center)
  const rows = rowsResult.ok ? rowsResult.rows : []

  return (
    <main className="pt-24 pb-24">
      <section className="container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              MariaDB Collection Test
            </p>
            <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">
              {collection.label}
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              {collection.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              href="/test/mariadb"
            >
              MariaDB 목록
            </Link>
            <Link
              className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              href="/test"
            >
              테스트 목록
            </Link>
          </div>
        </div>
      </section>

      <section className="container mt-10">
        <TestNavigation groups={testNavigationGroups} />
      </section>

      <section className="container mt-10">
        <div className="rounded-lg border border-border bg-card p-5">
          <dl className="grid gap-4 text-sm md:grid-cols-4">
            <InfoItem label="컬렉션" value={collection.slug} />
            <InfoItem label="테이블" value={collection.table} />
            <InfoItem label="센터" value={center} />
            <InfoItem label="표시 건수" value={`${rows.length}건`} />
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {centerOptions.map((option) => (
              <Link
                className={
                  option.value === center
                    ? 'rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background'
                    : 'rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent'
                }
                href={
                  option.value === 'all'
                    ? collection.href
                    : `${collection.href}?center=${option.value}`
                }
                key={option.value}
              >
                {option.label}
              </Link>
            ))}
          </div>
          {rowsResult.ok ? null : (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {rowsResult.message}
            </p>
          )}
        </div>
      </section>

      <section className="container mt-8">
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[860px]">
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
                      {row.relatedFiles.length > 0 ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          관련 파일 {row.relatedFiles.length}건
                        </div>
                      ) : null}
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
        </div>
      </section>
    </main>
  )
}

export function generateStaticParams() {
  return mariaDbTestCollections.map((collection) => ({
    slug: collection.slug,
  }))
}

function normalizeCenter(center?: string): NonNullable<MariaDbRowsOptions['center']> {
  if (center === 'art' || center === 'exam' || center === 'highteen' || center === 'kids') {
    return center
  }

  return 'all'
}

async function getRows(
  collection: (typeof mariaDbTestCollections)[number],
  center: NonNullable<MariaDbRowsOptions['center']>,
) {
  try {
    return {
      ok: true as const,
      rows: await getMariaDbRows(collection, { center }),
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
