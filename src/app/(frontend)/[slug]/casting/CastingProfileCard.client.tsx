'use client'

import { ChevronRight, X } from 'lucide-react'
import Image from 'next/image'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export type CastingProfile = {
  careerItems: {
    content: string
    title: string
  }[]
  image?: string
  name: string
  role: string
}

export function CastingProfileCard({ profile }: { profile: CastingProfile }) {
  return (
    <Dialog>
      <article className="section-casting-profile">
        <div className="section-casting-profile__image relative aspect-square overflow-hidden bg-neutral-300">
          {profile.image ? (
            <Image
              alt={`${profile.name} ${profile.role} 프로필`}
              className="size-full object-cover object-top"
              fill
              loading="eager"
              sizes="(max-width: 639px) calc((100vw - 56px) / 2), (max-width: 1023px) calc((100vw - 72px) / 3), 268px"
              src={profile.image}
            />
          ) : null}
        </div>
        <div className="section-casting-profile__details mt-5 flex flex-col gap-3">
          <div className="section-casting-profile__name-row flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="section-casting-profile__name type-title-s font-bold leading-[1.2] text-neutral-900">
              {profile.name}
            </h3>
            <p className="section-casting-profile__role type-body-s font-bold leading-normal text-neutral-900">
              {profile.role}
            </p>
          </div>
          <DialogTrigger asChild>
            <button
              className="section-casting-profile__link inline-flex w-fit items-center gap-2 type-body-s font-bold leading-normal text-neutral-900 transition hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              type="button"
            >
              자세히 보기
              <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
            </button>
          </DialogTrigger>
        </div>
      </article>

      <DialogContent className="section-casting-profile-dialog z-[60] flex h-[min(760px,calc(100vh-48px))] max-w-[920px] flex-col overflow-hidden border-0 bg-white p-0">
        <DialogHeader className="section-casting-profile-dialog__header shrink-0 flex-row items-start justify-between gap-5 border-b border-neutral-200 bg-white px-6 py-6 text-left md:px-10">
          <div className="min-w-0">
            <p className="mb-2 type-label-m font-bold leading-[1.4] text-brand">
              CASTING DIRECTOR
            </p>
            <DialogTitle className="type-headline-l font-extrabold leading-[1.3] tracking-normal text-neutral-900">
              {profile.name}
              <span className="ml-3 align-baseline type-title-s font-bold text-neutral-500">
                {profile.role}
              </span>
            </DialogTitle>
          </div>
          <DialogClose
            aria-label="이력 닫기"
            className="section-casting-profile-dialog__close grid size-10 shrink-0 place-items-center rounded-full bg-white text-neutral-500 shadow-sm transition-colors hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            type="button"
          >
            <X aria-hidden="true" size={20} strokeWidth={2.2} />
          </DialogClose>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {profile.name} 캐스팅 디렉터 이력
        </DialogDescription>

        <div className="section-casting-profile-dialog__content min-h-0 flex-1 overflow-y-auto px-6 py-7 md:px-10 md:py-10">
          <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
            <div className="section-casting-profile-dialog__portrait relative aspect-square overflow-hidden bg-neutral-200">
              {profile.image ? (
                <Image
                  alt={`${profile.name} ${profile.role} 프로필`}
                  className="size-full object-cover object-top"
                  fill
                  sizes="220px"
                  src={profile.image}
                />
              ) : null}
            </div>
            <div className="section-casting-profile-dialog__career min-w-0">
              <h4 className="mb-5 type-title-m font-extrabold leading-[1.35] text-neutral-900">
                주요 이력
              </h4>
              {profile.careerItems.length > 0 ? (
                <ol className="flex flex-col gap-5">
                  {profile.careerItems.map((item, index) => (
                    <li
                      className="section-casting-profile-dialog__career-item grid gap-2 border-b border-neutral-200 pb-5 last:border-b-0 last:pb-0 md:grid-cols-[72px_minmax(0,1fr)] md:gap-5"
                      key={`${item.title}-${index}`}
                    >
                      <p className="type-title-m font-bold leading-normal text-neutral-900">
                        {item.title || '이력'}
                      </p>
                      <p className="whitespace-pre-line type-body-m font-medium leading-[1.7] text-neutral-500">
                        {item.content || '등록된 상세 이력이 없습니다.'}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="border-y border-neutral-200 py-8 type-body-m font-medium text-neutral-500">
                  등록된 이력이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
