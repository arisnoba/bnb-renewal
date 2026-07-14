import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Payload, type Where } from 'payload'
import Link from 'next/link'
import React from 'react'

import { PageIntro } from '@/components/PageIntro'
import type { CenterSlug } from '@/lib/centers'
import { getCenterLabel } from '@/lib/centers'
import type { Faq } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

import { FaqArchiveClient, type FaqCategoryTab } from './FaqArchive.client'

const categoryOrder = [
  'admission',
  'class',
  'tuition',
  'casting',
  'exam',
  'starcard',
  'etc',
] as const

const categoryLabels = {
  admission: '입학/상담',
  class: '수업/과정',
  tuition: '수강료/할인',
  casting: '캐스팅/프로필',
  exam: '입시',
  starcard: '스타카드',
  etc: '이용방법',
} satisfies Record<NonNullable<Faq['category']>, string>

type FaqCategory = keyof typeof categoryLabels

type FaqArchiveProps = {
  center: CenterSlug
}

export type FaqDisplayItem = {
  answer: string
  category: Faq['category']
  id: Faq['id']
  title: string
}

export async function FaqArchive({ center }: FaqArchiveProps) {
  const faqs = await getCachedFaqs(center)
  const displayFaqs = faqs
    .map((faq) => faqDisplayForCenter(faq, center))
    .filter((item): item is FaqDisplayItem => Boolean(item))
  const categoryCounts = getCategoryCounts(displayFaqs)
  const categoryTabs = getCategoryTabs(categoryCounts)
  const faqJsonLd = buildFaqJsonLd({ center, faqs: displayFaqs })

  return (
    <>
      {faqJsonLd && (
        <script
          dangerouslySetInnerHTML={{ __html: toSafeJsonLd(faqJsonLd) }}
          type="application/ld+json"
        />
      )}
      <main className="page page-light page-faq page-top-offset" data-center={center}>
        <section className="section-faq-list section-p-block-base" aria-labelledby="faq-list-title">
          <div className="container-sm">
            <PageIntro
              className="section-faq-list__head"
              description={(
                <>
                {/* <p className="section-faq-list__description-title">자주묻는 질문과 답변입니다.</p> */}
                <p className="type-body-m leading-normal">
                  더 궁금한 점이 있으시면 <Link href={`/${center}/consult`} className="text-brand hover:underline">
                    CS상담센터에 문의
                  </Link>
                  바랍니다.
                </p>
                </>
              )}
              descriptionClassName="section-faq-list__description"
              eyebrow="자주하는 질문"
              eyebrowClassName="section-faq-list__eyebrow"
              id="faq-list-title"
              title={'배우앤배움 FAQ입니다.\n궁금한 내용을 확인해보세요.'}
              titleClassName="section-faq-list__title"
            />

            <FaqArchiveClient
              categoryTabs={categoryTabs}
              center={center}
              faqs={displayFaqs}
              totalCount={displayFaqs.length}
            />
          </div>
        </section>
      </main>
    </>
  )
}

function getCachedFaqs(center: CenterSlug) {
  return unstable_cache(() => queryFaqs(center), ['frontend-faqs', center], {
    revalidate: 600,
    tags: [`frontend_faqs_${center}`],
  })()
}

async function queryFaqs(center: CenterSlug) {
  const payload = await getPayload({ config: configPromise })

  return findFaqs({ center, payload })
}

export async function findFaqs({
  center,
  payload,
}: {
  center: CenterSlug
  payload: Payload
}) {
  const where: Where = {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      {
        or: [
          {
            centers: {
              contains: center,
            },
          },
          {
            centers: {
              contains: 'all',
            },
          },
        ],
      },
    ],
  }

  const result = await payload.find({
    collection: 'faqs',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    sort: ['createdAt', 'id'],
    where,
  })

  return result.docs as Faq[]
}

function faqDisplayForCenter(faq: Faq, center: CenterSlug): FaqDisplayItem | null {
  if (faq.answerMode !== 'centerVariants') {
    const answer = faq.sharedAnswer?.trim()

    return answer
      ? {
          answer,
          category: faq.category,
          id: faq.id,
          title: faq.title,
        }
      : null
  }

  const variant = faq.variants?.find((item) => variantMatchesCenter(item, center))
  const answer = variant?.answer?.trim()

  return answer
    ? {
        answer,
        category: faq.category,
        id: faq.id,
        title: variant?.questionOverride?.trim() || faq.title,
      }
    : null
}

function variantMatchesCenter(
  variant: NonNullable<Faq['variants']>[number],
  center: CenterSlug,
) {
  if (center === 'art') {
    return variant.centerArt
  }
  if (center === 'exam') {
    return variant.centerExam
  }
  if (center === 'kids') {
    return variant.centerKids
  }
  if (center === 'highteen') {
    return variant.centerHighteen
  }

  return variant.centerAvenue
}

function getCategoryCounts(faqs: FaqDisplayItem[]) {
  return faqs.reduce(
    (counts, faq) => {
      if (faq.category) {
        counts[faq.category] += 1
      }

      return counts
    },
    Object.fromEntries(categoryOrder.map((category) => [category, 0])) as Record<
      FaqCategory,
      number
    >,
  )
}

function getCategoryTabs(categoryCounts: Record<FaqCategory, number>): FaqCategoryTab[] {
  return categoryOrder
    .filter((category) => categoryCounts[category] > 0)
    .map((category) => ({
      count: categoryCounts[category],
      label: categoryLabels[category],
      value: category,
    }))
}

function buildFaqJsonLd({ center, faqs }: { center: CenterSlug; faqs: FaqDisplayItem[] }) {
  if (faqs.length === 0) {
    return null
  }

  const pageUrl = `${getServerSideURL().replace(/\/+$/, '')}/${center}/faq`
  const centerLabel = getCenterLabel(center)

  return {
    '@context': 'https://schema.org',
    '@id': `${pageUrl}#faqpage`,
    '@type': 'FAQPage',
    inLanguage: 'ko-KR',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      acceptedAnswer: {
        '@type': 'Answer',
        text: toFaqAnswerSchemaText(faq.answer),
      },
      name: faq.title,
    })),
    name: `${centerLabel} 자주하는 질문`,
    url: pageUrl,
  }
}

function toFaqAnswerSchemaText(value: string) {
  return value
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '$1')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^:?-{3,}:?$/.test(line.replace(/\|/g, '').trim()))
    .map((line) => line.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim())
    .join('\n')
}

function toSafeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
