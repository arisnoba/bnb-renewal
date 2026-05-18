'use client'

import type { ChangeEvent } from 'react'
import type { UIFieldClientComponent } from 'payload'

import { useField, useForm, useFormFields } from '@payloadcms/ui'
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

type BodyImage = {
  id?: string
  imagePath?: string | null
}

type FormFieldState = {
  value?: unknown
}

type RowState = {
  id?: string
}

const imageExtensions = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'])

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getImageSrc(value: unknown) {
  const trimmed = stringValue(value)

  if (!trimmed) {
    return ''
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed
  }

  return `/${trimmed.replace(/^\/+/, '')}`
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

  const response = await fetch('/api/admin-images', {
    body: formData,
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const body = (await response.json()) as { path?: unknown }
  const path = typeof body.path === 'string' ? body.path : ''

  if (!path) {
    throw new Error('업로드 응답에 이미지 경로가 없습니다.')
  }

  return path
}

function createRowId() {
  return globalThis.crypto?.randomUUID?.() ?? `body-image-${Date.now()}-${Math.random()}`
}

export const StarCardBodyImagesField: UIFieldClientComponent = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { disabled, path, rows = [] } = useField<number>({
    hasRows: true,
    path: 'bodyImages',
  })
  const { addFieldRow, moveFieldRow, removeFieldRow } = useForm()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'info'>('info')
  const bodyImages = useFormFields(([fields]) =>
    (rows as RowState[])
      .map((row, index): BodyImage => {
        const imagePathField = fields[`${path}.${index}.imagePath`] as FormFieldState | undefined
        const idField = fields[`${path}.${index}.id`] as FormFieldState | undefined

        return {
          id: stringValue(idField?.value) || row.id,
          imagePath: stringValue(imagePathField?.value),
        }
      })
      .filter((row) => stringValue(row.imagePath)),
  )
  const controlsDisabled = disabled || isProcessing

  function addImagePath(imagePath: string, rowIndex: number) {
    const id = createRowId()

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
        imagePath: {
          initialValue: undefined,
          passesCondition: true,
          valid: true,
          value: imagePath,
        },
      },
    })
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])

    event.currentTarget.value = ''

    if (files.length === 0) {
      return
    }

    setIsProcessing(true)
    setMessage('')
    setMessageType('info')

    try {
      const uploadedPaths = []

      for (const file of files) {
        uploadedPaths.push(await uploadFile(file))
      }

      uploadedPaths.forEach((imagePath, offset) => {
        addImagePath(imagePath, bodyImages.length + offset)
      })
      setMessage(`${uploadedPaths.length}개 이미지가 추가되었습니다. 저장 버튼을 눌러 반영하세요.`)
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setIsProcessing(false)
    }
  }

  function removeItem(index: number) {
    removeFieldRow({
      path,
      rowIndex: index,
    })
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction

    if (nextIndex < 0 || nextIndex >= bodyImages.length) {
      return
    }

    moveFieldRow({
      moveFromIndex: index,
      moveToIndex: nextIndex,
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
        <div
          style={{
            color: 'var(--theme-text)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          본문 이미지
        </div>
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
          style={{
            background: 'var(--bnb-admin-upload-bg)',
            border: '1px dashed var(--bnb-admin-upload-border)',
            borderRadius: 'var(--style-radius-s)',
            color: 'var(--bnb-admin-upload-text)',
            cursor: controlsDisabled ? 'not-allowed' : 'pointer',
            display: 'grid',
            gap: 6,
            padding: 'calc(var(--base) * 0.85)',
            textAlign: 'left',
            width: '100%',
          }}
          type="button"
        >
          <span className="bnb-image-upload-trigger__title">
            <span className="bnb-image-upload-trigger__icon">
              <ImagePlus aria-hidden="true" size={16} strokeWidth={2} />
            </span>
            <span>{isProcessing ? '업로드 중...' : '이미지 업로드'}</span>
          </span>
          <span className="bnb-image-upload-trigger__help" style={{ fontSize: 12 }}>
            스타카드 본문에 사용할 이미지를 등록합니다.
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
          const imageSrc = getImageSrc(row.imagePath)
          const canPreview = imageSrc && isProbablyImage(imageSrc)
          const fileName = imageSrc ? getFileName(imageSrc) : getFileName(stringValue(row.imagePath))

          return (
            <article
              key={row.id || `${row.imagePath}-${index}`}
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
