/* eslint-disable @next/next/no-img-element -- Home cards use mixed Payload/R2/local URLs already normalized by getMediaUrl. */
import configPromise from '@payload-config'
import { ChevronDown, ChevronRight, Info, Search } from 'lucide-react'
import Link from 'next/link'
import { cache } from 'react'
import { getPayload, type Where } from 'payload'

import {
  footerCenterInfoForCenter,
  footerSocialLinks,
  type FooterSocialLink,
} from '@/Footer/centerInfo'
import { Marquee } from '@/components/ui/marquee'
import type { CenterSlug } from '@/lib/centers'
import { centers } from '@/lib/centers'
import { extractYouTubeVideoId } from '@/lib/youtube'
import type {
  ArtistPress,
  BroadcastStation,
  Footer,
  Media,
  News,
  Profile,
  ScreenAppearance,
  SocialLink,
} from '@/payload-types'
import {
  getArtistPressThumbnailMedia,
  getArtistPressUrl,
} from '@/utilities/artistPressFallbacks'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getNewsUrl } from '@/utilities/newsFallbacks'
import {
  CenterHomeScreenAppearances,
  type CenterHomeScreenAppearanceSlide,
} from './CenterHomeScreenAppearances.client'

type CenterHomeSectionsProps = {
  center: CenterSlug
}

type HomeProfile = Pick<
  Profile,
  'id' | 'name' | 'englishName' | 'height' | 'profileImageMedia' | 'profileImagePath' | 'slug' | 'weight'
>

type HomeNews = Pick<News, 'id' | 'category' | 'publishedAt' | 'slug' | 'title'>

type HomeArtistPress = Pick<
  ArtistPress,
  'actorName' | 'generation' | 'id' | 'publishedAt' | 'slug' | 'thumbnailMedia' | 'title'
>

type HomeScreenAppearance = Pick<
  ScreenAppearance,
  | 'id'
  | 'appearanceType'
  | 'bodyImages'
  | 'broadcastStation'
  | 'className'
  | 'performerName'
  | 'profileImagePath'
  | 'projectTitle'
  | 'publishedAt'
  | 'roleName'
  | 'slug'
  | 'thumbnailPath'
  | 'title'
>

type HomeSocialLink = Pick<
  SocialLink,
  'id' | 'externalUrl' | 'representativeImage' | 'representativeImageUrl' | 'title'
>

type SocialPlatform = 'instagram' | 'youtube'

const socialBadgeIcon: Record<SocialPlatform, string> = {
  instagram: '/assets/icons/badge-instagram.svg',
  youtube: '/assets/icons/badge-youtube.svg',
}

type HomeSocialAccount = FooterSocialLink & {
  platform: SocialPlatform
}

type CenterHomeData = {
  artistPress: HomeArtistPress[]
  news: HomeNews[]
  profiles: HomeProfile[]
  screenAppearances: HomeScreenAppearance[]
  socialAccounts: HomeSocialAccount[]
  socialLinks: HomeSocialLink[]
}

const screenAppearanceLimit = 7
const profileLimit = 5
const artistPressLimit = 5
const newsLimit = 5
const socialLimit = 10

const centerHeroImage: Record<CenterSlug, string> = {
  art: '/assets/art/grade-system-hero.png',
  avenue: '/assets/map/avenue.png',
  exam: '/assets/exam-management/hero-1.png',
  highteen: '/assets/entertainment/hero.png',
  kids: '/assets/map/kids.png',
}

const centerBuildingImage: Record<CenterSlug, string> = {
  art: '/assets/map/art.png',
  avenue: '/assets/map/avenue.png',
  exam: '/assets/map/exam.png',
  highteen: '/assets/map/highteen.png',
  kids: '/assets/map/kids.png',
}

const centerTagline: Record<CenterSlug, string> = {
  art: '배우의 여정, 함께합니다',
  avenue: '새로운 무대의 가능성을 연결합니다',
  exam: '합격의 여정, 함께합니다',
  highteen: '하이틴 배우의 시작을 함께합니다',
  kids: '아역배우의 성장을 함께합니다',
}

const fallbackCareCards = [
  {
    href: 'casting-system',
    label: '배우 케어',
    title: '캐스팅부터 현장까지',
  },
  {
    href: 'profile-production',
    label: '프로필 제작',
    title: '배우의 첫 인상을 설계합니다',
  },
  {
    href: 'teachers',
    label: '교육진',
    title: '현장 중심의 트레이닝',
  },
] as const

export async function CenterHomeSections({ center }: CenterHomeSectionsProps) {
  const data = await queryCenterHomeData(center)

  return (
    <>
      <CourseSearchSection center={center} />
      <ArtistCareSection center={center} profiles={data.profiles} />
      <ScreenAppearancesHomeSection center={center} appearances={data.screenAppearances} />
      <ArtistPressHomeSection artistPress={data.artistPress} center={center} />
      <NewsHomeSection center={center} news={data.news} />
      <SocialHomeSection center={center} links={data.socialLinks} socialAccounts={data.socialAccounts} />
      <HomeCtaSection center={center} />
    </>
  )
}

function CourseSearchSection({ center }: { center: CenterSlug }) {
  const items = [
    ['클래스(등급)', '선택하세요'],
    ['교육횟수', '선택하세요'],
    ['시간대별 Class', '선택하세요'],
  ] as const

  return (
    <section
      aria-labelledby="center-home-course-title"
      className="section-center-home-course border-b-2 border-neutral-900 bg-black px-5 py-14 text-white md:py-[60px]"
      data-center={center}
    >
      <div className="container">
        <h2
          className="section-center-home-course__title text-center type-headline-s font-extrabold leading-normal"
          id="center-home-course-title"
        >
          BNB 강의검색
        </h2>
        <div className="section-center-home-course__panel mt-8 grid gap-3 lg:grid-cols-[1fr_228px]">
          <div className="section-center-home-course__filters grid gap-1 md:grid-cols-3">
            {items.map(([label, value]) => (
              <button
                className="section-center-home-course__filter flex min-h-[82px] items-center justify-between bg-neutral-900 px-5 py-4 text-left transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:min-h-[90px]"
                key={label}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block type-body-s font-medium leading-[1.6] text-neutral-400">
                    {label}
                  </span>
                  <span className="mt-1 block type-body-m font-medium leading-normal text-white">
                    {value}
                  </span>
                </span>
                <ChevronDown aria-hidden="true" className="size-5 shrink-0" strokeWidth={2} />
              </button>
            ))}
          </div>
          <Link
            className="section-center-home-course__submit flex min-h-[72px] items-center justify-between bg-brand px-6 py-5 type-title-m font-bold leading-[1.4] text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:min-h-[90px]"
            href={`/${center}/curriculum`}
          >
            <span>강의검색</span>
            <Search aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </Link>
        </div>
        <div className="section-center-home-course__meta mt-4 flex flex-col gap-3 type-body-m font-medium leading-normal text-neutral-500 md:flex-row md:items-center md:justify-between">
          <span className="inline-flex items-center gap-2">
            적용기간(2개월단위로 갱신)
            <Info aria-hidden="true" className="size-4" strokeWidth={2} />
          </span>
          <span className="inline-flex items-center gap-2">
            등급기준
            <Info aria-hidden="true" className="size-4" strokeWidth={2} />
          </span>
        </div>
      </div>
    </section>
  )
}

function ArtistCareSection({
  center,
  profiles,
}: {
  center: CenterSlug
  profiles: HomeProfile[]
}) {
  return (
    <section
      aria-labelledby="center-home-care-title"
      className="section-center-home-care bg-neutral-950 px-5 py-24 text-white md:py-[120px]"
      data-center={center}
    >
      <div className="container grid gap-14 lg:grid-cols-[360px_1fr] lg:items-end">
        <SectionIntro
          eyebrow="ARTIST CARE"
          id="center-home-care-title"
          title={centerTagline[center]}
        />
        <div className="section-center-home-care__cards grid gap-4 md:grid-cols-3">
          {fallbackCareCards.map((card, index) => {
            const profile = profiles[index]
            const imageUrl = profileImageUrl(profile)

            return (
              <Link
                className="group section-center-home-care-card relative flex min-h-[240px] overflow-hidden rounded-full bg-neutral-900 p-6 text-white outline-none ring-white/20 transition hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:min-h-[320px]"
                href={`/${center}/${card.href}`}
                key={card.href}
              >
                {imageUrl ? (
                  <img
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-60 grayscale transition duration-300 group-hover:scale-105 group-hover:opacity-75"
                    loading="lazy"
                    src={imageUrl}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.24),rgba(255,255,255,0.04)_42%,rgba(0,0,0,0.5))]" />
                )}
                <span className="absolute inset-0 bg-black/35" aria-hidden="true" />
                <span className="relative mt-auto">
                  <span className="block type-caption-l font-bold leading-[1.35] text-brand">
                    {card.label}
                  </span>
                  <span className="mt-2 block type-title-s font-bold leading-normal">
                    {profile?.name || card.title}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ScreenAppearancesHomeSection({
  appearances,
  center,
}: {
  appearances: HomeScreenAppearance[]
  center: CenterSlug
}) {
  const slides = appearances.map((appearance) => screenAppearanceSlide(appearance, center))

  return (
    <section
      aria-labelledby="center-home-screen-title"
      className="section-center-home-screen relative overflow-hidden bg-black px-5 py-24 text-white md:py-[120px]"
      data-center={center}
    >
      <div className="container">
        <SectionIntro
          align="center"
          eyebrow="DRAMA & COMMERCIAL"
          id="center-home-screen-title"
          title="이달의 드라마&광고 출연장면"
        />
        <CenterHomeScreenAppearances
          fallbackHref={`/${center}/screen-appearances`}
          fallbackImageUrl={centerHeroImage[center]}
          items={slides}
        />
      </div>
    </section>
  )
}

function ArtistPressHomeSection({
  artistPress,
  center,
}: {
  artistPress: HomeArtistPress[]
  center: CenterSlug
}) {
  const [featured, ...rest] = artistPress

  return (
    <section
      aria-labelledby="center-home-artist-press-title"
      className="section-center-home-artist-press bg-neutral-950 px-5 py-24 text-white md:py-[120px]"
      data-center={center}
    >
      <div className="container grid gap-12 lg:grid-cols-[260px_1fr] lg:items-start">
        <SectionIntro
          eyebrow="BNB ARTIST"
          id="center-home-artist-press-title"
          title="BNB 출신 아티스트"
        />
        <div className="section-center-home-artist-press__grid grid gap-3 md:grid-cols-4">
          <ArtistPressFeaturedCard artistPress={featured} center={center} />
          {rest.slice(0, 3).map((item) => (
            <ArtistPressMiniCard artistPress={item} center={center} key={item.id} />
          ))}
          <Link
            className="section-center-home-artist-press__more flex min-h-[160px] flex-col justify-between bg-brand p-5 text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:min-h-[184px]"
            href={`/${center}/artist-press`}
          >
            <span className="type-title-s font-extrabold leading-normal">BNB ARTIST</span>
            <span className="inline-flex items-center gap-2 type-label-s font-bold leading-[1.2]">
              전체보기
              <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function ArtistPressFeaturedCard({
  artistPress,
  center,
}: {
  artistPress?: HomeArtistPress
  center: CenterSlug
}) {
  const imageUrl = artistPressImageUrl(artistPress)

  return (
    <Link
      className="group section-center-home-artist-press-featured overflow-hidden bg-white text-neutral-950 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:col-span-2 md:row-span-2"
      href={artistPress ? getArtistPressUrl(artistPress, center) : `/${center}/artist-press`}
    >
      {imageUrl ? (
        <img
          alt=""
          className="aspect-[4/3] w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          src={imageUrl}
        />
      ) : (
        <img
          alt=""
          className="aspect-[4/3] w-full object-cover"
          loading="lazy"
          src="/assets/artist-press/hero.png"
        />
      )}
      <div className="p-5">
        <p className="type-label-s font-bold leading-[1.2] text-brand">ACTOR</p>
        <h3 className="mt-2 type-title-l font-extrabold leading-[1.4]">
          {artistPress?.actorName || centers[center]}
        </h3>
        <p className="mt-2 type-caption-l font-medium leading-[1.35] text-neutral-500">
          {[artistPress?.generation, artistPress?.title].filter(Boolean).join(' · ') ||
            '배우앤배움 출신 아티스트'}
        </p>
      </div>
    </Link>
  )
}

function ArtistPressMiniCard({
  artistPress,
  center,
}: {
  artistPress: HomeArtistPress
  center: CenterSlug
}) {
  const imageUrl = artistPressImageUrl(artistPress)

  return (
    <Link
      className="group section-center-home-artist-press-mini relative min-h-[184px] overflow-hidden bg-neutral-800 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      href={getArtistPressUrl(artistPress, center)}
    >
      {imageUrl ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover object-top opacity-75 transition duration-300 group-hover:scale-105"
          loading="lazy"
          src={imageUrl}
        />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
      <span className="absolute bottom-4 left-4 right-4">
        <span className="block type-title-s font-bold leading-normal text-white">
          {artistPress.actorName}
        </span>
        <span className="mt-1 block type-caption-l font-medium leading-[1.35] text-neutral-300">
          {artistPress.generation || artistPress.title}
        </span>
      </span>
    </Link>
  )
}

function NewsHomeSection({ center, news }: { center: CenterSlug; news: HomeNews[] }) {
  return (
    <section
      aria-labelledby="center-home-news-title"
      className="section-center-home-news bg-black px-5 py-24 text-white md:py-[120px]"
      data-center={center}
    >
      <div className="container grid gap-12 lg:grid-cols-[260px_1fr]">
        <div>
          <SectionIntro eyebrow="NEWS & NOTICE" id="center-home-news-title" title="배우앤배움 이달의 소식" />
          <ButtonLink className="mt-8" href={`/${center}/news`}>
            전체보기
          </ButtonLink>
        </div>
        <div className="section-center-home-news__list">
          {news.length === 0 ? (
            <p className="border-y border-white/15 py-10 type-title-s font-semibold text-neutral-400">
              등록된 소식이 없습니다.
            </p>
          ) : (
            news.map((item) => (
              <Link
                className="section-center-home-news-item grid gap-3 border-b border-white/15 py-7 text-white transition hover:text-brand md:grid-cols-[180px_1fr_96px] md:items-center"
                href={getNewsUrl(item, center)}
                key={item.id}
              >
                <span>
                  <span className="block type-label-s font-bold leading-[1.2] text-brand">
                    {newsTypeLabel(item.category)}
                  </span>
                  <span className="mt-2 block type-caption-l font-bold leading-[1.35] text-neutral-300">
                    {item.category || '교육ㆍ운영ㆍ소식'}
                  </span>
                </span>
                <span className="line-clamp-2 type-title-s font-semibold leading-normal md:type-headline-s">
                  {item.title}
                </span>
                <time className="type-caption-l font-medium leading-[1.35] text-white/30 md:text-right">
                  {formatDate(item.publishedAt)}
                </time>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

function SocialHomeSection({
  center,
  links,
  socialAccounts,
}: {
  center: CenterSlug
  links: HomeSocialLink[]
  socialAccounts: HomeSocialAccount[]
}) {
  const visibleLinks = links
    .map((link) => ({
      href: link.externalUrl?.trim() || '',
      imageUrl: socialImageUrl(link),
      platform: socialPlatform(link.externalUrl),
      title: link.title || 'SNS 링크',
    }))
    .filter((link) => link.href && link.imageUrl)
    .slice(0, socialLimit)

  return (
    <section
      aria-labelledby="center-home-social-title"
      className="section-center-home-social relative overflow-hidden bg-neutral-950 py-24 text-white md:py-[120px]"
      data-center={center}
    >
      <div className="container">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <SectionIntro eyebrow="CASTING & SOCIAL" id="center-home-social-title" title={'지금, 배우들이\n만들어가는 순간'} />
          <div className="grid gap-3 type-title-s font-normal leading-normal text-white/50 md:justify-items-end md:type-headline-s">
            {socialAccounts.map((account) => (
              <a
                className="inline-flex items-center gap-3 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                href={account.href}
                key={account.platform}
                rel="noopener noreferrer"
                target="_blank"
              >
                <img alt="" aria-hidden="true" className="size-10" src={account.icon} />
                <span>{socialAccountDisplayLabel(account)}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      {visibleLinks.length > 0 ? (
        <div className="section-center-home-social__viewport overflow-hidden">
          <Marquee
            className="section-center-home-social__track mt-16 p-0 [--duration:44s] [--gap:2rem] md:mt-[100px] md:[--gap:60px]"
            hoverPlaybackRate={0.5}
            repeat={2}
            slowOnHover
          >
            {visibleLinks.map((link, index) => (
              <SocialMarqueeCard
                href={link.href}
                imageUrl={link.imageUrl}
                key={`${link.href}-${index}`}
                platform={link.platform}
                title={link.title}
              />
            ))}
          </Marquee>
        </div>
      ) : (
        <div className="section-center-home-social__viewport mt-16 overflow-hidden md:mt-[100px]">
          <div className="flex items-center justify-center gap-8 md:gap-[60px]">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                className="h-[216px] w-[min(82vw,384px)] shrink-0 bg-neutral-900 md:h-[256px]"
                key={item}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function SocialMarqueeCard({
  href,
  imageUrl,
  platform,
  title,
}: {
  href: string
  imageUrl: string
  platform: SocialPlatform
  title: string
}) {
  const isYoutube = platform === 'youtube'

  return (
    <a
      aria-label={title}
      className={`group/social-card relative block shrink-0 overflow-hidden bg-neutral-900 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
        isYoutube
          ? 'aspect-video w-[min(82vw,384px)]'
          : 'aspect-[4/5] w-[min(76vw,304px)]'
      }`}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <img
        alt=""
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover/social-card:scale-[1.035]"
        loading="lazy"
        src={imageUrl}
      />
      <img
        alt=""
        aria-hidden="true"
        className="absolute left-3 top-3 size-10"
        loading="lazy"
        src={socialBadgeIcon[platform]}
      />
    </a>
  )
}

function HomeCtaSection({ center }: { center: CenterSlug }) {
  return (
    <section className="section-center-home-cta grid bg-black text-white md:grid-cols-2" data-center={center}>
      <HomeCtaCard
        description="5평, 8평, 12평부터 촬영 공간까지 배우의 시작을 위한 환경"
        href={`/${center}/facilities`}
        image={centerBuildingImage[center]}
        title="Training"
      />
      <HomeCtaCard
        description="배우앤배움 아티스트를 위한 특별한 제휴 서비스"
        href={`/${center}/starcard`}
        image="/assets/common/starcard.png"
        title="Star Card"
      />
    </section>
  )
}

function HomeCtaCard({
  description,
  href,
  image,
  title,
}: {
  description: string
  href: string
  image: string
  title: string
}) {
  return (
    <Link
      className="group section-center-home-cta-card relative flex min-h-[360px] items-center justify-center overflow-hidden px-5 text-center outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-inset"
      href={href}
    >
      <img
        alt=""
        className="absolute inset-0 size-full object-cover opacity-65 transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        src={image}
      />
      <span className="absolute inset-0 bg-black/45" />
      <span className="relative">
        <span className="block type-headline-s font-extrabold leading-[1.2] md:type-headline-l">
          {title}
        </span>
        <span className="mt-4 block type-body-s font-semibold leading-normal text-white/80">
          {description}
        </span>
        <span className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 type-label-s font-bold leading-[1.2]">
          바로가기
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
        </span>
      </span>
    </Link>
  )
}

function SectionIntro({
  align = 'left',
  eyebrow,
  id,
  title,
}: {
  align?: 'center' | 'left'
  eyebrow: string
  id: string
  title: string
}) {
  return (
    <header className={align === 'center' ? 'text-center' : ''}>
      <p className="section-center-home__eyebrow type-title-m font-semibold leading-[1.4] text-white/50">
        {eyebrow}
      </p>
      <h2
        className="section-center-home__title mt-6 whitespace-pre-line type-display-l font-semibold leading-[1.25] text-white md:type-display-l"
        id={id}
      >
        {title}
      </h2>
    </header>
  )
}

function ButtonLink({
  children,
  className = '',
  href,
}: {
  children: React.ReactNode
  className?: string
  href: string
}) {
  return (
    <Link
      className={`inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 type-label-l font-semibold leading-[1.2] text-white transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
      href={href}
    >
      {children}
      <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
    </Link>
  )
}

function profileImageUrl(profile: HomeProfile | null | undefined) {
  if (!profile) {
    return ''
  }

  return mediaUrl(profile.profileImageMedia) || normalizeImageUrl(profile.profileImagePath)
}

function artistPressImageUrl(artistPress: HomeArtistPress | null | undefined) {
  if (!artistPress) {
    return ''
  }

  return mediaUrl(getArtistPressThumbnailMedia(artistPress))
}

function screenAppearanceSlide(
  appearance: HomeScreenAppearance,
  center: CenterSlug,
): CenterHomeScreenAppearanceSlide {
  return {
    href: `/${center}/screen-appearances/${encodeURIComponent(appearance.slug)}`,
    id: appearance.id,
    meta: screenAppearanceMeta(appearance),
    performer: featuredPerformer(appearance),
    profileImageUrl: screenAppearanceProfileImageUrl(appearance),
    projectTitle: featuredTitle(appearance),
    sceneImageUrl: screenAppearanceSceneImageUrl(appearance),
  }
}

function screenAppearanceSceneImageUrl(appearance: HomeScreenAppearance | null | undefined) {
  const bodyImage = appearance?.bodyImages?.find((item) => item?.image && typeof item.image === 'object')?.image

  return mediaUrl(bodyImage as Media | undefined) || screenAppearanceImageUrl(appearance)
}

function screenAppearanceProfileImageUrl(appearance: HomeScreenAppearance | null | undefined) {
  return normalizeImageUrl(appearance?.profileImagePath) || screenAppearanceImageUrl(appearance)
}

function screenAppearanceImageUrl(appearance: HomeScreenAppearance | null | undefined) {
  return normalizeImageUrl(appearance?.thumbnailPath)
}

function socialImageUrl(link: HomeSocialLink) {
  return socialMediaUrl(link.representativeImage) || normalizeImageUrl(link.representativeImageUrl)
}

function socialPlatform(value: string | null | undefined): SocialPlatform {
  if (extractYouTubeVideoId(value)) {
    return 'youtube'
  }

  try {
    const hostname = new URL(value?.trim() || '').hostname.replace(/^www\./, '')

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtu.be') {
      return 'youtube'
    }
  } catch {
    return 'instagram'
  }

  return 'instagram'
}

function socialAccountDisplayLabel(account: HomeSocialAccount) {
  try {
    const parsedUrl = new URL(account.href)
    const handle = parsedUrl.pathname.split('/').filter(Boolean)[0]

    if (handle) {
      return account.platform === 'youtube' ? handle.replace(/^@/, '') : handle
    }
  } catch {
    return account.label
  }

  return account.label
}

function centerSocialAccounts(footer: Footer | null, center: CenterSlug): HomeSocialAccount[] {
  const centerInfo = footerCenterInfoForCenter(footer?.centerInfos ?? [], center)

  return footerSocialLinks(centerInfo).flatMap((link) => {
    const platform = footerSocialPlatform(link)

    return platform ? [{ ...link, platform }] : []
  })
}

function footerSocialPlatform(link: FooterSocialLink): SocialPlatform | null {
  const normalizedLabel = link.label.toLowerCase()

  if (normalizedLabel.includes('youtube')) {
    return 'youtube'
  }

  if (normalizedLabel.includes('instagram')) {
    return 'instagram'
  }

  return null
}

function mediaUrl(value: number | null | Media | undefined) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const media = value as Media
  const url = media.sizes?.medium?.url || media.url || (media.filename ? `/media/${media.filename}` : '')

  return getMediaUrl(url, media.updatedAt)
}

function socialMediaUrl(value: number | null | Media | undefined) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const media = value as Media
  const url = media.url || media.sizes?.medium?.url || (media.filename ? `/media/${media.filename}` : '')

  return getMediaUrl(url, media.updatedAt)
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return getMediaUrl(trimmed)
  }

  return getMediaUrl(`/${trimmed.replace(/^\/+/, '')}`)
}

function featuredTitle(appearance: HomeScreenAppearance | null | undefined) {
  return appearance?.projectTitle?.trim() || appearance?.title || '배우앤배움 출연장면'
}

function featuredPerformer(appearance: HomeScreenAppearance | null | undefined) {
  return [appearance?.performerName, appearance?.className, appearance?.roleName]
    .filter(Boolean)
    .join(' · ') || '배우앤배움 수강생'
}

function screenAppearanceMeta(appearance: HomeScreenAppearance) {
  const station = getHomeBroadcastStation(appearance.broadcastStation)
  const stationName = station?.stationName?.trim()

  return [stationName, screenAppearanceTypeText(appearance.appearanceType)]
    .filter(Boolean)
    .join(' ')
}

function screenAppearanceTypeText(value: HomeScreenAppearance['appearanceType'] | undefined) {
  if (value === 'commercial') {
    return '광고 출연장면'
  }

  if (value === 'movie') {
    return '영화 출연장면'
  }

  return '드라마 출연장면'
}

function getHomeBroadcastStation(value: HomeScreenAppearance['broadcastStation']) {
  return value && typeof value === 'object' ? (value as BroadcastStation) : null
}

function newsTypeLabel(value: string | null | undefined) {
  const text = value || ''

  if (/news|캐스팅|onair/i.test(text)) {
    return 'NEWS'
  }

  return 'NOTICE'
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}

const queryCenterHomeData = cache(async (center: CenterSlug): Promise<CenterHomeData> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const [screenAppearances, profiles, artistPress, news, socialLinks, footer] = await Promise.all([
      payload.find({
        collection: 'screen-appearances',
        depth: 1,
        limit: screenAppearanceLimit,
        overrideAccess: false,
        pagination: false,
        select: {
          appearanceType: true,
          bodyImages: true,
          broadcastStation: true,
          className: true,
          performerName: true,
          profileImagePath: true,
          projectTitle: true,
          publishedAt: true,
          roleName: true,
          slug: true,
          thumbnailPath: true,
          title: true,
        },
        sort: '-publishedAt',
        where: {
          and: [
            {
              displayStatus: {
                equals: 'published',
              },
            },
            {
              centers: {
                equals: center,
              },
            },
          ],
        } satisfies Where,
      }),
      payload.find({
        collection: 'profiles',
        depth: 1,
        limit: profileLimit,
        overrideAccess: false,
        pagination: false,
        select: {
          englishName: true,
          height: true,
          name: true,
          profileImageMedia: true,
          profileImagePath: true,
          slug: true,
          weight: true,
        },
        sort: '-publishedAt',
        where: centerArrayWhere(center),
      }),
      payload.find({
        collection: 'artist-press',
        depth: 1,
        limit: artistPressLimit,
        overrideAccess: false,
        pagination: false,
        select: {
          actorName: true,
          generation: true,
          publishedAt: true,
          slug: true,
          thumbnailMedia: true,
          title: true,
        },
        sort: '-publishedAt',
        where: centerArrayWhere(center),
      }),
      payload.find({
        collection: 'news',
        depth: 0,
        limit: newsLimit,
        overrideAccess: false,
        pagination: false,
        select: {
          category: true,
          publishedAt: true,
          slug: true,
          title: true,
        },
        sort: '-publishedAt',
        where: centerArrayWhere(center),
      }),
      payload.find({
        collection: 'social-links',
        depth: 1,
        limit: socialLimit,
        overrideAccess: false,
        pagination: false,
        sort: '-createdAt',
        where: {
          center: {
            equals: center,
          },
          displayStatus: {
            equals: 'published',
          },
        },
      }),
      payload.findGlobal({
        slug: 'footer',
        depth: 0,
      }),
    ])

    return {
      artistPress: artistPress.docs as HomeArtistPress[],
      news: news.docs as HomeNews[],
      profiles: profiles.docs as HomeProfile[],
      screenAppearances: screenAppearances.docs as HomeScreenAppearance[],
      socialAccounts: centerSocialAccounts(footer as Footer, center),
      socialLinks: socialLinks.docs as HomeSocialLink[],
    }
  } catch {
    return {
      artistPress: [],
      news: [],
      profiles: [],
      screenAppearances: [],
      socialAccounts: [],
      socialLinks: [],
    }
  }
})

function centerArrayWhere(center: CenterSlug): Where {
  return {
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
}
