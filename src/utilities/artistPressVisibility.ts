import type { Where } from 'payload'

import type { CenterSlug } from '@/lib/centers'

export function publishedArtistPressWhere(center?: CenterSlug): Where {
  return {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      ...(center
        ? [
            {
              or: artistPressVisibleCenters(center).map((visibleCenter) => ({
                centers: {
                  contains: visibleCenter,
                },
              })),
            },
          ]
        : []),
    ],
  }
}

function artistPressVisibleCenters(center: CenterSlug) {
  if (center === 'art') {
    return ['art', 'all'] as const
  }

  return [center, 'all', 'art'] as const
}
