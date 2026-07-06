'use client'

import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../_shared/types'

import { cssVariables } from '@/cssVariables'
import { getMediaUrl } from '@/utilities/getMediaUrl'

const { breakpoints } = cssVariables

// Neutral placeholder used only when a caller explicitly requests blur loading.
const placeholderBlur =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22%3E%3Crect width=%221%22 height=%221%22 fill=%22%23f5f5f5%22/%3E%3C/svg%3E'

/**
 * ImageMedia
 *
 * This component accepts app-managed media paths (e.g. `/media/...`).
 * The `getMediaUrl` utility resolves those paths to R2_PUBLIC_BASE_URL when configured.
 * Next.js then optimizes remote images through `remotePatterns` in next.config.mjs.
 *
 * Flow:
 *   1. Resource URL from Payload: `/media/image-123.jpg`
 *   2. getMediaUrl() adds base URL: `https://your-r2-public-base/media/image-123.jpg`
 *   3. Next.js Image optimizes via remotePatterns: `/_next/image?url=...&w=1200&q=75`
 *
 * If your storage/plugin returns **external CDN URLs** (e.g. `https://cdn.example.com/...`),
 * choose ONE of the following:
 *   A) Allow the remote host in next.config.js:
 *      images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }] }
 *   B) Provide a **custom loader** for CDN-specific transforms:
 *      const imageLoader: ImageLoader = ({ src, width, quality }) =>
 *        `https://cdn.example.com${src}?w=${width}&q=${quality ?? 75}`
 *      <Image loader={imageLoader} src="/media/hero.jpg" width={1200} height={600} alt="" />
 *   C) Skip optimization:
 *      <Image unoptimized src="https://cdn.example.com/hero.jpg" width={1200} height={600} alt="" />
 *
 * TL;DR: Media paths flow through getMediaUrl(), then rely on remotePatterns for optimization.
 * Only add `loader` if using external CDNs with custom transforms.
 */

export const ImageMedia: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    pictureClassName,
    imgClassName,
    priority,
    placeholder = 'empty',
    resource,
    size: sizeFromProps,
    src: srcFromProps,
    loading: loadingFromProps,
    fadeIn,
  } = props

  const [isLoaded, setIsLoaded] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (fadeIn && imgRef.current?.complete) {
      setIsLoaded(true)
    }
  }, [fadeIn])

  let width: number | undefined
  let height: number | undefined
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''

  if (!src && resource && typeof resource === 'object') {
    const { alt: altFromResource, height: fullHeight, url, width: fullWidth } = resource

    width = toPositiveNumber(fullWidth)
    height = toPositiveNumber(fullHeight)
    alt = altFromResource || ''

    const cacheTag = resource.updatedAt

    src = getMediaUrl(url, cacheTag)
  }

  const loading = loadingFromProps || (!priority ? 'lazy' : undefined)

  // NOTE: this is used by the browser to determine which image to download at different screen sizes
  const sizes = sizeFromProps
    ? sizeFromProps
    : Object.entries(breakpoints)
        .map(([, value]) => `(max-width: ${value}px) ${value * 2}w`)
        .join(', ')

  if (!fill && (!width || !height) && typeof src === 'string') {
    return (
      <picture className={pictureClassName}>
        <img
          ref={imgRef}
          alt={alt || ''}
          className={cn(
            fadeIn && 'transition-opacity duration-300 ease-in-out',
            fadeIn && (isLoaded ? 'opacity-100' : 'opacity-0'),
            imgClassName
          )}
          loading={loading}
          sizes={sizes}
          src={src}
          onLoad={() => {
            if (fadeIn) {
              setIsLoaded(true)
            }
            if (props.onLoad) {
              props.onLoad()
            }
          }}
        />
      </picture>
    )
  }

  return (
    <picture className={cn(fill && 'relative block', pictureClassName)}>
      <NextImage
        ref={imgRef}
        alt={alt || ''}
        className={cn(
          fadeIn && 'transition-opacity duration-300 ease-in-out',
          fadeIn && (isLoaded ? 'opacity-100' : 'opacity-0'),
          imgClassName
        )}
        fill={fill}
        height={!fill ? height : undefined}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? placeholderBlur : undefined}
        priority={priority}
        quality={100}
        loading={loading}
        sizes={sizes}
        src={src}
        width={!fill ? width : undefined}
        onLoad={() => {
          if (fadeIn) {
            setIsLoaded(true)
          }
          if (props.onLoad) {
            props.onLoad()
          }
        }}
      />
    </picture>
  )
}

function toPositiveNumber(value: unknown) {
  const number = Number(value)

  return Number.isFinite(number) && number > 0 ? number : undefined
}
