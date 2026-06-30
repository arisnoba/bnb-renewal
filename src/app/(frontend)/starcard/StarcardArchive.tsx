import configPromise from '@payload-config'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload, type Where } from 'payload'
import React from 'react'

import { PageIntro } from '@/components/PageIntro'
import type { CenterSlug } from '@/lib/centers'
import type { Media as MediaType, StarCard } from '@/payload-types'

import { StarcardList, type StarcardListItem } from './StarcardList.client'

type StarcardArchiveProps = {
  center: CenterSlug
}

export async function StarcardArchive({ center }: StarcardArchiveProps) {
  const starcards = await queryStarcards(center)
  const items = starcards.map(toStarcardListItem)

  return (
    <main className="page page-light page-starcard page-top-offset" data-center={center}>
      <section className="section-starcard-list section-p-block-base min-h-screen">
        <div className="container">
          <header className="section-starcard-list__head grid gap-12 lg:grid-cols-[minmax(0,620px)_1fr] lg:items-start">
            <div>
              <PageIntro
                description="배우앤배움 스타카드는 수강생들의 편의를 위해 헬스, 뷰티, 병원, 레스토랑 등 배우앤배움과 제휴를 맺은 다양한 편의시설의 할인 또는 추가혜택을 누리실 수 있는 배우앤배움 멤버쉽 서비스입니다. 스타카드는 수강생의 이름, 사용기한, 고유번호가 개별적으로 부여되며, 배우앤배움 아트센터의 수강기간동안 무제한으로 사용이 가능합니다."
                descriptionClassName="section-starcard-list__description"
                eyebrow="스타카드 멤버쉽서비스"
                eyebrowClassName="section-starcard-list__eyebrow"
                title="배우앤배움 스타카드"
                titleClassName="section-starcard-list__title"
              />
              <div className="section-starcard-list__actions mt-10 flex flex-wrap gap-2">
                <Link
                  className="section-starcard-list__partnership-link inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 type-label-m font-bold leading-none text-background transition-colors hover:bg-brand hover:text-white"
                  href={`/${center}/faq?category=starcard`}
                >
                  스타카드 FAQ
                  <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
                </Link>
                <Link
                  className="section-starcard-list__faq-link inline-flex h-10 items-center justify-center rounded-full border border-foreground/15 px-5 type-label-m font-bold leading-none text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                  href={`/${center}/consult?inquiryType=partnership#partnership`}
                >
                  제휴문의
                  <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
                </Link>
              </div>
            </div>

            <div className="section-starcard-list__hero-card hidden justify-center lg:flex">
              <Image
                alt="배우앤배움 스타카드"
                className="h-auto w-[220px] rounded-[14px] shadow-[0_24px_80px_color-mix(in_srgb,var(--brand)_32%,transparent)] bg-neutral-200"
                height={640}
                priority
                // src="/assets/common/starcard.png"
                src="/assets/common/starcard.svg"
                width={400}
              />
            </div>
          </header>
        </div>

        <div className="container mt-24 md:mt-[132px]">
          <div className="section-starcard-list__summary mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="m-0 type-headline-s font-extrabold leading-[1.4] tracking-normal text-foreground">
              스타카드 제휴업체
            </h2>
            <p className="m-0 type-body-s leading-[1.6] text-muted-foreground">
              해당 제휴업체를 클릭하시면 할인율과 위치 등 상세한 정보를 보실 수 있습니다.
            </p>
          </div>

          {items.length > 0 ? (
            <StarcardList center={center} items={items} />
          ) : (
            <div className="section-starcard-list__empty py-16 text-center type-body-m text-muted-foreground">
              등록된 스타카드 제휴업체가 없습니다.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

async function queryStarcards(center: CenterSlug) {
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
      collection: 'star-cards',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: 'displayOrder',
      where,
    })
    .catch(() => ({
      docs: [],
    }))

  return result.docs as StarCard[]
}

function toStarcardListItem(starcard: StarCard): StarcardListItem {
  return {
    body: starcard.body ?? null,
    category: starcard.category ?? null,
    discountRate: starcard.discountRate ?? null,
    id: starcard.id,
    image: firstStarcardImage(starcard),
    images: starcardImages(starcard),
    mapUrl: starcard.mapUrl ?? null,
    title: starcard.title,
  }
}

function firstStarcardImage(starcard: StarCard): MediaType | null {
  return starcardImages(starcard)[0] ?? null
}

function starcardImages(starcard: StarCard): MediaType[] {
  return (
    starcard.bodyImages
      ?.map((item) => item.imageMedia)
      .filter((media): media is MediaType => Boolean(media && typeof media === 'object')) ?? []
  )
}
