import fs from 'node:fs/promises'
import path from 'node:path'

import { getPayloadClient } from '../../src/lib/payload'

type Center = 'art' | 'exam' | 'highteen' | 'kids' | 'avenue'

type MarkdownFaq = {
  centers: Center[]
  displayOrder: number
  question: string
  sections: MarkdownFaqSection[]
  tags: string[]
}

type MarkdownFaqSection = {
  answer: string
  centers: Center[]
  sourceQuestion?: string
}

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

const reportPath = path.join(
  process.cwd(),
  'docs/reports/center-faq-crawl-2026-05-18.md',
)

const centerByHeading: Record<string, Center | undefined> = {
  아트센터: 'art',
  입시센터: 'exam',
  하이틴센터: 'highteen',
  키즈센터: 'kids',
  애비뉴센터: 'avenue',
}

const allCenters: Center[] = ['art', 'exam', 'highteen', 'kids', 'avenue']

function parseInlineCodeValues(line: string): string[] {
  return [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1])
}

function parseCenters(line: string): Center[] {
  return parseInlineCodeValues(line).filter((value): value is Center =>
    allCenters.includes(value as Center),
  )
}

function parseTextValue(line: string) {
  return line.replace(/^- [^:]+:\s*/, '').trim()
}

function slugForOrder(order: number) {
  return `faq-${String(order).padStart(2, '0')}`
}

function categoryForFaq(faq: MarkdownFaq) {
  const question = faq.question

  if (faq.tags.includes('스타카드')) {
    return 'starcard'
  }

  if (/수강료|할인|비용|금액/.test(question)) {
    return 'tuition'
  }

  if (/입시|연극영화과|내신|실기|주말입시|예비입시/.test(question)) {
    return 'exam'
  }

  if (/캐스팅|오디션|프로필|엔터테인먼트|출연|배우/.test(question)) {
    return 'casting'
  }

  if (/수업|반배정|승급|선생님|연습실|Class|요일|시간/.test(question)) {
    return 'class'
  }

  if (/입학|테스트|처음|나이|수강/.test(question)) {
    return 'admission'
  }

  return 'etc'
}

function extractLine(block: string, prefix: string) {
  return block
    .split('\n')
    .find((line) => line.trim().startsWith(prefix))
    ?.trim()
}

function splitFaqBlocks(markdown: string) {
  const matches = [...markdown.matchAll(/^### FAQ-(\d+)\. (.+)$/gm)]

  return matches.map((match, index) => {
    const start = match.index ?? 0
    const end = matches[index + 1]?.index ?? markdown.length

    return {
      block: markdown.slice(start, end).trim(),
      displayOrder: Number(match[1]),
      title: match[2].trim(),
    }
  })
}

function splitSectionBlocks(block: string) {
  const matches = [...block.matchAll(/^#### (.+)$/gm)]

  return matches.map((match, index) => {
    const start = match.index ?? 0
    const end = matches[index + 1]?.index ?? block.length

    return {
      block: block.slice(start, end).trim(),
      heading: match[1].trim(),
    }
  })
}

function parseFaqSection(block: string, fallbackCenters: Center[]): MarkdownFaqSection {
  const lines = block.split('\n')
  const heading = lines[0].replace(/^#### /, '').trim()
  const sourceCenter = centerByHeading[heading]
  let sourceQuestion: string | undefined
  let answerStartIndex = 1
  let inSourceUrls = false

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trim()

    if (!line) {
      continue
    }

    if (line.startsWith('- sourceUrls:')) {
      inSourceUrls = true
      continue
    }

    if (inSourceUrls && /^-\s+https?:\/\//.test(line)) {
      continue
    }
    inSourceUrls = false

    if (line.startsWith('- sourceCenter:')) {
      continue
    }

    if (line.startsWith('- sourceUrl:')) {
      continue
    }

    if (line.startsWith('- sourceOrder:')) {
      continue
    }

    if (line.startsWith('- sourceQuestion:')) {
      sourceQuestion = parseTextValue(line)
      continue
    }

    answerStartIndex = index
    break
  }

  const answer = lines
    .slice(answerStartIndex)
    .join('\n')
    .trim()

  return {
    answer,
    centers: sourceCenter ? [sourceCenter] : fallbackCenters,
    sourceQuestion,
  }
}

function parseFaqs(markdown: string): MarkdownFaq[] {
  return splitFaqBlocks(markdown).map(({ block, displayOrder, title }) => {
    const question =
      extractLine(block, '- canonicalQuestion:')?.replace(/^- canonicalQuestion:\s*/, '').trim() ??
      title
    const centersLine = extractLine(block, '- centers:')
    const tagsLine = extractLine(block, '- tags:')
    const centers = centersLine ? parseCenters(centersLine) : []
    const tags = tagsLine ? parseInlineCodeValues(tagsLine) : []
    const sectionBlocks = splitSectionBlocks(block)
    const sections = sectionBlocks.map((section) => parseFaqSection(section.block, centers))

    return {
      centers,
      displayOrder,
      question,
      sections,
      tags,
    }
  })
}

function variantData(section: MarkdownFaqSection) {
  const centers = new Set(section.centers)

  return {
    answer: normalizedAnswer(section),
    centerArt: centers.has('art'),
    centerAvenue: centers.has('avenue'),
    centerExam: centers.has('exam'),
    centerHighteen: centers.has('highteen'),
    centerKids: centers.has('kids'),
    questionOverride: section.sourceQuestion,
  }
}

function normalizedAnswer(section: MarkdownFaqSection) {
  const centers = new Set(section.centers)

  if (centers.has('art') && section.sourceQuestion === '수강료는 어떻게 되나요?') {
    return [
      '회 차 구성에 따라 금액에 차이가 있고 다음과 같습니다. 자세한 내용은 홈페이지 운영폴더 중 입학안내에 들어가시면 확인하실 수 있습니다.',
      '',
      '입학안내 바로가기 (/web/bbs/content.php?co_id=enterance)',
      '',
      '성인',
      '',
      '1년미만',
      '',
      '| 시간대별 | 월목 / 화금(주 2회) | 월/화/수/목/금/토/일(주 1회) |',
      '| --- | --- | --- |',
      '| 오전 | 522,500원 | 361,000원 |',
      '| 오후 | 550,000원 | 380,000원 |',
      '',
      '1년이상 (장학할인적용)',
      '',
      '| 시간대별 | 월목 / 화금(주 2회) | 월/화/수/목/금/토/일(주 1회) |',
      '| --- | --- | --- |',
      '| 오전 | 522,500원 | 361,000원 |',
      '| 오후 | 522,000원 | 361,000원 |',
      '',
      '2년이상 (장학할인적용)',
      '',
      '| 시간대별 | 월목 / 화금(주 2회) | 월/화/수/목/금/토/일(주 1회) |',
      '| --- | --- | --- |',
      '| 오전 | 495,000원 | 342,000원 |',
      '| 오후 | 495,000원 | 342,000원 |',
    ].join('\n')
  }

  if (centers.has('kids') && section.sourceQuestion === '수강료는 어떻게 되나요?') {
    return [
      '배우앤배움 키즈센터의 수강료는 다음과 같습니다. 자세한 내용은 홈페이지 운영폴더 중 입학안내에 들어가시면 확인하실 수 있습니다.',
      '',
      '그룹 레슨',
      '',
      '| 수업 요일 | 반편성 | 수업시간 (학부모 피드백 포함) | 수강료 | 수료생 (18개월) | 수료생 (30개월) |',
      '| --- | --- | --- | --- | --- | --- |',
      '| 화~일 (주1회) | 2-4명 | 2시간 | 40만원 | 38만원 | 36만원 |',
      '| 화~일 (주1회) | 4-6명 | 2시간 30분 | 40만원 | 38만원 | 36만원 |',
      '',
      '개인 레슨',
      '',
      '| 수업 방식 | 수업시간 (학부모 피드백 포함) | 수강료 | 수료생 (18개월) | 수료생 (30개월) |',
      '| --- | --- | --- | --- | --- |',
      '| 개인 | 1시간 30분 | 60만원 | 57만원 | 54만원 |',
      '',
      '입학안내 바로가기 (/web/bbs/content.php?co_id=enterance)',
    ].join('\n')
  }

  if (centers.has('art') && section.sourceQuestion === '수강료 할인을 받을 수 있는 방법이 있나요?') {
    return [
      '성인반',
      '',
      '| 적용대상 | 장학할인 | 중복할인 |',
      '| --- | --- | --- |',
      '| 오전 10:00 Class 수강생 | 해당 Class 5% 장학할인 | 불가 |',
      '| 1년 이상 재학한 수강생 | 전 Class 5% 장학할인 | 불가 |',
      '| 2년 이상 재학한 수강생 | 전 Class 10% 장학할인 | 불가 |',
      '',
      '※ 수업은 모든 클래스가 동일한 밀도로 진행됩니다. 배우앤배움은 배우로 전업한 수강생들이 많습니다. 이에 수강생들의 경제적 부분을 배려하여 오전 10시 클래스와 1년 이상 수강생들에게 장학혜택이 적용되고 있습니다. 또한, 추가수업을 원하는 경우에는 추가수업분에 한하여 40% 할인된 가격으로 중복 수강이 가능하도록 하였습니다. (2020년 1월 시행)',
      '',
      '수강료 안내 바로가기 (https://baewoo.co.kr/web/bbs/content.php?co_id=enter01)',
    ].join('\n')
  }

  if (centers.has('exam') && section.sourceQuestion === '내신등급이 어느정도 유지되어야 좋나요?') {
    return [
      '내신은 사실 좋으면 좋을수록 안정권에 든다고 볼 수 있습니다. 연극영화과 입시의 반영비율은 학교마다 조금씩 차이가 있지만 내신관리를 잘 해두시는게 좋습니다.',
      '',
      '| 실기 반영비율 | 내신(수능) 반영비율 |',
      '| --- | --- |',
      '| 60% | 40% |',
      '| 70% | 30% |',
      '| 80% | 20% |',
      '',
      '더 자세한 반영비율은 각 학교별 모집요강을 참조하시는게 더 정확합니다.',
    ].join('\n')
  }

  return section.answer
}

function payloadDoc(faq: MarkdownFaq): PayloadDoc {
  const hasSingleSharedSection =
    faq.sections.length === 1 && faq.sections[0].centers.length > 1
  const answerMode = hasSingleSharedSection ? 'shared' : 'centerVariants'

  return {
    answerMode,
    authorName: '배우앤배움 전체 센터',
    category: categoryForFaq(faq),
    centers: faq.centers,
    displayOrder: faq.displayOrder,
    displayStatus: 'draft',
    publishedAt: '2026-05-18T00:00:00.000Z',
    sharedAnswer: hasSingleSharedSection ? normalizedAnswer(faq.sections[0]) : undefined,
    slug: slugForOrder(faq.displayOrder),
    title: faq.question,
    variants: hasSingleSharedSection ? [] : faq.sections.map(variantData),
  }
}

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
  const markdown = await fs.readFile(reportPath, 'utf8')
  const faqs = parseFaqs(markdown)
  const payload = (await getPayloadClient()) as unknown as DynamicPayload
  const summary = {
    created: 0,
    shared: 0,
    total: faqs.length,
    updated: 0,
    variants: 0,
  }

  for (const faq of faqs) {
    const doc = payloadDoc(faq)
    const result = await upsertFaq(payload, doc)

    summary[result === 'created' ? 'created' : 'updated'] += 1
    summary.shared += doc.answerMode === 'shared' ? 1 : 0
    summary.variants += Array.isArray(doc.variants) ? doc.variants.length : 0
  }

  console.log(JSON.stringify(summary, null, 2))
  await payload.destroy?.()
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
