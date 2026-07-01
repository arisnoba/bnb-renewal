'use client'

import { UserRound } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/utilities/ui'

type ScreenAppearanceProfileAvatarProps = {
  className?: string
  imageUrl?: string
  size?: 'card' | 'detail'
}

const avatarSizes = {
  card: {
    icon: 'size-6',
    imageSize: '48px',
    root: 'size-12',
  },
  detail: {
    icon: 'size-7',
    imageSize: '56px',
    root: 'size-14',
  },
} as const

export function ScreenAppearanceProfileAvatar({
  className,
  imageUrl = '',
  size = 'card',
}: ScreenAppearanceProfileAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState('')
  const avatarSize = avatarSizes[size]
  const showImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-white text-brand',
        avatarSize.root,
        className,
      )}
    >
      {showImage ? (
        <Image
          alt=""
          className="size-full object-cover object-center"
          fill
          loading="lazy"
          onError={() => setFailedImageUrl(imageUrl)}
          sizes={avatarSize.imageSize}
          src={imageUrl}
          unoptimized
        />
      ) : (
        <span aria-hidden="true" className="flex size-full items-center justify-center">
          <UserRound aria-hidden="true" className={avatarSize.icon} strokeWidth={1.8} />
        </span>
      )}
    </div>
  )
}
