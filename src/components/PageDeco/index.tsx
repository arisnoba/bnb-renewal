import type { CSSProperties } from 'react'

import { cn } from '@/utilities/ui'

const decoIcons = ['icon-ae.svg', 'icon-b.svg', 'icon-m.svg', 'icon-ng.svg', 'icon-u.svg'] as const

export type DecoIcon = (typeof decoIcons)[number]

type PageDecoProps = {
  className?: string
  icon?: DecoIcon | 'random'
  parallax?: string
  seed?: string
  size?: string
}

type DecoStyle = CSSProperties & {
  '--page-deco-image': string
  '--page-deco-size'?: string
}

export function PageDeco({
  className,
  icon = 'random',
  parallax,
  seed,
  size,
}: PageDecoProps) {
  const iconName = icon === 'random' ? resolveRandomIcon(seed ?? className ?? 'page-deco') : icon
  const style: DecoStyle = {
    '--page-deco-image': `url('/assets/common/deco/${iconName}')`,
    ...(size ? { '--page-deco-size': size } : {}),
  }

  return (
    <span
      aria-hidden="true"
      className={cn('page-deco pointer-events-none absolute text-brand', className)}
      data-deco-icon={iconName}
      data-parallax={parallax}
      style={style}
    />
  )
}

function resolveRandomIcon(seed: string): DecoIcon {
  let hashA = 0xdeadbeef
  let hashB = 0x41c6ce57

  for (let index = 0; index < seed.length; index += 1) {
    const code = seed.charCodeAt(index)

    hashA = Math.imul(hashA ^ code, 2654435761)
    hashB = Math.imul(hashB ^ code, 1597334677)
  }

  hashA =
    Math.imul(hashA ^ (hashA >>> 16), 2246822507) ^
    Math.imul(hashB ^ (hashB >>> 13), 3266489909)
  hashB =
    Math.imul(hashB ^ (hashB >>> 16), 2246822507) ^
    Math.imul(hashA ^ (hashA >>> 13), 3266489909)

  return decoIcons[(hashB >>> 0) % decoIcons.length]
}

export function getPageDecoIcons(count: number, seed: string): DecoIcon[] {
  const shuffled = [...decoIcons]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = hashSeed(`${seed}-${index}`) % (index + 1)
    const current = shuffled[index]

    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return Array.from({ length: count }, (_, index) => shuffled[index % shuffled.length])
}

function hashSeed(seed: string) {
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 2654435761)
  }

  return (hash ^ (hash >>> 16)) >>> 0
}
