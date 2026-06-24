import configPromise from '@payload-config'
import { getPayload } from 'payload'

const centers = [
  { label: '아트센터', value: 'art' },
  { label: '입시센터', value: 'exam' },
  { label: '키즈센터', value: 'kids' },
  { label: '하이틴센터', value: 'highteen' },
  { label: '애비뉴센터', value: 'avenue' },
] as const

const youtubeUrls = [
  'https://www.youtube.com/watch?v=FxgC54XGyJI',
  'https://www.youtube.com/watch?v=xHc5jnHgW0s',
  'https://www.youtube.com/watch?v=HfW1PqXXeys',
  'https://www.youtube.com/watch?v=1b4Pk4338aI',
  'https://www.youtube.com/watch?v=YiTn4F3ai7A',
  'https://www.youtube.com/watch?v=lHl7DjvDWO8',
  'https://www.youtube.com/watch?v=ReFT7am4Giw',
  'https://www.youtube.com/watch?v=dJxi3yD2rPw',
  'https://www.youtube.com/watch?v=AhTml-Cyjd0',
  'https://www.youtube.com/watch?v=l7Mx4BLIopM',
  'https://www.youtube.com/watch?v=7QX2hD5IO0Y',
  'https://www.youtube.com/watch?v=l9fQWJgRmxU',
  'https://www.youtube.com/watch?v=mf6AOHCGKYw',
  'https://www.youtube.com/watch?v=1X2gpxE909I',
  'https://www.youtube.com/watch?v=TiRtMnd_rY4',
  'https://www.youtube.com/watch?v=EafArR6gnIs',
  'https://www.youtube.com/watch?v=DdS1FqFxLQY',
  'https://www.youtube.com/watch?v=Yb8jBekPupI',
  'https://www.youtube.com/watch?v=CtvyTHc7Y5U',
  'https://www.youtube.com/watch?v=H0xbAuZP31c',
  'https://www.youtube.com/watch?v=4b2kSjo1vZQ',
  'https://www.youtube.com/watch?v=ZS4XQSy_Mnc',
  'https://www.youtube.com/watch?v=91GSk8cB6FQ',
  'https://www.youtube.com/watch?v=9bZkp7q19f0',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
]

function mockRows() {
  return centers.flatMap((center, centerIndex) =>
    Array.from({ length: 5 }, (_, itemIndex) => {
      const index = centerIndex * 5 + itemIndex
      const externalUrl = youtubeUrls[index]

      return {
        center: center.value,
        displayStatus: 'published' as const,
        externalUrl,
        snsType: 'youtube' as const,
        title: `[SNS 목업] ${center.label} ${itemIndex + 1}`,
      }
    }),
  )
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  let created = 0
  let updated = 0

  try {
    for (const row of mockRows()) {
      const existing = await payload.find({
        collection: 'social-links',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          title: {
            equals: row.title,
          },
        },
      })

      if (existing.docs[0]) {
        await payload.update({
          collection: 'social-links',
          data: row,
          depth: 0,
          id: existing.docs[0].id,
          overrideAccess: true,
        })
        updated += 1
      } else {
        await payload.create({
          collection: 'social-links',
          data: row,
          depth: 0,
          overrideAccess: true,
        })
        created += 1
      }
    }

    const counts = await payload.find({
      collection: 'social-links',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      where: {
        title: {
          like: '[SNS 목업]',
        },
      },
    })

    const byCenter = centers.map((center) => ({
      center: center.value,
      count: counts.docs.filter((doc) => doc.center === center.value).length,
    }))

    console.log(JSON.stringify({ byCenter, created, updated }, null, 2))
  } finally {
    await payload.destroy()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
