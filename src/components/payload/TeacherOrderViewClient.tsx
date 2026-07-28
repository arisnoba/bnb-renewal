'use client'

import {
  Button,
  DragHandleIcon,
  DraggableSortable,
  DraggableSortableItem,
  Gutter,
  toast,
  useAuth,
  useConfig,
  useStepNav,
} from '@payloadcms/ui'
import { RotateCcw } from 'lucide-react'
import { formatAdminURL } from 'payload/shared'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CenterSlug } from '@/lib/centers'
import { moveTeacherOrderItem, type TeacherOrderDocument } from '@/lib/teacherOrder'

const centerOptions: Array<{ label: string; value: CenterSlug }> = [
  { label: '아트센터', value: 'art' },
  { label: '입시센터', value: 'exam' },
  { label: '하이틴센터', value: 'highteen' },
  { label: '키즈센터', value: 'kids' },
  { label: '애비뉴센터', value: 'avenue' },
]

const statusLabels: Record<string, string> = {
  archived: '비공개',
  draft: '임시저장',
  published: '공개',
}

type TeacherOrderItem = TeacherOrderDocument & {
  id: number
  name?: string | null
  status?: string | null
}

type TeacherOrderResponse = {
  docs?: TeacherOrderItem[]
  manageableCenters?: CenterSlug[]
  message?: string
  revision?: string
}

function userCenter(user: unknown): CenterSlug | undefined {
  if (!user || typeof user !== 'object') {
    return undefined
  }

  const center = (user as { center?: unknown }).center

  return centerOptions.some((option) => option.value === center)
    ? (center as CenterSlug)
    : undefined
}

function isGlobalAdmin(user: unknown) {
  if (!user || typeof user !== 'object') {
    return false
  }

  const role = (user as { role?: unknown }).role
  const permissionLevel = (user as { permissionLevel?: unknown }).permissionLevel

  return (
    role === 'master' ||
    role === 'admin' ||
    (typeof permissionLevel === 'number' && permissionLevel >= 80)
  )
}

function teacherIDs(docs: TeacherOrderItem[]) {
  return docs.map((doc) => doc.id)
}

function sameOrder(left: number[], right: number[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

async function responseData(response: Response) {
  const data = (await response.json().catch(() => ({}))) as TeacherOrderResponse

  if (!response.ok) {
    throw new Error(data.message || '강사진 순서를 불러오지 못했습니다.')
  }

  return data
}

export function TeacherOrderViewClient() {
  const { user } = useAuth()
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
    },
  } = useConfig()
  const { setStepNav } = useStepNav()
  const defaultCenter = userCenter(user) ?? 'art'
  const [center, setCenter] = useState<CenterSlug>(defaultCenter)
  const [docs, setDocs] = useState<TeacherOrderItem[]>([])
  const [savedIDs, setSavedIDs] = useState<number[]>([])
  const [manageableCenters, setManageableCenters] = useState<CenterSlug[]>(
    isGlobalAdmin(user)
      ? centerOptions.map((option) => option.value)
      : userCenter(user)
        ? [userCenter(user) as CenterSlug]
        : []
  )
  const [revision, setRevision] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const currentIDs = useMemo(() => teacherIDs(docs), [docs])
  const isDirty = !sameOrder(currentIDs, savedIDs)
  const teachersURL = formatAdminURL({
    adminRoute,
    path: '/collections/teachers',
  })
  const orderEndpoint = `${apiRoute}/teachers/order`

  useEffect(() => {
    setStepNav([{ label: '강사진', url: teachersURL }, { label: '센터별 순서 설정' }])
  }, [setStepNav, teachersURL])

  const loadOrder = useCallback(
    async (nextCenter: CenterSlug, signal?: AbortSignal) => {
      setError('')
      setIsLoading(true)

      try {
        const response = await fetch(`${orderEndpoint}?center=${encodeURIComponent(nextCenter)}`, {
          credentials: 'include',
          signal,
        })
        const data = await responseData(response)
        const nextDocs = data.docs ?? []

        setDocs(nextDocs)
        setSavedIDs(teacherIDs(nextDocs))
        setManageableCenters(data.manageableCenters ?? [])
        setRevision(data.revision ?? '')
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return
        }

        setError(
          loadError instanceof Error ? loadError.message : '강사진 순서를 불러오지 못했습니다.'
        )
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [orderEndpoint]
  )

  useEffect(() => {
    const controller = new AbortController()

    void loadOrder(center, controller.signal)

    return () => controller.abort()
  }, [center, loadOrder])

  async function saveOrder() {
    if (!isDirty || isSaving) {
      return
    }

    setError('')
    setIsSaving(true)

    try {
      const response = await fetch(orderEndpoint, {
        body: JSON.stringify({
          center,
          revision,
          teacherIds: currentIDs,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const data = await responseData(response)
      const nextDocs = data.docs ?? []

      setDocs(nextDocs)
      setSavedIDs(teacherIDs(nextDocs))
      setRevision(data.revision ?? '')
      toast.success(data.message || '강사진 순서를 저장했습니다.')
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : '강사진 순서를 저장하지 못했습니다.'

      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Gutter className="teacher-order">
      <header className="teacher-order__header">
        <div>
          <p className="teacher-order__eyebrow">관리자 &gt; 강사진</p>
          <h1>센터별 강사진 순서 설정</h1>
          <p>센터를 선택한 뒤 강사를 드래그하세요. 저장하면 해당 센터의 정렬 숫자만 갱신됩니다.</p>
        </div>
        <a className="teacher-order__back-link" href={teachersURL}>
          강사진 목록으로
        </a>
      </header>

      <div className="teacher-order__toolbar">
        <div aria-label="센터 선택" className="teacher-order__centers" role="tablist">
          {centerOptions
            .filter((option) => manageableCenters.includes(option.value))
            .map((option) => (
              <button
                aria-selected={center === option.value}
                className={center === option.value ? 'is-active' : undefined}
                disabled={isDirty || isLoading || isSaving}
                key={option.value}
                onClick={() => setCenter(option.value)}
                role="tab"
                type="button"
              >
                {option.label}
              </button>
            ))}
        </div>

        <div className="teacher-order__actions">
          <Button
            buttonStyle="secondary"
            disabled={!isDirty || isSaving}
            onClick={() =>
              setDocs(
                [...docs].sort((left, right) => {
                  return savedIDs.indexOf(left.id) - savedIDs.indexOf(right.id)
                })
              )
            }
            size="small"
            type="button"
          >
            <RotateCcw aria-hidden="true" size={15} />
            되돌리기
          </Button>
          <Button
            disabled={!isDirty || isLoading || isSaving}
            onClick={() => void saveOrder()}
            size="small"
            type="button"
          >
            {isSaving ? '저장 중…' : '순서 저장'}
          </Button>
        </div>
      </div>

      {isDirty && (
        <p className="teacher-order__notice" role="status">
          저장되지 않은 변경사항이 있습니다. 다른 센터로 이동하려면 먼저 저장하거나 되돌려 주세요.
        </p>
      )}

      {error && (
        <p className="teacher-order__error" role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="teacher-order__empty">강사진 순서를 불러오는 중입니다.</div>
      ) : docs.length === 0 ? (
        <div className="teacher-order__empty">이 센터에 등록된 강사가 없습니다.</div>
      ) : (
        <>
          <div className="teacher-order__summary">
            <strong>{docs.length}명</strong>
            <span>위에서부터 공개 화면에 표시됩니다.</span>
          </div>
          <DraggableSortable
            className="teacher-order__list"
            ids={docs.map((doc) => String(doc.id))}
            onDragEnd={({ moveFromIndex, moveToIndex }) => {
              setDocs((current) => moveTeacherOrderItem(current, moveFromIndex, moveToIndex))
            }}
          >
            {docs.map((doc, index) => (
              <DraggableSortableItem id={String(doc.id)} key={doc.id}>
                {({ attributes, isDragging, listeners, setNodeRef, transform, transition }) => (
                  <div
                    className={`teacher-order__item${isDragging ? ' is-dragging' : ''}`}
                    ref={setNodeRef}
                    style={{
                      transform,
                      transition,
                    }}
                  >
                    <span className="teacher-order__position">{index + 1}</span>
                    <button
                      {...attributes}
                      {...listeners}
                      aria-label={`${doc.name ?? '강사'} 순서 이동`}
                      className="teacher-order__drag-handle"
                      type="button"
                    >
                      <DragHandleIcon />
                    </button>
                    <a
                      className="teacher-order__teacher"
                      href={formatAdminURL({
                        adminRoute,
                        path: `/collections/teachers/${doc.id}`,
                      })}
                    >
                      {doc.name || `강사 ${doc.id}`}
                    </a>
                    <span
                      className={`teacher-order__status teacher-order__status--${doc.status ?? 'unknown'}`}
                    >
                      {statusLabels[doc.status ?? ''] ?? '상태 미지정'}
                    </span>
                  </div>
                )}
              </DraggableSortableItem>
            ))}
          </DraggableSortable>
        </>
      )}
    </Gutter>
  )
}
