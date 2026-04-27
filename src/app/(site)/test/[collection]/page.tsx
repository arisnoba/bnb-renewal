import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Where } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import { getTestCollection, testCollections } from '@/lib/testCollections'

export const dynamic = 'force-dynamic'

type TestDoc = Record<string, unknown> & {
  id: number | string
  slug?: string
  sourceId?: number | string
  sourceTable?: string
}

function buildPublishedWhere(collectionSlug: string): Where | undefined {
  if (collectionSlug === 'teachers') {
    return {
      status: {
        equals: 'published',
      },
    }
  }

  if (
    [
      'artist-press',
      'audition-schedules',
      'casting-directors',
      'casting-appearances',
      'exam-passed-reviews',
      'exam-passed-videos',
      'exam-results',
      'news',
      'profiles',
      'screen-appearances',
    ].includes(collectionSlug)
  ) {
    return {
      displayStatus: {
        equals: 'published',
      },
    }
  }

  return undefined
}

export function generateStaticParams() {
  return testCollections
    .filter((collection) => collection.slug !== 'teachers')
    .map((collection) => ({ collection: collection.slug }))
}

function getFieldText(doc: TestDoc, fields: string[]) {
  for (const field of fields) {
    const value = getFieldValue(doc, field)

    if (value == null) {
      continue
    }

    if (Array.isArray(value) && value.length > 0) {
      return value.join(', ')
    }

    const text = String(value).trim()

    if (text) {
      return text
    }
  }

  return '제목 없음'
}

function getFieldValue(doc: TestDoc, field: string) {
  return field.split('.').reduce<unknown>((currentValue, segment) => {
    if (
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue)
    ) {
      return (currentValue as Record<string, unknown>)[segment]
    }

    return undefined
  }, doc)
}

function formatValue(value: unknown) {
  if (value == null || value === '') {
    return '-'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>

    return String(record.schoolName ?? record.title ?? record.name ?? record.id ?? '-')
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}

function getImagePath(doc: TestDoc, fields: string[]) {
  const value = getFieldText(doc, fields)

  if (!fields.length || value === '제목 없음') {
    return undefined
  }

  if (/\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(value)) {
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
      ? value
      : `/${value.replace(/^\/+/, '')}`
  }

  return undefined
}

export default async function CollectionTestPage({
  params,
}: {
  params: Promise<{ collection: string }>
}) {
  const { collection: collectionSlug } = await params
  const collection = getTestCollection(collectionSlug)

  if (!collection || collection.slug === 'teachers') {
    notFound()
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: collection.slug,
    depth: 1,
    limit: 100,
    pagination: false,
    sort: collection.sort,
    where: buildPublishedWhere(collection.slug),
  })
  const docs = result.docs as unknown as TestDoc[]

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">Collection Test</span>
        <h1>{collection.label}</h1>
        <p>{collection.description}</p>
        <div className="test-summary">
          <Link className="filter-pill" href="/test">
            전체 메뉴
          </Link>
          <span>표시 {docs.length}건</span>
          <span>정렬 {collection.sort}</span>
          <span>{collection.slug}</span>
        </div>
      </section>

      {docs.length > 0 ? (
        <section className="test-record-list" aria-label={`${collection.label} 목록`}>
          {docs.map((doc) => {
            const imagePath = getImagePath(doc, collection.imageFields)
            const title = getFieldText(doc, collection.titleFields)

            return (
              <article className="surface test-record-card" key={doc.id}>
                {collection.imageFields.length > 0 ? (
                  <div className="test-record-media">
                    {imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={title} loading="lazy" src={imagePath} />
                    ) : (
                      <span>NO IMAGE</span>
                    )}
                  </div>
                ) : null}
                <div className="test-record-body">
                  <p className="teacher-meta">#{doc.id}</p>
                  <h2>{title}</h2>
                  <dl className="teacher-data">
                    <div>
                      <dt>Slug</dt>
                      <dd>{doc.slug ?? '-'}</dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>
                        {doc.sourceTable ?? '-'} / {doc.sourceId ?? '-'}
                      </dd>
                    </div>
                    {collection.metaFields.map((field) => (
                      <div key={field}>
                        <dt>{field}</dt>
                        <dd>{formatValue(getFieldValue(doc, field))}</dd>
                      </div>
                    ))}
                    {collection.imageFields.map((field) => (
                      <div key={field}>
                        <dt>{field}</dt>
                        <dd>{formatValue(getFieldValue(doc, field))}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="surface card empty-state">
          <h2>표시할 데이터가 없습니다</h2>
          <p>시드 상태나 현재 연결 DB를 확인하세요.</p>
        </section>
      )}
    </main>
  )
}
