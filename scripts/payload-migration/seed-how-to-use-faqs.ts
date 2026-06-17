import { getPayloadClient } from '../../src/lib/payload'

type PayloadDoc = Record<string, unknown>
type PayloadWhere = Record<string, unknown>

type DynamicPayload = {
  create: (args: {
    collection: string
    data: PayloadDoc
    overrideAccess: boolean
  }) => Promise<unknown>
  find: (args: {
    collection: string
    depth: number
    limit: number
    overrideAccess: boolean
    where: PayloadWhere
  }) => Promise<{ docs: { id: number | string }[] }>
  update: (args: {
    collection: string
    data: PayloadDoc
    id: number | string
    overrideAccess: boolean
  }) => Promise<unknown>
  destroy?: () => Promise<void>
}

const publishedAt = '2026-06-17T00:00:00.000Z'

const howToUseFaqs: PayloadDoc[] = [
  {
    answerMode: 'shared',
    authorName: '배우앤배움 전체 센터',
    category: 'etc',
    centers: ['all'],
    displayOrder: 901,
    displayStatus: 'published',
    publishedAt,
    sharedAnswer: [
      '스타카드 소지자는 휴메이크 휘트니스 논현점을 이용할 수 있습니다.',
      '방문 시 프런트에서 스타카드와 본인 확인 후 이용합니다.',
      '이용 가능 시간은 평일 06:00-24:00, 주말 및 공휴일 08:00-20:00이며 둘째, 넷째 주 일요일은 휴무입니다.',
      '위치는 서울시 강남구 강남대로 546 지하 2층이며, 논현역 2번 출구 인근입니다.',
    ].join('\n'),
    slug: 'how-to-use-fitness',
    title: '전용 피트니스는 어떻게 이용하나요?',
    variants: [],
  },
  {
    answerMode: 'shared',
    authorName: '배우앤배움 전체 센터',
    category: 'etc',
    centers: ['all'],
    displayOrder: 902,
    displayStatus: 'published',
    publishedAt,
    sharedAnswer: [
      '아트센터는 운영시간 이후에도 지문 인식을 통해 출입할 수 있도록 운영됩니다.',
      '기본 운영시간은 평일 09:00-22:00, 주말 10:00-18:00입니다.',
      '지문 등록은 최초 신규 등록 과정에서 진행되며 휴학 중에도 유지됩니다.',
      '퇴교 시 등록된 지문 정보는 자동으로 삭제됩니다.',
    ].join('\n'),
    slug: 'how-to-use-security',
    title: '운영시간 이후에도 연습실을 이용할 수 있나요?',
    variants: [],
  },
  {
    answerMode: 'shared',
    authorName: '배우앤배움 전체 센터',
    category: 'etc',
    centers: ['all'],
    displayOrder: 903,
    displayStatus: 'published',
    publishedAt,
    sharedAnswer: [
      '개인연습실은 1-2인실, 2-3인실 규모로 나뉘어져 있습니다.',
      '그룹스터디룸은 최대 10명까지 이용할 수 있어 반별 과제나 회의 등 공동체 소모임에 적합합니다.',
      '개인연습실과 그룹스터디룸 모두 배우앤배움 재학생이라면 별도 예약 없이 자유롭게 이용할 수 있습니다.',
    ].join('\n'),
    slug: 'how-to-use-practice-room',
    title: '개인연습실과 그룹스터디룸은 예약해야 하나요?',
    variants: [],
  },
  {
    answerMode: 'shared',
    authorName: '배우앤배움 전체 센터',
    category: 'etc',
    centers: ['all'],
    displayOrder: 904,
    displayStatus: 'published',
    publishedAt,
    sharedAnswer: [
      '배배대본은 배우앤배움 아트센터 교육팀이 매주 토요일마다 새로 준비하는 오디션용 대본입니다.',
      '드라마와 영화 시나리오 중 독백 연기와 2인극 연기 대본으로 구성되며, 최근 오디션이 진행 중인 작품의 대본도 포함됩니다.',
      '주중 아트센터 1층 안내데스크 직원에게 배배대본을 요청해 받아가시면 됩니다.',
    ].join('\n'),
    slug: 'how-to-use-weekly-script',
    title: '배배대본은 언제 어디서 받을 수 있나요?',
    variants: [],
  },
  {
    answerMode: 'shared',
    authorName: '배우앤배움 전체 센터',
    category: 'etc',
    centers: ['all'],
    displayOrder: 905,
    displayStatus: 'published',
    publishedAt,
    sharedAnswer: [
      '씨네21 매거진은 배우앤배움 아트센터 재학생과 Staff가 이용할 수 있습니다.',
      '1층 안내데스크와 2층 서재 공간에서 확인할 수 있으며, 과월호도 함께 비치합니다.',
      '매거진은 배우앤배움 아트센터 원내에서 이용할 수 있습니다.',
    ].join('\n'),
    slug: 'how-to-use-cine21',
    title: '씨네21 잡지는 누가 어디서 이용할 수 있나요?',
    variants: [],
  },
]

async function upsertFaq(payload: DynamicPayload, doc: PayloadDoc) {
  const existing = await payload.find({
    collection: 'faqs',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      slug: {
        equals: doc.slug,
      },
    },
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'faqs',
      data: doc,
      id: existing.docs[0].id,
      overrideAccess: true,
    })

    return 'updated'
  }

  await payload.create({
    collection: 'faqs',
    data: doc,
    overrideAccess: true,
  })

  return 'created'
}

async function main() {
  const payload = (await getPayloadClient()) as unknown as DynamicPayload
  const summary = {
    created: 0,
    total: howToUseFaqs.length,
    updated: 0,
  }

  for (const doc of howToUseFaqs) {
    const result = await upsertFaq(payload, doc)
    summary[result === 'created' ? 'created' : 'updated'] += 1
  }

  console.log(JSON.stringify(summary, null, 2))
  await payload.destroy?.()
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
