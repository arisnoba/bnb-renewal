import type { Metadata } from 'next'

import Image from 'next/image'
import { notFound } from 'next/navigation'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter, getCenterLabel, type CenterSlug } from '@/lib/centers'

import { ProfileProductionIndex } from './ProfileProductionIndex.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type ProfileProductionCenter = Extract<CenterSlug, 'art' | 'highteen' | 'kids'>

type ProfileProductionMedia =
  | {
      alt?: string
      kind: 'single'
      objectPosition?: string
      src: string
    }
  | {
      images: Array<{
        alt?: string
        className?: string
        objectFit?: 'contain' | 'cover'
        objectPosition?: string
        src: string
      }>
      kind: 'grid'
    }

type ProfileProductionItem = {
  description: string[]
  id: string
  media: ProfileProductionMedia
  title: string
}

const profileProductionCenters = ['art', 'highteen', 'kids'] as const satisfies ProfileProductionCenter[]

const profileProductionItems = [
  {
    description: [
      '프로필 촬영 및 개인연기 영상제작 등 모두 BNB 전용 스튜디오에서 진행됩니다. BNB 스튜디오는 최고급 장비를 보유하고 있으며, 단독 헤어&메이크업실을 갖추고 있어 프라이빗한 서비스를 이용하실 수 있습니다.',
    ],
    id: 'studio',
    media: {
      images: [
        { objectPosition: 'center', src: '/assets/profile-production/studio-01.png' },
        { objectPosition: 'center', src: '/assets/profile-production/studio-02.png' },
        { objectPosition: 'center', src: '/assets/profile-production/studio-03.png' },
        { objectPosition: 'center', src: '/assets/profile-production/studio-04.png' },
      ],
      kind: 'grid',
    },
    title: 'BNB 전용 스튜디오',
  },
  {
    description: ['프로필 촬영을 희망하는 수강생은 하단의 QR 코드를 통해 신청폼을 작성합니다.'],
    id: 'application',
    media: {
      images: [
        {
          objectPosition: 'center',
          src: '/assets/profile-production/application.png',
        },
        {
          className: 'bg-neutral-50 p-10 md:p-14',
          objectFit: 'contain',
          src: '/assets/profile-production/qr.png',
        },
      ],
      kind: 'grid',
    },
    title: '프로필 신청',
  },
  {
    description: [
      '촬영 스케줄이 결정되면 촬영에 앞서 작가님과 함께 컨셉 미팅을 진행하게 됩니다. 이때 연기자는 작가님과 본인이 준비한 컨셉에 대해 상의 후 조명, 포즈, 헤어, 메이크업, 의상 등 프로필 제작의 전반적인 진행내용을 결정하게 됩니다.',
    ],
    id: 'concept-meeting',
    media: {
      kind: 'single',
      objectPosition: '45% center',
      src: '/assets/profile-production/profile-workflow.png',
    },
    title: '촬영 콘셉트미팅',
  },
  {
    description: [
      '프로필 촬영 당일 스튜디오에는 포토그래퍼/헤어팀/메이크업팀/그 외 스태프들이 촬영시간에 맞춰 시작합니다. 헤어&메이크업팀의 경우, 청담동 연예인 전문 헤어샵 디자이너가 1:1로 배우를 직접 케어합니다.',
    ],
    id: 'shooting',
    media: {
      kind: 'single',
      objectPosition: '50% center',
      src: '/assets/profile-production/profile-workflow.png',
    },
    title: '프로필 촬영',
  },
  {
    description: [
      '촬영이 끝나면 스튜디오에서 연기자에게 1차 원본 전체 파일을 jpg로 전송합니다. 전달받은 사진 중 A컷 사진 분류 후, 다시 스튜디오측에 2차 사진 보정작업을 의뢰합니다. (스튜디오의 보정작업은 약 10-14일 정도 소요됩니다.)',
    ],
    id: 'retouching',
    media: {
      kind: 'single',
      objectPosition: '60% center',
      src: '/assets/profile-production/profile-workflow.png',
    },
    title: 'A컷 분류 및 보정작업',
  },
  {
    description: [
      '배우앤배움의 영상 전문 프로덕션 계열사 (주)볼드 인사이트와 협업으로 수강 연기자들의 연기영상을 제작하고 있습니다. 제작된 연기영상은 제작사, 캐스팅 에이전시 등에서 바로 확인 할 수 있도록 프로필에 QR링크를 삽입해 드립니다.',
    ],
    id: 'qr-profile',
    media: {
      images: [
        {
          objectPosition: '46% center',
          src: '/assets/profile-production/profile-workflow.png',
        },
        {
          objectPosition: 'center',
          src: '/assets/profile-production/qr-profile.png',
        },
      ],
      kind: 'grid',
    },
    title: '연기영상 QR코드 프로필 삽입',
  },
] satisfies ProfileProductionItem[]

const profileProductionCardDecoClasses = [
  'left-[calc(var(--page-deco-size)/-2)] top-[calc(var(--page-deco-size)/-2)]',
  'right-[calc(var(--page-deco-size)/-2)] top-[calc(var(--page-deco-size)/-2)]',
  'right-[calc(var(--page-deco-size)/-2)] bottom-[calc(var(--page-deco-size)/-2)]',
] as const

function isProfileProductionCenter(center: CenterSlug): center is ProfileProductionCenter {
  return profileProductionCenters.includes(center as ProfileProductionCenter)
}

export function generateStaticParams() {
  return profileProductionCenters.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (!isProfileProductionCenter(center)) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  return {
    description: `${getCenterLabel(center)} 프로필 제작 절차와 BNB 전용 스튜디오 안내`,
    title: `프로필 제작 절차 안내 | ${getCenterLabel(center)}`,
  }
}

export default async function ProfileProductionPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)
  const decoIcons = getPageDecoIcons(profileProductionItems.length + 2, `profile-production-${center}`)

  if (!isProfileProductionCenter(center)) {
    notFound()
  }

  return (
    <main className="page page-light page-profile-production !overflow-visible" data-center={center}>
      <section
        aria-labelledby="profile-production-hero-title"
        className="section-profile-production-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-60"
          fill
          priority
          sizes="100vw"
          src="/assets/profile-production/hero.png"
        />
        <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[38%] max-md:!hidden md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:!hidden md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1
            className="section-profile-production-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
            id="profile-production-hero-title"
          >
            <span className="block text-brand">프로필 제작</span>
            <span className="block">절차 안내</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="profile-production-list-title"
        className="section-profile-production-list section-p-block-base bg-white text-neutral-900"
      >
        <div className="container grid items-start gap-12 overflow-hidden lg:grid-cols-3">
          <aside className="section-profile-production-list__aside lg:sticky lg:top-[calc(var(--page-top-offset)+32px)] lg:self-start">
            <h2
              className="section-profile-production-list__title type-display-m font-semibold md:type-display-l"
              id="profile-production-list-title"
            >
              프로필 제작<br className="hidden md:block" /> 절차 안내
            </h2>

            <ProfileProductionIndex
              items={profileProductionItems.map(({ id, title }) => ({ id, title }))}
            />
          </aside>

          <div className="section-profile-production-list__items col-span-1 flex flex-col gap-16 md:gap-20 lg:col-span-2">
            {profileProductionItems.map((item, index) => (
              <article
                className="section-profile-production-card scroll-mt-[var(--page-top-offset)]"
                id={item.id}
                key={item.id}
              >
                <div className="section-profile-production-card__media relative aspect-[552/320]">
                  <PageDeco
                    className={[
                      'z-20 hidden opacity-90 md:block',
                      profileProductionCardDecoClasses[
                        index % profileProductionCardDecoClasses.length
                      ],
                    ].join(' ')}
                    icon={decoIcons[index + 2]}
                    size="clamp(64px, 6vw, 90px)"
                  />
                  <ProfileProductionMedia media={item.media} title={item.title} />
                </div>
                <div className="section-profile-production-card__body mt-8 flex flex-col gap-5">
                  <header className="section-profile-production-card__head flex flex-col gap-3 sm:flex-row sm:items-end">
                    <span className="section-profile-production-card__number inline-flex w-fit rounded-full bg-neutral-900 px-3 py-1 type-label-m font-extrabold leading-[1.2] text-white">
                      {formatProfileProductionIndex(index)}
                    </span>
                    <h3 className="section-profile-production-card__title type-title-l font-bold leading-[1.2] text-neutral-900">
                      {item.title}
                    </h3>
                  </header>
                  <div className="section-profile-production-card__description flex flex-col gap-4 type-body-m leading-relaxed text-neutral-500">
                    {item.description.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function ProfileProductionMedia({
  media,
  title,
}: {
  media: ProfileProductionMedia
  title: string
}) {
  if (media.kind === 'single') {
    return (
      <div className="relative z-10 size-full overflow-hidden bg-neutral-200">
        <Image
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          fill
          sizes="(max-width: 1023px) calc(100vw - 40px), 552px"
          src={media.src}
          style={{ objectPosition: media.objectPosition }}
        />
      </div>
    )
  }

  return (
    <div className="relative z-10 grid size-full grid-cols-2 overflow-hidden bg-neutral-200">
      {media.images.map((image, index) => (
        <div
          className={[
            'section-profile-production-card__media-cell relative min-h-0 overflow-hidden',
            image.className ?? '',
          ].join(' ')}
          key={`${title}-${image.src}-${index}`}
        >
          <Image
            alt=""
            aria-hidden="true"
            className={image.objectFit === 'contain' ? 'size-full object-contain' : 'size-full object-cover'}
            fill
            sizes="(max-width: 1023px) calc((100vw - 40px) / 2), 276px"
            src={image.src}
            style={{ objectPosition: image.objectPosition }}
          />
        </div>
      ))}
    </div>
  )
}

function formatProfileProductionIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}
