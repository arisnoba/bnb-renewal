import type { Teacher } from '@/payload-types'

import Link from 'next/link'

import { centers, getCenterLabel } from '@/lib/centers'
import { getPayloadClient } from '@/lib/payload'

const centerFilters = ['all', ...Object.keys(centers), 'unknown'] as const
const statusFilters = ['all', 'published', 'draft', 'archived'] as const

export const dynamic = 'force-dynamic'

type CenterFilter = (typeof centerFilters)[number]
type CenterValue = Teacher['centers'][number]
type StatusFilter = (typeof statusFilters)[number]

function getFilter<T extends readonly string[]>(
  value: string | string[] | undefined,
  allowedValues: T,
  fallback: T[number],
): T[number] {
  const normalizedValue = Array.isArray(value) ? value[0] : value

  return allowedValues.includes(normalizedValue ?? '') ? normalizedValue! : fallback
}

function getTeacherImagePath(teacher: Teacher): null | string {
  const imagePath =
    teacher.profileImagePath ??
    teacher.photoImage1 ??
    teacher.gallery?.find((item) => item.path)?.path ??
    null

  if (!imagePath) {
    return null
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  const normalizedPath = imagePath.replace(/^\/+/, '')

  return `/legacy/teachers/${normalizedPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`
}

function getCenterText(teacher: Teacher): string {
  return teacher.centers.map((center) => getCenterLabel(center)).join(', ')
}

function filterTeachers(
  teachers: Teacher[],
  centerFilter: CenterFilter,
  statusFilter: StatusFilter,
): Teacher[] {
  return teachers.filter((teacher) => {
    const matchesCenter =
      centerFilter === 'all' || teacher.centers.includes(centerFilter as CenterValue)
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter

    return matchesCenter && matchesStatus
  })
}

function buildFilterHref({
  center,
  status,
}: {
  center: CenterFilter
  status: StatusFilter
}) {
  const params = new URLSearchParams()

  if (center !== 'all') {
    params.set('center', center)
  }

  if (status !== 'all') {
    params.set('status', status)
  }

  const query = params.toString()

  return query ? `/test/teachers?${query}` : '/test/teachers'
}

export default async function TeacherTestPage({
  searchParams,
}: {
  searchParams: Promise<{
    center?: string | string[]
    status?: string | string[]
  }>
}) {
  const resolvedSearchParams = await searchParams
  const centerFilter = getFilter(resolvedSearchParams.center, centerFilters, 'all')
  const statusFilter = getFilter(
    resolvedSearchParams.status,
    statusFilters,
    'all',
  )

  const payload = await getPayloadClient()
  const teacherResult = await payload.find({
    collection: 'teachers',
    depth: 0,
    limit: 500,
    pagination: false,
    sort: 'displayOrder',
    where: {
      status: {
        equals: 'published',
      },
    },
  })

  const teachers = filterTeachers(
    teacherResult.docs,
    centerFilter,
    statusFilter,
  )

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">Teacher Test</span>
        <h1>티쳐 리스트 테스트</h1>
        <p>
          Payload <code>teachers</code> 컬렉션의 프론트 렌더링을 확인하는 임시
          페이지입니다. 이름, 센터, 상태, 대표 이미지 경로, 정렬값을 한 화면에서
          점검합니다.
        </p>
        <div className="test-summary">
          <Link className="filter-pill" href="/test">
            전체 메뉴
          </Link>
          <span>전체 {teacherResult.docs.length}명</span>
          <span>표시 {teachers.length}명</span>
          <span>정렬 displayOrder</span>
        </div>
      </section>

      <section className="surface card teacher-filter-panel">
        <h2>필터</h2>
        <div className="filter-group" aria-label="센터 필터">
          {centerFilters.map((center) => (
            <a
              aria-current={centerFilter === center ? 'page' : undefined}
              className="filter-pill"
              href={buildFilterHref({ center, status: statusFilter })}
              key={center}
            >
              {center === 'all' ? '전체 센터' : getCenterLabel(center)}
            </a>
          ))}
        </div>
        <div className="filter-group" aria-label="상태 필터">
          {statusFilters.map((status) => (
            <a
              aria-current={statusFilter === status ? 'page' : undefined}
              className="filter-pill"
              href={buildFilterHref({ center: centerFilter, status })}
              key={status}
            >
              {status === 'all' ? '전체 상태' : status}
            </a>
          ))}
        </div>
      </section>

      {teachers.length > 0 ? (
        <section className="teacher-list" aria-label="티쳐 목록">
          {teachers.map((teacher) => {
            const imagePath = getTeacherImagePath(teacher)

            return (
              <article className="surface teacher-card" key={teacher.id}>
                <div className="teacher-photo">
                  {imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`${teacher.name} 프로필`}
                      decoding="async"
                      loading="lazy"
                      src={imagePath}
                    />
                  ) : (
                    <span>NO IMAGE</span>
                  )}
                </div>
                <div className="teacher-info">
                  <div>
                    <p className="teacher-meta">
                      #{teacher.displayOrder ?? 0} · {teacher.status}
                    </p>
                    <h2>{teacher.name}</h2>
                    {teacher.role ? <p className="teacher-role">{teacher.role}</p> : null}
                  </div>
                  <dl className="teacher-data">
                    <div>
                      <dt>센터</dt>
                      <dd>{getCenterText(teacher)}</dd>
                    </div>
                    <div>
                      <dt>Slug</dt>
                      <dd>{teacher.slug}</dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>
                        {teacher.sourceTable} / {teacher.sourceId}
                      </dd>
                    </div>
                    <div>
                      <dt>이미지</dt>
                      <dd>{imagePath ?? '없음'}</dd>
                    </div>
                  </dl>
                  {teacher.summary ? (
                    <p className="teacher-summary">{teacher.summary}</p>
                  ) : null}
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="surface card empty-state">
          <h2>표시할 티쳐가 없습니다</h2>
          <p>필터를 바꾸거나 시드 데이터와 상태값을 확인하세요.</p>
        </section>
      )}
    </main>
  )
}
