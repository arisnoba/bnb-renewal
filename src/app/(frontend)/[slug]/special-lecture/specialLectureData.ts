import type { Payload, Where } from 'payload'

const ITEMS_PER_PAGE = 16

export function specialLecturesWhere(): Where {
  return {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      {
        centers: {
          contains: 'highteen',
        },
      },
    ],
  }
}

export function findSpecialLectures({
  page,
  payload,
}: {
  page: number
  payload: Payload
}) {
  return payload.find({
    collection: 'highteen-special-classes',
    depth: 1,
    limit: ITEMS_PER_PAGE,
    overrideAccess: false,
    page,
    select: {
      publishedAt: true,
      slug: true,
      thumbnailMedia: true,
      title: true,
      youtubeUrl: true,
    },
    sort: '-publishedAt',
    where: specialLecturesWhere(),
  })
}
