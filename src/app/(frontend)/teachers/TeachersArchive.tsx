import { getEducationHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
import { PageIntro } from '@/components/PageIntro'
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
        className="section-teachers-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        aria-labelledby="teachers-hero-title"
      >
        <PageHeroImage image={getEducationHeroImage(center)} />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[22%] md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="-right-16 bottom-[18%] md:-right-24"
          icon={decoIcons[1]}
        />
        <div className="container relative flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[142px]">
          <div
            id="teachers-hero-title"
            className="page-hero-label"
          >
            <span className="block text-brand">교육</span>
            <span className="block">교육진 소개</span>
          </div>
        </div>
      </section>

      <section
        className="section-teachers-list section-p-block-base relative overflow-hidden text-white"
        aria-labelledby="teachers-list-title"
      >
        {/* <PageDeco
          className="right-[-120px] top-20 hidden md:block"
          icon={decoIcons[2]}
        /> */}

        <div className="container relative z-10">
          <PageIntro
            className="section-teachers-list__head page-heading--dark mb-16 md:mb-[100px]"
            description={'배우앤배움의 모든 교육진은 현재 드라마, 영화 등\n메이저채널에서 작품활동을 하시는 배우분들로 구성되어 있습니다.'}
            descriptionClassName="section-teachers-list__description"
            eyebrow="교육진 소개"
            eyebrowClassName="section-teachers-list__eyebrow"
            id="teachers-list-title"
            title={'훌륭한 스승을 만나는 것이\n배움의 첫 시작입니다.'}
            titleClassName="section-teachers-list__title"
          />

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
