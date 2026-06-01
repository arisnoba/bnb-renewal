'use client'

import type { UIFieldClientComponent } from 'payload'

import { useFormFields } from '@payloadcms/ui'

import { youtubeThumbnailUrl } from '@/lib/youtube'

type FieldState = {
  value?: unknown
}

type MediaValue = {
  alt?: unknown
  filename?: unknown
  thumbnailURL?: unknown
  url?: unknown
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function imageUrlFromMedia(value: unknown) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const media = value as MediaValue
  const src = stringValue(media.thumbnailURL) || stringValue(media.url)

  if (src) {
    return src
  }

  const filename = stringValue(media.filename)

  return filename ? `/media/${filename}` : ''
}

function imageAltFromMedia(value: unknown) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  return stringValue((value as MediaValue).alt)
}

export const SocialLinkImagePreviewField: UIFieldClientComponent = () => {
  const { alt, imageUrl, source } = useFormFields(([fields]) => {
    const representativeImage = fields.representativeImage as FieldState | undefined
    const representativeImageUrl = fields.representativeImageUrl as FieldState | undefined
    const externalUrl = fields.externalUrl as FieldState | undefined
    const title = fields.title as FieldState | undefined
    const mediaUrl = imageUrlFromMedia(representativeImage?.value)
    const manualUrl = stringValue(representativeImageUrl?.value)
    const youtubeUrl = youtubeThumbnailUrl(externalUrl?.value)

    if (mediaUrl) {
      return {
        alt: imageAltFromMedia(representativeImage?.value) || stringValue(title?.value) || 'SNS 링크',
        imageUrl: mediaUrl,
        source: '업로드 이미지',
      }
    }

    if (manualUrl) {
      return {
        alt: stringValue(title?.value) || 'SNS 링크',
        imageUrl: manualUrl,
        source: '이미지 URL',
      }
    }

    if (youtubeUrl) {
      return {
        alt: stringValue(title?.value) || '유튜브 썸네일',
        imageUrl: youtubeUrl,
        source: '유튜브 썸네일',
      }
    }

    return {
      alt: '',
      imageUrl: '',
      source: '',
    }
  })

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--base) / 4)', marginBottom: 20 }}>
      <div
        style={{
          color: 'var(--theme-text)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        프리뷰
      </div>
      <div
        style={{
          background: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-border-color)',
          borderRadius: 'var(--style-radius-s)',
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Admin preview needs to render arbitrary external image URLs.
          <img
            alt={alt}
            src={imageUrl}
            style={{
              aspectRatio: '16 / 9',
              display: 'block',
              objectFit: 'cover',
              width: '100%',
            }}
          />
        ) : (
          <div
            style={{
              alignItems: 'center',
              aspectRatio: '16 / 9',
              color: 'var(--theme-elevation-600)',
              display: 'flex',
              fontSize: 13,
              justifyContent: 'center',
              padding: 'calc(var(--base) * 0.5)',
              textAlign: 'center',
            }}
          >
            외부 링크 또는 대표 이미지를 입력하면 이미지가 표시됩니다.
          </div>
        )}
      </div>
      {source && (
        <div
          style={{
            color: 'var(--theme-elevation-600)',
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          {source}
        </div>
      )}
    </div>
  )
}
