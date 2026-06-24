import type { Media, SocialLink } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { youtubeThumbnailUrl } from '@/lib/youtube'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export const SOCIAL_LINKS_LIMIT = 20

type SocialLinksFindOptions = {
  collection: 'social-links'
  depth: 1
  limit: typeof SOCIAL_LINKS_LIMIT
  overrideAccess: false
  pagination: false
  sort: '-createdAt'
  where: {
    center: {
      equals: CenterSlug
    }
    displayStatus: {
      equals: 'published'
    }
  }
}

export function buildSocialLinksFindOptions(center: CenterSlug): SocialLinksFindOptions {
  return {
    collection: 'social-links',
    depth: 1,
    limit: SOCIAL_LINKS_LIMIT,
    overrideAccess: false,
    pagination: false,
    sort: '-createdAt',
    where: {
      center: {
        equals: center,
      },
      displayStatus: {
        equals: 'published',
      },
    },
  }
}

function isMedia(value: SocialLink['representativeImage']): value is Media {
  return Boolean(value && typeof value === 'object')
}

function socialLinkImageUrl(link: SocialLink) {
  if (link.snsType === 'youtube') {
    return youtubeThumbnailUrl(link.externalUrl)
  }

  const media = link.representativeImage

  if (isMedia(media)) {
    return getMediaUrl(
      media.url || (media.filename ? `/media/${media.filename}` : ''),
      media.updatedAt,
    )
  }

  return ''
}

function socialLinkAlt(link: SocialLink) {
  const media = link.representativeImage

  if (isMedia(media) && media.alt) {
    return media.alt
  }

  return link.title || 'SNS 링크'
}

function externalHref(link: SocialLink) {
  return typeof link.externalUrl === 'string' ? link.externalUrl.trim() : ''
}

export function visibleSocialLinks(links: SocialLink[]) {
  return links
    .map((link) => ({
      alt: socialLinkAlt(link),
      href: externalHref(link),
      id: link.id,
      imageUrl: socialLinkImageUrl(link),
      title: link.title,
    }))
    .filter((link) => link.href && link.imageUrl)
}

export function SocialLinksList({ links }: { links: SocialLink[] }) {
  const visibleLinks = visibleSocialLinks(links)

  if (visibleLinks.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="social-links-heading" className="container mt-16 md:mt-24">
      <h2 className="sr-only" id="social-links-heading">
        SNS 링크
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleLinks.map((link) => (
          <a
            aria-label={link.title || link.alt}
            className="group block overflow-hidden rounded-lg bg-neutral-100 outline-none ring-neutral-950/20 transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2"
            href={link.href}
            key={link.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Payload media can be local or R2, matching the banner media URL path. */}
            <img
              alt={link.alt}
              className="aspect-[16/9] h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              src={link.imageUrl}
            />
          </a>
        ))}
      </div>
    </section>
  )
}

const querySocialLinks = cache(async (center: CenterSlug) => {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find(buildSocialLinksFindOptions(center))

    return result.docs as SocialLink[]
  } catch {
    return []
  }
})

export async function SocialLinksSection({ center }: { center: CenterSlug }) {
  const links = await querySocialLinks(center)

  return <SocialLinksList links={links} />
}
