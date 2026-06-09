import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import Link from 'next/link'
import React from 'react'

import type { CenterSlug } from '@/lib/centers'
import type { Faq } from '@/payload-types'

import { FaqArchiveClient, type FaqCategoryTab } from './FaqArchive.client'
import PageClient from '../news/page.client'

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
  etc: '기타',
} satisfies Record<NonNullable<Faq['category']>, string>

type FaqCategory = keyof typeof categoryLabels

type FaqArchiveProps = {
  activeCategory?: string
  center: CenterSlug
}

export type FaqDisplayItem = {
  answer: string
  category: Faq['category']
  id: Faq['id']
  title: string
}

export async function FaqArchive({ activeCategory, center }: FaqArchiveProps) {
  const requestedCategory = normalizeCategory(activeCategory)
  const faqs = await queryFaqs(center)
  const displayFaqs = faqs
    .map((faq) => faqDisplayForCenter(faq, center))
    .filter((item): item is FaqDisplayItem => Boolean(item))
  const categoryCounts = getCategoryCounts(displayFaqs)
  const category = requestedCategory && categoryCounts[requestedCategory] > 0 ? requestedCategory : null
  const categoryTabs = getCategoryTabs(categoryCounts)
  const visibleFaqs = category
    ? displayFaqs.filter((item) => item.category === category)
    : [...displayFaqs].reverse()

  return (
    <main className="page page-light page-faq page-top-offset" data-center={center}>
      <PageClient />

      <section className="section-faq-list section-p-block-base" aria-labelledby="faq-list-title">
        <div className="container-sm">
          <div className="section-faq-list__head page-heading">
            <p className="section-faq-list__eyebrow page-eyebrow">자주하는 질문</p>
            <h1 id="faq-list-title" className="section-faq-list__title page-title">
              배우앤배움 FAQ입니다.
              <br />
              궁금한 내용을 확인해보세요.
            </h1>
            <div className="section-faq-list__description page-description">
              {/* <p className="section-faq-list__description-title">자주묻는 질문과 답변입니다.</p> */}
              <p>
                더 궁금한 점이 있으시면 <Link href={'/consult'} className="text-brand hover:underline">
                  CS상담센터에 문의
                </Link>
                바랍니다.
              </p>
            </div>
          </div>

          <FaqArchiveClient
            activeCategory={category}
            categoryTabs={categoryTabs}
            center={center}
            faqs={visibleFaqs}
            totalCount={displayFaqs.length}
          />
        </div>
      </section>
    </main>
  )
}

async function queryFaqs(center: CenterSlug) {
  const payload = await getPayload({ config: configPromise })
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

  const result = await payload
    .find({
      collection: 'faqs',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      sort: 'displayOrder',
      where,
    })
    .catch(() => ({
      docs: [],
    }))

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

function normalizeCategory(value: string | undefined): FaqCategory | null {
  return value && value in categoryLabels ? (value as FaqCategory) : null
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
