import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  getPostgresRows,
  getPostgresTestCollection,
  postgresTestCollections,
} from '@/lib/postgresTest'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function generateStaticParams() {
  return postgresTestCollections.map((collection) => ({ collection: collection.slug }))
}

export default async function PostgresCollectionTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>
  searchParams: Promise<{ center?: string | string[] }>
}) {
  const { collection: collectionSlug } = await params
  const resolvedSearchParams = await searchParams
  const collection = getPostgresTestCollection(collectionSlug)

  if (!collection) {
    notFound()
  }

  const center = normalizeCenterFilter(resolvedSearchParams.center)
  const rows = await getPostgresRows(collection, { center })

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">PostgreSQL / Payload</span>
        <h1>{collection.label}</h1>
        <p>{collection.description}</p>
        <div className="test-summary">
          <Link className="filter-pill" href="/test/postgres">
            PostgreSQL 메뉴
          </Link>
          <Link className="filter-pill" href="/test">
            테스트 홈
          </Link>
          <span>표시 {rows.length}건</span>
          <span>{collection.table}</span>
        </div>
      </section>

      {filterableCollections.includes(collection.slug) ? (
        <section className="surface card teacher-filter-panel">
          <h2>센터 필터</h2>
          <div className="filter-group" aria-label="PostgreSQL 센터 필터">
            {centerFilters.map((filter) => (
              <Link
                aria-current={center === filter ? 'page' : undefined}
                className="filter-pill"
                href={
                  filter === 'all'
                    ? `/test/postgres/${collection.slug}`
                    : `/test/postgres/${collection.slug}?center=${filter}`
                }
                key={filter}
              >
                {centerLabels[filter]}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {rows.length > 0 ? (
        <section className="test-record-list" aria-label={`${collection.label} 목록`}>
          {rows.map((row) => {
            const imagePath = row.imagePath.trim()

            return (
              <article className="surface test-record-card" key={`${row.slug}-${row.id}`}>
                <div className="test-record-media">
                  {imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={row.title} loading="lazy" src={imagePath} />
                  ) : (
                    <span>NO IMAGE</span>
                  )}
                </div>
                <div className="test-record-body">
                  <p className="teacher-meta">#{row.id}</p>
                  <h2>{row.title || '제목 없음'}</h2>
                  <dl className="teacher-data">
                    <div>
                      <dt>Slug</dt>
                      <dd>{row.slug || '-'}</dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>
                        {row.sourceDb || '-'} / {row.sourceTable || '-'} / {row.sourceId || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt>Meta 1</dt>
                      <dd>{row.meta1 || '-'}</dd>
                    </div>
                    <div>
                      <dt>Meta 2</dt>
                      <dd>{row.meta2 || '-'}</dd>
                    </div>
                    <div>
                      <dt>Meta 3</dt>
                      <dd>{row.meta3 || '-'}</dd>
                    </div>
                    <div>
                      <dt>Image</dt>
                      <dd>{row.imagePath || '-'}</dd>
                    </div>
                  </dl>
                  {collection.slug === 'teachers' && row.relatedFiles.length > 0 ? (
                    <section className="teacher-related-files" aria-label={`${row.title} 대표작 파일`}>
                      <div className="teacher-related-files-header">
                        <h3>Teacher Filmographies</h3>
                        <span>{row.relatedFiles.length}건 매칭</span>
                      </div>
                      <div className="teacher-related-files-grid">
                        {row.relatedFiles.map((file, fileIndex) => (
                          <article
                            className="teacher-related-file"
                            key={`${file.sourceDb}-${file.sourceTable}-${file.sourceId}-${file.displayOrder}-${fileIndex}`}
                          >
                            <div className="teacher-related-file-media">
                              {file.imagePath ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt={file.title || row.title} loading="lazy" src={file.imagePath} />
                              ) : (
                                <span>NO IMAGE</span>
                              )}
                            </div>
                            <div>
                              <strong>{file.title || '제목 없음'}</strong>
                              <span>
                                #{file.displayOrder || '-'} · {file.sourceDb} / {file.sourceId}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="surface card empty-state">
          <h2>표시할 데이터가 없습니다</h2>
          <p>로컬 PostgreSQL seed 상태를 확인하세요.</p>
        </section>
      )}
    </main>
  )
}

const centerFilters = ['all', 'art', 'highteen', 'kids', 'exam'] as const
const filterableCollections: string[] = [
  'teachers',
  'profiles',
  'news',
  'screen-appearances',
  'casting-appearances',
  'casting-directors',
  'artist-press',
  'audition-schedules',
  'exam-passed-reviews',
  'exam-passed-videos',
  'exam-results',
] as const
const centerLabels: Record<(typeof centerFilters)[number], string> = {
  all: '전체',
  art: '아트센터',
  highteen: '하이틴센터',
  kids: '키즈센터',
  exam: '입시센터',
}

function normalizeCenterFilter(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value

  return centerFilters.includes(normalized as (typeof centerFilters)[number])
    ? (normalized as (typeof centerFilters)[number])
    : 'all'
}
