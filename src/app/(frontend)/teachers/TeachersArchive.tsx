import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import type { CenterSlug } from '@/lib/centers'
import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import React from 'react'

import { TeachersGrid } from './TeachersGrid.client'

const MAX_TEACHERS_TO_RENDER = 1000

type TeachersArchiveProps = {
  center: CenterSlug
}

export async function TeachersArchive({ center }: TeachersArchiveProps) {
  const payload = await getPayload({ config: configPromise })
  const decoIcons = getPageDecoIcons(3, `teachers-${center}`)
  const where: Where = {
    and: [
      {
        status: {
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

  const teachers = await payload
    .find({
      collection: 'teachers',
      depth: 1,
      limit: MAX_TEACHERS_TO_RENDER,
      overrideAccess: false,
      pagination: false,
      select: {
        name: true,
        profileImageMedia: true,
        role: true,
        slug: true,
      },
      sort: 'displayOrder',
      where,
    })
    .catch(() => ({
      docs: [],
    }))

  return (
    <main className="page page-dark page-teachers-archive" data-center={center}>
      <section
        className="section-teachers-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        aria-labelledby="teachers-hero-title"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-55 grayscale"
          style={{ backgroundImage: "url('/assets/rookies/hero.png')" }}
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[22%] md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="-right-16 bottom-[18%] md:-right-24"
          icon={decoIcons[1]}
        />
        <div className="container relative flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1
            id="teachers-hero-title"
            className="page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
          >
            <span className="block text-brand">교육</span>
            <span className="block">교육진 소개</span>
          </h1>
        </div>
      </section>

      <section
        className="section-teachers-list section-p-block-base relative overflow-hidden bg-[#0C0C0C] text-white"
        aria-labelledby="teachers-list-title"
      >
        <PageDeco
          className="right-[-120px] top-20 hidden md:block"
          icon={decoIcons[2]}
        />

        <div className="container relative z-10 max-w-[1120px]">
          <header className="section-teachers-list__head mb-16 md:mb-[100px]">
            <p className="section-teachers-list__eyebrow type-title-s mb-8 font-bold leading-[1.4] text-brand md:mb-10">
              교육진 소개
            </p>
            <h2
              id="teachers-list-title"
              className="section-teachers-list__title type-display-m font-extrabold leading-[1.35] text-white md:type-display-l"
            >
              훌륭한 스승을 만나는 것이
              <br />
              배움의 첫 시작입니다.
            </h2>
            <p className="section-teachers-list__description mt-8 type-body-m leading-[1.7] text-white/50 md:mt-10">
              배우앤배움의 모든 교육진은 현재 드라마, 영화 등
              <br className="hidden md:block" />
              메이저채널에서 작품활동을 하시는 배우분들로 구성되어 있습니다.
            </p>
          </header>

          {teachers.docs.length === 0 ? (
            <p className="section-teachers-list__empty border-y border-white/10 py-18 text-center type-title-s font-semibold text-white/50">
              등록된 교육진이 없습니다.
            </p>
          ) : (
            <TeachersGrid
              center={center}
              teachers={teachers.docs}
            />
          )}
        </div>
      </section>
    </main>
  )
}
