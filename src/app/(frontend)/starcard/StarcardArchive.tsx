import configPromise from '@payload-config'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getPayload, type Where } from 'payload'
import React from 'react'

import type { CenterSlug } from '@/lib/centers'
import type { Media as MediaType, StarCard } from '@/payload-types'

import { StarcardList, type StarcardListItem } from './StarcardList.client'
import PageClient from '../news/page.client'

type StarcardArchiveProps = {
  center: CenterSlug
}

export async function StarcardArchive({ center }: StarcardArchiveProps) {
  const starcards = await queryStarcards(center)
  const items = starcards.map(toStarcardListItem)

  return (
    <main className="page-static page-static--starcard bg-background text-foreground" data-center={center}>
      <PageClient />

      <section className="section-starcard-list min-h-screen py-20 md:py-[120px]">
        <div className="container">
          <header className="section-starcard-list__head grid gap-12 lg:grid-cols-[minmax(0,620px)_1fr] lg:items-start">
            <div>
              <p className="section-starcard-list__eyebrow m-0 text-xl font-bold leading-[1.4] text-brand">
                스타카드 멤버쉽서비스
              </p>
              <h1 className="section-starcard-list__title mt-12 text-[34px] font-extrabold leading-[1.35] tracking-normal text-foreground md:text-[48px]">
                배우앤배움 스타카드
              </h1>
              <p className="section-starcard-list__description mt-14 max-w-[620px] text-base leading-relaxed text-muted-foreground">
                배우앤배움 스타카드는 수강생들의 편의를 위해 헬스, 뷰티, 병원,
                레스토랑 등 배우앤배움과 제휴를 맺은 다양한 편의시설의 할인 또는
                추가혜택을 누리실 수 있는 배우앤배움 멤버쉽 서비스입니다.
                스타카드는 수강생의 이름, 사용기한, 고유번호가 개별적으로 부여되며,
                배우앤배움 아트센터의 수강기간동안 무제한으로 사용이 가능합니다.
              </p>
              <div className="section-starcard-list__actions mt-10 flex flex-wrap gap-3">
                <Link
                  className="section-starcard-list__faq-link inline-flex h-[43px] items-center justify-center rounded-full border border-foreground/15 px-5 text-sm font-bold leading-none text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                  href={`/${center}/faq?category=starcard`}
                >
                  스타카드 FAQ
                  <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
                </Link>
                <Link
                  className="section-starcard-list__partnership-link inline-flex h-[43px] items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold leading-none text-background transition-colors hover:bg-brand hover:text-white"
                  href="/consult?inquiryType=partnership#partnership"
                >
                  제휴문의
                  <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
                </Link>
              </div>
            </div>

            <div className="section-starcard-list__hero-card hidden justify-center lg:flex">
              <div className="relative h-[342px] w-[220px] rounded-[14px] border border-white/35 bg-neutral-950 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
                <div className="h-full w-full overflow-hidden rounded-[10px] bg-[linear-gradient(140deg,#e72f77_0%,#f46c47_36%,#f2a13d_50%,#f35c63_70%,#b74288_100%)]">
                  <div className="flex h-full items-center px-8">
                    <span className="text-xl font-black tracking-normal text-black">BNB</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>

        <div className="container mt-24 md:mt-[132px]">
          <div className="section-starcard-list__summary mb-10 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,480px)] md:items-end">
            <h2 className="m-0 text-[24px] font-extrabold leading-[1.4] tracking-normal text-foreground">
              스타카드 제휴업체
            </h2>
            <p className="m-0 text-sm font-bold leading-[1.6] text-muted-foreground">
              해당 제휴업체를 클릭하시면 할인율과 위치 등 상세한 정보를 보실 수 있습니다.
            </p>
          </div>

          {items.length > 0 ? (
            <StarcardList items={items} />
          ) : (
            <div className="section-starcard-list__empty py-16 text-center text-base font-bold text-muted-foreground">
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
    discountRate: starcard.discountRate ?? null,
    id: starcard.id,
    image: firstStarcardImage(starcard),
    mapUrl: starcard.mapUrl ?? null,
    title: starcard.title,
  }
}

function firstStarcardImage(starcard: StarCard): MediaType | null {
  const media = starcard.bodyImages?.find((item) => typeof item.imageMedia === 'object')?.imageMedia

  return media && typeof media === 'object' ? media : null
}
