'use client'

import type { ChangeEvent, DragEvent, FC } from 'react'

import { useForm, useFormFields } from '@payloadcms/ui'
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type BodyImage = {
  id?: string
  image?: MediaSummary | number | string | null
  rowIndex: number
}

type MediaSummary = {
  alt?: string | null
  filename?: string | null
  id: number | string
  thumbnailURL?: string | null
  url?: string | null
}

type FormFieldState = {
  rows?: RowState[]
  value?: unknown
}

type RowState = {
  id?: string
}

const imageExtensions = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'])
const mediaPrefix = 'media/screen-appearances/images'

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function mediaId(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') {
    const id = String(value).trim()

    return id || ''
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = String((value as { id?: unknown }).id ?? '').trim()

    return id || ''
  }

  return ''
}

function mediaRelationValue(value: unknown): number | string | null {
  const rawValue =
    value && typeof value === 'object' && 'id' in value ? (value as { id?: unknown }).id : value

  if (typeof rawValue === 'number') {
    return Number.isNaN(rawValue) ? null : rawValue
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim()

    if (!trimmed) {
      return null
    }

    return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed
  }

  return null
}

function mediaFromValue(value: unknown): MediaSummary | null {
  if (!value || typeof value !== 'object' || !('id' in value)) {
    return null
  }

  const id = mediaRelationValue(value)

  if (id === null) {
    return null
  }

  const media = value as Partial<MediaSummary>

  return {
    alt: media.alt,
    filename: media.filename,
    id,
    thumbnailURL: media.thumbnailURL,
    url: media.url,
  }
}

function getImageSrc(media?: MediaSummary | null) {
  const src = stringValue(media?.thumbnailURL) || stringValue(media?.url)

  if (!src) {
    return ''
  }

  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) {
    return src
  }

  return `/${src.replace(/^\/+/, '')}`
}

function getFileName(src: string) {
  const pathname = src.split('?')[0] ?? ''
  const fileName = pathname.split('/').filter(Boolean).pop()

  if (!fileName) {
    return src
  }

  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

function isProbablyImage(src: string) {
  const pathname = src.split('?')[0] ?? ''
  const extension = pathname.split('.').pop()?.toLowerCase()

  return extension ? imageExtensions.has(extension) : true
}

async function readErrorMessage(response: Response) {
  const fallback = '이미지 처리 중 오류가 발생했습니다.'

  try {
    const body = (await response.json()) as { error?: unknown }

    return typeof body.error === 'string' ? body.error : fallback
  } catch {
    return fallback
  }
}

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append(
    '_payload',
    JSON.stringify({
      alt: file.name,
      prefix: mediaPrefix,
    }),
  )

  const response = await fetch('/api/media', {
    body: formData,
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const body = (await response.json()) as { doc?: unknown }
  const media = mediaFromValue(body.doc ?? body)

  if (!media) {
    throw new Error('업로드 응답에 media ID가 없습니다.')
  }

  return media
}

function createRowId() {
  return globalThis.crypto?.randomUUID?.() ?? `body-image-${Date.now()}-${Math.random()}`
}

export const ScreenAppearanceBodyImagesField: FC = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const path = 'bodyImages'
  const { addFieldRow, disabled, dispatchFields, moveFieldRow, removeFieldRow } = useForm()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [mediaById, setMediaById] = useState<Record<string, MediaSummary>>({})
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'info'>('info')
  const { bodyImages, rows } = useFormFields(([fields]) => {
    const fieldRows = ((fields[path] as FormFieldState | undefined)?.rows ?? []) as RowState[]

    return {
      bodyImages: fieldRows
        .map((row, index): BodyImage => {
        const imageField = fields[`${path}.${index}.image`] as FormFieldState | undefined
        const idField = fields[`${path}.${index}.id`] as FormFieldState | undefined
        const image = imageField?.value ?? null
        const relationValue = mediaRelationValue(image)

        return {
          id: stringValue(idField?.value) || row.id,
          image: mediaFromValue(image) ?? relationValue,
          rowIndex: index,
        }
      })
      .filter((row) => mediaId(row.image)),
      rows: fieldRows,
    }
  })
  const mediaIds = bodyImages.map((row) => mediaId(row.image)).filter(Boolean)
  const mediaIdsKey = mediaIds.join('|')
  const controlsDisabled = disabled || isProcessing

  useEffect(() => {
    for (const row of bodyImages) {
      const normalized = mediaRelationValue(row.image)

      if (typeof row.image === 'string' && typeof normalized === 'number') {
        dispatchFields({
          initialValue: normalized,
          path: `${path}.${row.rowIndex}.image`,
          type: 'UPDATE',
          valid: true,
          value: normalized,
        })
      }
    }
  }, [bodyImages, dispatchFields, path])

  useEffect(() => {
    const ids = mediaIdsKey ? mediaIdsKey.split('|') : []
    const missingIds = ids.filter((id) => !mediaById[id])

    if (missingIds.length === 0) {
      return
    }

    let ignore = false

    async function loadMedia() {
      const entries = await Promise.all(
        missingIds.map(async (id): Promise<[string, MediaSummary] | null> => {
          const response = await fetch(`/api/media/${encodeURIComponent(id)}?depth=0`)

          if (!response.ok) {
            return null
          }

          const media = mediaFromValue(await response.json())

          return media ? [String(media.id), media] : null
        }),
      )

      if (ignore) {
        return
      }

      setMediaById((current) => {
        const next = { ...current }

        for (const entry of entries) {
          if (entry) {
            const [id, media] = entry

            next[id] = media
          }
        }

        return next
      })
    }

    void loadMedia()

    return () => {
      ignore = true
    }
  }, [mediaById, mediaIdsKey])

  function addMedia(media: MediaSummary, rowIndex: number) {
    const id = createRowId()

    setMediaById((current) => ({
      ...current,
      [String(media.id)]: media,
    }))

    addFieldRow({
      path,
      rowIndex,
      schemaPath: path,
      subFieldState: {
        id: {
          initialValue: id,
          passesCondition: true,
          valid: true,
          value: id,
        },
        image: {
          initialValue: media.id,
          passesCondition: true,
          valid: true,
          value: media.id,
        },
      },
    })
  }

  async function processFiles(files: File[]) {
    if (files.length === 0) {
      return
    }

    setIsProcessing(true)
    setMessage('')
    setMessageType('info')

    try {
      const uploadedMedia = []

      for (const file of files) {
        uploadedMedia.push(await uploadFile(file))
      }

      uploadedMedia.forEach((media, offset) => {
        addMedia(media, (rows as RowState[]).length + offset)
      })
      setMessage(`${uploadedMedia.length}개 이미지가 추가되었습니다. 저장 버튼을 눌러 반영하세요.`)
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setIsProcessing(false)
    }
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!controlsDisabled) {
      setIsDragOver(true)
    }
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  async function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragOver(false)

    if (controlsDisabled) {
      return
    }

    await processFiles(Array.from(event.dataTransfer.files))
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])

    event.currentTarget.value = ''

    await processFiles(files)
  }

  function removeItem(index: number) {
    const row = bodyImages[index]

    if (!row) {
      return
    }

    removeFieldRow({
      path,
      rowIndex: row.rowIndex,
    })
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction

    if (nextIndex < 0 || nextIndex >= bodyImages.length) {
      return
    }

    const row = bodyImages[index]
    const nextRow = bodyImages[nextIndex]

    if (!row || !nextRow) {
      return
    }

    moveFieldRow({
      moveFromIndex: row.rowIndex,
      moveToIndex: nextRow.rowIndex,
      path,
    })
  }

  return (
    <section
      style={{
        display: 'grid',
        gap: 'calc(var(--base) * 0.75)',
        marginBottom: 'var(--base)',
      }}
    >
      <div>
        <input
          accept="image/avif,image/gif,image/jpeg,image/png,image/svg+xml,image/webp"
          disabled={controlsDisabled}
          multiple
          onChange={handleFileChange}
          ref={inputRef}
          style={{ display: 'none' }}
          type="file"
        />
        <button
          className="bnb-image-upload-trigger"
          disabled={controlsDisabled}
          onClick={() => inputRef.current?.click()}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            background: isDragOver ? 'var(--theme-elevation-100)' : 'var(--bnb-admin-upload-bg)',
            border: `1px dashed ${isDragOver ? 'var(--theme-text)' : 'var(--bnb-admin-upload-border)'}`,
            borderRadius: 'var(--style-radius-s)',
            color: 'var(--bnb-admin-upload-text)',
            cursor: controlsDisabled ? 'not-allowed' : 'pointer',
            display: 'grid',
            gap: 6,
            padding: 'calc(var(--base) * 0.85)',
            textAlign: 'left',
            transition: 'background 0.15s, border-color 0.15s',
            width: '100%',
          }}
          type="button"
        >
          <span className="bnb-image-upload-trigger__title">
            <span className="bnb-image-upload-trigger__icon">
              <ImagePlus aria-hidden="true" size={16} strokeWidth={2} />
            </span>
            <span>{isProcessing ? '업로드 중...' : isDragOver ? '여기에 놓기' : '이미지 업로드'}</span>
          </span>
          <span className="bnb-image-upload-trigger__help" style={{ fontSize: 12 }}>
            여러 장을 한번에 선택하거나 드래그해서 올릴 수 있습니다.
          </span>
        </button>
        {message ? (
          <p
            style={{
              color: messageType === 'error' ? 'var(--theme-error-700)' : 'var(--theme-elevation-600)',
              fontSize: 12,
              marginBottom: 0,
            }}
          >
            {message}
          </p>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: 'calc(var(--base) / 2)' }}>
        {bodyImages.length === 0 ? (
          <div
            style={{
              background: 'var(--theme-elevation-50)',
              border: '1px solid var(--theme-border-color)',
              borderRadius: 'var(--style-radius-s)',
              color: 'var(--theme-elevation-600)',
              fontSize: 13,
              padding: 'calc(var(--base) * 0.6)',
            }}
          >
            등록된 본문 이미지가 없습니다.
          </div>
        ) : null}
        {bodyImages.map((row, index) => {
          const id = mediaId(row.image)
          const media = mediaFromValue(row.image) ?? mediaById[id]
          const imageSrc = getImageSrc(media)
          const canPreview = imageSrc && isProbablyImage(imageSrc)
          const fileName =
            stringValue(media?.filename) ||
            stringValue(media?.alt) ||
            (imageSrc ? getFileName(imageSrc) : `media ${id}`)

          return (
            <article
              key={row.id || `${id}-${index}`}
              style={{
                alignItems: 'center',
                background: 'var(--theme-elevation-50)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: 'var(--style-radius-s)',
                display: 'grid',
                gap: 'calc(var(--base) / 2)',
                gridTemplateColumns: '72px minmax(0, 1fr) auto auto',
                padding: 'calc(var(--base) * 0.5)',
              }}
            >
              {canPreview ? (
                <a
                  aria-label="이미지 확인"
                  href={imageSrc}
                  rel="noreferrer"
                  style={{
                    alignItems: 'center',
                    background: 'var(--theme-elevation-100)',
                    border: '1px solid var(--theme-border-color)',
                    borderRadius: 'var(--style-radius-s)',
                    color: 'var(--theme-elevation-500)',
                    cursor: 'pointer',
                    display: 'flex',
                    fontSize: 11,
                    fontWeight: 600,
                    height: 72,
                    justifyContent: 'center',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    width: 72,
                  }}
                  target="_blank"
                  title="이미지 확인"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    loading="lazy"
                    src={imageSrc}
                    style={{
                      display: 'block',
                      height: '100%',
                      objectFit: 'cover',
                      width: '100%',
                    }}
                  />
                </a>
              ) : (
                <div
                  aria-label="이미지 미리보기 없음"
                  style={{
                    alignItems: 'center',
                    background: 'var(--theme-elevation-100)',
                    border: '1px solid var(--theme-border-color)',
                    borderRadius: 'var(--style-radius-s)',
                    color: 'var(--theme-elevation-500)',
                    display: 'flex',
                    fontSize: 11,
                    fontWeight: 600,
                    height: 72,
                    justifyContent: 'center',
                    overflow: 'hidden',
                    width: 72,
                  }}
                >
                  IMG
                </div>
              )}
              <div
                style={{
                  color: 'var(--theme-text)',
                  fontSize: 13,
                  fontWeight: 600,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={fileName}
              >
                {fileName}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  aria-label="위로 이동"
                  disabled={controlsDisabled || index === 0}
                  onClick={() => moveItem(index, -1)}
                  style={actionButtonStyle(controlsDisabled || index === 0)}
                  title="위로 이동"
                  type="button"
                >
                  <ArrowUp aria-hidden="true" size={16} strokeWidth={2} />
                </button>
                <button
                  aria-label="아래로 이동"
                  disabled={controlsDisabled || index === bodyImages.length - 1}
                  onClick={() => moveItem(index, 1)}
                  style={actionButtonStyle(controlsDisabled || index === bodyImages.length - 1)}
                  title="아래로 이동"
                  type="button"
                >
                  <ArrowDown aria-hidden="true" size={16} strokeWidth={2} />
                </button>
              </div>
              <div>
                <button
                  aria-label="삭제"
                  disabled={controlsDisabled}
                  onClick={() => removeItem(index)}
                  style={{
                    ...actionButtonStyle(controlsDisabled),
                    background: 'var(--theme-error-50)',
                    borderColor: 'var(--theme-error-150)',
                    color: 'var(--theme-error-700)',
                  }}
                  title="삭제"
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={16} strokeWidth={2} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function actionButtonStyle(disabled: boolean) {
  return {
    alignItems: 'center',
    background: 'var(--theme-elevation-100)',
    border: '1px solid var(--theme-border-color)',
    borderRadius: 'var(--style-radius-s)',
    color: 'var(--theme-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    fontSize: 12,
    height: 40,
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
    whiteSpace: 'nowrap' as const,
    width: 40,
  }
}
