/* eslint-disable @next/next/no-img-element -- Home cards use mixed Payload/R2/local URLs already normalized by getMediaUrl. */
import configPromise from '@payload-config'
import { ChevronRight, GraduationCap, Info } from 'lucide-react'
import Link from 'next/link'
import { cache, type ReactNode } from 'react'
import { getPayload, type Where } from 'payload'

import { CurriculumSearchForm } from '@/components/CurriculumSearchForm.client'
import { PageIntro } from '@/components/PageIntro'
import {
  footerCenterInfoForCenter,
  footerSocialLinks,
  type FooterSocialLink,
} from '@/Footer/centerInfo'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Marquee } from '@/components/ui/marquee'
import type { CenterSlug } from '@/lib/centers'
import { centers } from '@/lib/centers'
import { curriculumClassOptionsByCenter, type CurriculumCenter } from '@/lib/curriculumOptions'
import {
  buildCurriculumSearchFields,
  getCurriculumPeriodMonths,
  resolveCurrentCurriculumPeriod,
  type CurriculumPeriod,
} from '@/lib/curriculumSearch'
import { extractYouTubeVideoId, youtubeThumbnailUrl } from '@/lib/youtube'
import type {
  ArtistPress,
  Curriculum,
  ExamPassedReview,
  ExamPassedVideo,
  ExamSchoolLogo,
  Footer,
  Media,
  News,
  SocialLink,
} from '@/payload-types'
import { getArtistPressThumbnailMedia, getArtistPressUrl } from '@/utilities/artistPressFallbacks'
import { publishedArtistPressWhere } from '@/utilities/artistPressVisibility'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getNewsUrl } from '@/utilities/newsFallbacks'
import { CenterHomeScreenAppearances } from './CenterHomeScreenAppearances.client'
import { CenterHomeArtistCare, type CenterHomeArtistCareItem } from './CenterHomeArtistCare.client'
import {
  hasSearchableHomeCurriculum,
  type SearchableHomeCurriculumCenter,
} from './centerHomeCourseSearch'
import { screenAppearanceSlide, type HomeScreenAppearance } from './screenAppearanceSlides'

type CenterHomeSectionsProps = {
  center: CenterSlug
}

type HomeNews = Pick<News, 'id' | 'category' | 'publishedAt' | 'slug' | 'title'>

type HomeArtistPress = Pick<
  ArtistPress,
  'actorName' | 'generation' | 'id' | 'publishedAt' | 'slug' | 'thumbnailMedia' | 'title'
>

type HomeExamPassedVideo = Pick<
  ExamPassedVideo,
  'id' | 'publishedAt' | 'slug' | 'title' | 'youtubeCode' | 'youtubeUrl'
>

type HomeExamPassedReview = Pick<
  ExamPassedReview,
  'id' | 'publishedAt' | 'resultSummary' | 'slug' | 'studentImagePath' | 'studentName' | 'title'
> & {
  school: number | (Pick<ExamSchoolLogo, 'id' | 'logoMedia' | 'schoolName'> & Record<string, unknown>)
}

type HomeCurriculum = Pick<
  Curriculum,
  | 'educationDayFriday'
  | 'educationDayMonday'
  | 'educationDaySaturday'
  | 'educationDaySunday'
  | 'educationDayThursday'
  | 'educationDayTuesday'
  | 'educationDayWednesday'
  | 'educationStartTime'
>

type GradeSystemCenter = Extract<CenterSlug, 'art' | 'highteen' | 'kids'>

type HomeSocialLink = Pick<SocialLink, 'id' | 'externalUrl' | 'representativeImage' | 'title'>

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
  curriculums: HomeCurriculum[]
  examPassedReviews: HomeExamPassedReview[]
  examPassedVideos: HomeExamPassedVideo[]
  news: HomeNews[]
  screenAppearances: HomeScreenAppearance[]
  socialAccounts: HomeSocialAccount[]
  socialLinks: HomeSocialLink[]
}

const screenAppearanceLimit = 10
const artistPressLimit = 5
const examPassedReviewLimit = 5
const examPassedVideoLimit = 6
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
  art: '배우의 여정, \n함께합니다',
  avenue: '새로운 무대의 \n가능성을 연결합니다',
  exam: '합격의 여정, \n함께합니다',
  highteen: '하이틴 배우의 \n시작을 함께합니다',
  kids: '아역배우의 \n성장을 함께합니다',
}

const artistCareGroups = {
  actorCare: '배우 케어 시스템',
  membership: '멤버십 서비스',
} as const

function artistCareItems(center: CenterSlug): CenterHomeArtistCareItem[] {
  const items: CenterHomeArtistCareItem[] = [
    {
      category: artistCareGroups.actorCare,
      description: '작품과 배우를 연결하는 전담 캐스팅 관리',
      href: `/${center}/casting`,
      imageUrl: '/assets/artist-care/casting-center.jpg',
      title: '캐스팅 센터',
    },
    {
      category: artistCareGroups.actorCare,
      description: '오디션과 감독 미팅까지 이어지는 캐스팅 루트',
      href: `/${center}/direct-castings`,
      imageUrl: '/assets/artist-care/direct-casting.jpg',
      title: '다이렉트 캐스팅',
    },
    {
      category: artistCareGroups.actorCare,
      description: '현장 경험을 갖춘 강사진의 실전 트레이닝',
      href: `/${center}/teachers`,
      imageUrl: '/assets/artist-care/premium-instructors.jpg',
      title: '급이 다른 강사진',
    },
    {
      category: artistCareGroups.actorCare,
      description: '기획사 신인 배우 교육까지 이어지는 커리큘럼',
      href: `/${center}/entertainment`,
      imageUrl: '/assets/artist-care/agency-training.jpg',
      title: '기획사 위탁교육',
    },
    {
      category: artistCareGroups.membership,
      description: '배우앤배움 수강생을 위한 이용 가이드',
      href: `/${center}/how-to-use`,
      imageUrl: '/assets/artist-care/academy-guide.jpg',
      title: '학원100%이용법',
    },
    {
      category: artistCareGroups.membership,
      description: '프로필 사진과 영상 제작을 위한 전용 스튜디오',
      href: `/${center}/profile-production`,
      imageUrl: '/assets/artist-care/profile-video-production.jpg',
      title: '프로필·영상제작',
    },
    {
      category: artistCareGroups.membership,
      description: '수업 이후에도 이어지는 연습 공간 지원',
      href: `/${center}/how-to-use#security`,
      imageUrl: '/assets/artist-care/practice-room-24h.jpg',
      title: '24시간 연습실 개방',
    },
    {
      category: artistCareGroups.membership,
      description: '배우가 촬영에 집중할 수 있는 현장 케어',
      href: `/${center}/casting-system#filming-support`,
      imageUrl: '/assets/artist-care/filming-care.jpg',
      title: '촬영현장 지원',
    },
  ]

  if (center !== 'exam') {
    return items
  }

  return items.filter(
    (item) =>
      !item.href.includes('/casting') &&
      !item.href.includes('/direct-castings') &&
      !item.href.includes('/casting-system'),
  )
}

export async function CenterHomeSections({ center }: CenterHomeSectionsProps) {
  const data = await queryCenterHomeData(center)

  return (
    <>
      {hasSearchableHomeCurriculum(center) ? (
        <CourseSearchSection center={center} curriculums={data.curriculums} />
      ) : null}
      <ArtistCareSection center={center} />
      {center === 'exam' ? (
        <ExamPassedVideosHomeSection videos={data.examPassedVideos} />
      ) : (
        <ScreenAppearancesHomeSection center={center} appearances={data.screenAppearances} />
      )}
      {center === 'exam' ? (
        <ExamPassedReviewsHomeSection reviews={data.examPassedReviews} />
      ) : (
        <ArtistPressHomeSection artistPress={data.artistPress} center={center} />
      )}
      <NewsHomeSection center={center} news={data.news} />
      <SocialHomeSection
        center={center}
        links={data.socialLinks}
        socialAccounts={data.socialAccounts}
      />
      <HomeCtaSection center={center} />
    </>
  )
}

function CourseSearchSection({
  center,
  curriculums,
}: {
  center: SearchableHomeCurriculumCenter
  curriculums: HomeCurriculum[]
}) {
  const searchFields = buildCurriculumSearchFields({
    classOptions: curriculumClassOptionsForCenter(center),
    curriculums,
  })
  const periodMonths = getCurriculumPeriodMonths(center)
  const period = resolveCurrentCurriculumPeriod(center)
  const gradeSystemHref = gradeSystemHrefForCenter(center)

  return (
    <section
      aria-labelledby="center-home-course-title"
      className="section-center-home-course border-b-2 border-neutral-900 bg-black pt-9 pb-10 text-white md:pt-12 md:pb-15"
      data-center={center}
    >
      <div className="container">
        <h2
          className="section-center-home-course__title text-center type-headline-s font-bold leading-normal"
          id="center-home-course-title"
        >
          BNB 강의검색
        </h2>
        <CurriculumSearchForm
          action={`/${center}/curriculum`}
          fields={searchFields}
          variant="centerHome"
        />
        <div className="section-center-home-course__meta mt-4 flex flex-col gap-2 type-body-m font-medium leading-normal text-neutral-500 md:flex-row md:items-center md:justify-between">
          <CurriculumPeriodTooltip
            center={center}
            className="hover:text-brand"
            iconClassName="size-4"
            period={period}
            periodMonths={periodMonths}
          />
          {gradeSystemHref && (
            <Link
              className="inline-flex items-center gap-2 transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              href={gradeSystemHref}
            >
              등급기준
              <Info aria-hidden="true" className="size-4" strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function CurriculumPeriodTooltip({
  center,
  className,
  iconClassName,
  period,
  periodMonths,
}: {
  center: CenterSlug
  className: string
  iconClassName: string
  period: CurriculumPeriod
  periodMonths: number
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label={`강의 갱신 기간 안내: ${period.start}부터 ${period.end}까지`}
            className={`inline-flex items-center gap-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
            type="button"
          >
            강의 갱신 : {periodMonths}개월
            <Info aria-hidden="true" className={iconClassName} strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-brand text-sm leading-normal"
          arrowClassName="fill-brand"
          data-center={center}
        >
          기간 : {period.start} ~ {period.end}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function gradeSystemHrefForCenter(center: CenterSlug) {
  if (!isGradeSystemCenter(center)) {
    return null
  }

  return `/${center}/grade-system`
}

function isGradeSystemCenter(center: CenterSlug): center is GradeSystemCenter {
  return center === 'art' || center === 'highteen' || center === 'kids'
}

function curriculumClassOptionsForCenter(center: CenterSlug) {
  if (!isCurriculumOptionCenter(center)) {
    return []
  }

  return curriculumClassOptionsByCenter[center]
}

function isCurriculumOptionCenter(center: CenterSlug): center is CurriculumCenter {
  return center in curriculumClassOptionsByCenter
}

function ArtistCareSection({ center }: { center: CenterSlug }) {
  return (
    <section
      aria-labelledby="center-home-care-title"
      className="section-center-home-care overflow-hidden bg-neutral-950 py-24 text-white md:py-[120px]"
      data-center={center}
    >
      <div className="container">
        <SectionIntro
          eyebrow="ARTIST CARE"
          id="center-home-care-title"
          title={centerTagline[center]}
        />
        <CenterHomeArtistCare items={artistCareItems(center)} />
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
      className="section-center-home-screen relative overflow-hidden bg-black py-24 text-white md:py-[120px]"
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

function ExamPassedVideosHomeSection({ videos }: { videos: HomeExamPassedVideo[] }) {
  const slides = videos.map((video) => examPassedVideoSlide(video))

  return (
    <section
      aria-labelledby="center-home-exam-videos-title"
      className="section-center-home-exam-videos relative overflow-hidden bg-black py-24 text-white md:py-[120px]"
      data-center="exam"
    >
      <div className="container">
        <SectionIntro
          align="center"
          eyebrow="SUCCESS STORIES"
          id="center-home-exam-videos-title"
          title="합격자 후기 영상"
        />
        <CenterHomeScreenAppearances
          contentType="video"
          fallbackHref="/exam/passed-videos"
          fallbackImageUrl={centerHeroImage.exam}
          items={slides}
          showThumbnails={false}
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
      className="section-center-home-artist-press bg-neutral-950 section-p-block-base text-white"
      data-center={center}
    >
      <div className="container grid gap-12 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4">
          <SectionIntro
            eyebrow="BNB ARTIST"
            id="center-home-artist-press-title"
            title={'BNB 출신\n아티스트'}
          />
        </div>
        <div className="section-center-home-artist-press__grid grid grid-cols-2 gap-3 md:grid-cols-4 lg:col-span-8">
          <ArtistPressFeaturedCard artistPress={featured} center={center} />
          {rest.slice(0, 3).map((item) => (
            <ArtistPressMiniCard artistPress={item} center={center} key={item.id} />
          ))}
          <Link
            className="section-center-home-artist-press__more flex aspect-square flex-col justify-between bg-brand p-5 text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:aspect-auto md:min-h-[184px]"
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

function ExamPassedReviewsHomeSection({ reviews }: { reviews: HomeExamPassedReview[] }) {
  const [featured, ...rest] = reviews

  return (
    <section
      aria-labelledby="center-home-exam-reviews-title"
      className="section-center-home-exam-reviews bg-neutral-950 section-p-block-base text-white"
      data-center="exam"
    >
      <div className="container grid gap-12 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4">
          <SectionIntro
            eyebrow="BNB STUDENT STORIES"
            id="center-home-exam-reviews-title"
            title={'수강생\n합격 후기'}
          />
        </div>
        <div className="section-center-home-exam-reviews__grid grid grid-cols-2 gap-3 md:grid-cols-4 lg:col-span-8">
          <ExamPassedReviewFeaturedCard review={featured} />
          {rest.slice(0, 3).map((item) => (
            <ExamPassedReviewMiniCard key={item.id} review={item} />
          ))}
          <Link
            className="section-center-home-exam-reviews__more flex aspect-square flex-col justify-between bg-brand p-5 text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:aspect-auto md:min-h-[184px]"
            href="/exam/passed-reviews"
          >
            <span className="type-title-s font-extrabold leading-normal">
              수강생
              <br />
              합격 후기
            </span>
            <span className="inline-flex items-center gap-2 type-label-s font-bold leading-[1.2]">
              더보기
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
      className="group section-center-home-artist-press-featured col-span-2 row-span-2 overflow-hidden bg-white text-neutral-950 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      href={artistPress ? getArtistPressUrl(artistPress, center) : `/${center}/artist-press`}
    >
      {imageUrl ? (
        <img
          alt=""
          className="aspect-4/3 w-full object-cover object-top ease-out transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          src={imageUrl}
        />
      ) : (
        <img
          alt=""
          className="aspect-4/3 w-full object-cover"
          loading="lazy"
          src="/assets/artist-press/hero.png"
        />
      )}
      <div className="p-5 bg-white z-10 relative">
        {/* <p className="type-label-s font-bold leading-[1.2] text-brand">ACTOR</p> */}
        <h3 className="mt-2 flex items-center gap-1.5 type-title-l font-extrabold leading-[1.4]">
          <span>{artistPress?.actorName || centers[center]}</span>
          {artistPress?.generation ? (
            <span className="shrink-0 rounded-full bg-brand px-3 py-1 type-label-s font-bold leading-none text-white">
              {artistPress.generation}
            </span>
          ) : null}
        </h3>
        <p className="mt-2 type-title-m font-medium leading-[1.35] text-neutral-500">
          {artistPress?.title || '배우앤배움 출신 아티스트'}
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
      className="group section-center-home-artist-press-mini relative aspect-square overflow-hidden bg-neutral-800 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:aspect-auto md:min-h-[184px]"
      href={getArtistPressUrl(artistPress, center)}
    >
      {imageUrl ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover object-center opacity-75 transition ease-out duration-300 group-hover:scale-105"
          loading="lazy"
          src={imageUrl}
        />
      ) : null}
      <span className="absolute inset-0 bg-linear-to-t from-black/70 to-black/10" />
      <span className="absolute bottom-4 left-4 right-4">
        <span className="flex items-center gap-2 type-title-s font-bold leading-normal text-white">
          <span className="min-w-0 truncate">{artistPress.actorName}</span>
          {artistPress.generation ? (
            <span className="shrink-0 rounded-full border border-white px-2.5 py-1 type-label-s font-bold leading-none text-white">
              {artistPress.generation}
            </span>
          ) : null}
        </span>
        <span className="block max-h-0 overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:mt-2 group-hover:max-h-[2.7em] group-hover:opacity-100 group-focus-visible:mt-2 group-focus-visible:max-h-[2.7em] group-focus-visible:opacity-100">
          <span className="line-clamp-2 translate-y-3 text-sm font-medium leading-[1.35] text-neutral-300 transition duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0">
            {artistPress.title}
          </span>
        </span>
      </span>
    </Link>
  )
}

function ExamPassedReviewFeaturedCard({ review }: { review?: HomeExamPassedReview }) {
  const imageUrl = examPassedReviewImageUrl(review)
  const schoolLogoUrl = examPassedReviewSchoolLogoUrl(review)
  const resultText = examPassedReviewResultText(review)
  const studentName = normalizeText(review?.studentName) || '합격생'
  const href = review ? examPassedReviewHref(review) : '/exam/passed-reviews'

  return (
    <Link
      aria-label={`${studentName} 합격 후기 보기`}
      className="group section-center-home-exam-review-featured col-span-2 row-span-2 overflow-hidden bg-white text-neutral-950 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      href={href}
    >
      <div className="relative aspect-4/3 overflow-hidden bg-neutral-900">
        {imageUrl ? (
          <img
            alt=""
            className="size-full object-cover object-center transition duration-300 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            src={imageUrl}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-neutral-900 px-6 text-center type-label-m font-semibold leading-normal text-white/45">
            이미지 준비중
          </div>
        )}
        <ExamPassedSchoolMark imageUrl={schoolLogoUrl} />
      </div>
      <div className="relative z-10 bg-white p-5">
        <h3 className="type-title-l font-extrabold leading-[1.4] text-neutral-950">
          {resultText}
        </h3>
        <p className="mt-4 line-clamp-2 type-body-s font-medium leading-[1.6] text-neutral-500">
          {examPassedReviewSummary(review)}
        </p>
      </div>
    </Link>
  )
}

function ExamPassedReviewMiniCard({ review }: { review: HomeExamPassedReview }) {
  const imageUrl = examPassedReviewImageUrl(review)
  const schoolLogoUrl = examPassedReviewSchoolLogoUrl(review)
  const resultText = examPassedReviewResultText(review)
  const studentName = normalizeText(review.studentName) || '합격생'

  return (
    <Link
      aria-label={`${studentName} 합격 후기 보기`}
      className="group section-center-home-exam-review-mini relative aspect-square overflow-hidden bg-neutral-800 outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:aspect-auto md:min-h-[184px]"
      href={examPassedReviewHref(review)}
    >
      {imageUrl ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover object-center opacity-80 transition duration-300 ease-out group-hover:scale-105"
          loading="lazy"
          src={imageUrl}
        />
      ) : null}
      <span className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/5" />
      <ExamPassedSchoolMark imageUrl={schoolLogoUrl} size="small" />
      <span className="absolute bottom-4 left-4 right-4">
        <span className="block type-body-s font-medium leading-normal text-white/80">
          {resultText}
        </span>
        <span className="mt-1 block type-title-s font-bold leading-normal text-white">
          {studentName}
        </span>
      </span>
    </Link>
  )
}

function ExamPassedSchoolMark({
  imageUrl,
  size = 'default',
}: {
  imageUrl: string
  size?: 'default' | 'small'
}) {
  const sizeClass = size === 'small' ? 'right-4 top-4 size-10' : 'right-5 top-5 size-[52px]'

  return (
    <span
      className={`absolute ${sizeClass} grid place-items-center overflow-hidden rounded-full border border-white/50 bg-white/95 p-1.5`}
    >
      {imageUrl ? (
        <img alt="" aria-hidden="true" className="size-full object-contain" loading="lazy" src={imageUrl} />
      ) : (
        <GraduationCap aria-hidden="true" className="size-6 text-brand" strokeWidth={2.2} />
      )}
    </span>
  )
}

function NewsHomeSection({ center, news }: { center: CenterSlug; news: HomeNews[] }) {
  return (
    <section
      aria-labelledby="center-home-news-title"
      className="section-center-home-news bg-black section-p-block-base text-white"
      data-center={center}
    >
      <div className="container grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionIntro
            eyebrow="NEWS & NOTICE"
            id="center-home-news-title"
            title={'배우앤배움\n이달의 소식'}
          />
          <ButtonLink className="mt-8" href={`/${center}/news`}>
            전체보기
          </ButtonLink>
        </div>
        <div className="section-center-home-news__list lg:col-span-8">
          {news.length === 0 ? (
            <p className="border-y border-white/15 py-10 type-title-s font-semibold text-neutral-400">
              등록된 소식이 없습니다.
            </p>
          ) : (
            news.map((item) => (
              <Link
                className="section-center-home-news-item grid gap-6 border-b border-white/15 py-7 text-white transition hover:text-brand md:grid-cols-[180px_1fr_96px] md:items-center"
                href={getNewsUrl(item, center)}
                key={item.id}
              >
                <span>
                  <span className="block type-title-s font-bold leading-[1.2] text-brand">
                    {newsTypeLabel(item.category)}
                  </span>
                  <span className="mt-2 block type-title-s font-bold leading-[1.35] text-neutral-300">
                    {item.category || '교육ㆍ운영ㆍ소식'}
                  </span>
                </span>
                <span className="line-clamp-2 type-headline-s font-semibold leading-normal md:line-clamp-1 md:type-headline-s">
                  {item.title}
                </span>
                <time className="type-label-l font-medium leading-[1.35] text-white/30 md:text-right">
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
      className="section-center-home-social relative overflow-hidden bg-neutral-950 text-white section-p-block-base"
      data-center={center}
    >
      <div className="container">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <SectionIntro
            eyebrow="CASTING & SOCIAL"
            id="center-home-social-title"
            title={'지금, 배우들이\n만들어가는 순간'}
          />
          <div className="grid gap-3 type-title-s font-normal leading-normal text-white/50 md:justify-items-end md:type-headline-s">
            {socialAccounts.map((account) => (
              <a
                className="inline-flex items-center gap-2 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white rounded-lg"
                href={account.href}
                key={account.platform}
                rel="noopener noreferrer"
                target="_blank"
              >
                <img alt="" aria-hidden="true" className="size-8" src={account.icon} />
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
        isYoutube ? 'aspect-video w-[min(82vw,384px)]' : 'aspect-[4/5] w-[min(76vw,304px)]'
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
    <section
      className="section-center-home-cta grid bg-black text-white md:grid-cols-2"
      data-center={center}
    >
      <HomeCtaCard
        description={'5개 센터, 1200평의\n배우 훈련에 최적화 설계된 스튜디오'}
        href={`/${center}/facilities`}
        image={centerBuildingImage[center]}
        title="Training"
      />
      <HomeCtaCard
        description={'배우엔배움 아티스트만 이용 가능한\n멤버십 서비스'}
        href={`/${center}/starcard`}
        media={<StarcardCtaInlineImage />}
        title="Star Card"
      />
    </section>
  )
}

function HomeCtaCard({
  description,
  href,
  image,
  media,
  title,
}: {
  description: string
  href: string
  image?: string
  media?: ReactNode
  title: string
}) {
  return (
    <Link
      className="group section-center-home-cta-card relative flex h-[270px] items-center justify-center overflow-hidden px-5 text-center outline-none ring-white/20 focus-visible:ring-2 focus-visible:ring-inset lg:min-h-[540px]"
      href={href}
    >
      {media ??
        (image ? (
          <img
            alt=""
            className="absolute inset-0 size-full object-cover opacity-65 transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            src={image}
          />
        ) : null)}
      <span className="absolute inset-0 bg-black/45" />
      <span className="relative">
        <span className="block type-headline-s font-extrabold leading-[1.2] md:type-headline-xl">
          {title}
        </span>
        <span className="mt-4 block whitespace-pre-line type-body-l font-semibold leading-normal text-white/80">
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

function StarcardCtaInlineImage() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 block overflow-hidden transition duration-500 group-hover:scale-[1.03]"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%), linear-gradient(-12.5deg, rgb(143, 37, 107) 0%, rgb(215, 74, 75) 50%, rgb(248, 111, 54) 100%), linear-gradient(90deg, rgb(250, 66, 66) 0%, rgb(250, 66, 66) 100%)',
      }}
    >
      <svg
        className="absolute inset-0 size-full"
        fill="none"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 960 541"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M480 0L0 135.25V405.75L480 541L960 405.75V135.25L480 0Z"
          fill="url(#home-starcard-cta-ci)"
        />
        <path
          d="M480 0L0 135.25V405.75L480 541L960 405.75V135.25L480 0Z"
          fill="black"
          fillOpacity="0.2"
        />
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="home-starcard-cta-ci"
            x1="960"
            x2="0"
            y1="270.5"
            y2="270.5"
          >
            <stop stopColor="rgb(240, 164, 60)" />
            <stop offset="1" stopColor="rgb(222, 35, 89)" />
          </linearGradient>
        </defs>
      </svg>
    </span>
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
    <PageIntro
      align={align}
      as="h2"
      className="section-center-home__intro page-heading--dark page-heading--eyebrow-muted"
      eyebrow={eyebrow}
      eyebrowClassName="section-center-home__eyebrow"
      id={id}
      title={title}
      titleClassName="section-center-home__title"
    />
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

function artistPressImageUrl(artistPress: HomeArtistPress | null | undefined) {
  if (!artistPress) {
    return ''
  }

  return mediaUrl(getArtistPressThumbnailMedia(artistPress))
}

function examPassedVideoSlide(video: HomeExamPassedVideo) {
  const youtubeUrl = normalizeText(video.youtubeUrl)
  const thumbnailUrl = youtubeThumbnailUrl(video.youtubeCode || youtubeUrl)
  const title = normalizeText(video.title) || '합격자 후기 영상'

  return {
    broadcastLogoAlt: '',
    broadcastLogoUrl: '',
    href: youtubeUrl || '/exam/passed-videos',
    id: video.id,
    meta: 'SUCCESS STORIES',
    openInNewTab: Boolean(youtubeUrl),
    performerName: '',
    performerRole: '',
    profileImageUrl: '',
    projectTitle: title,
    sceneImageUrl: thumbnailUrl,
  }
}

function examPassedReviewHref(review: Pick<HomeExamPassedReview, 'slug'>) {
  return `/exam/passed-reviews/${encodeURIComponent(review.slug)}`
}

function examPassedReviewImageUrl(review: HomeExamPassedReview | null | undefined) {
  return normalizeImageUrl(review?.studentImagePath)
}

function examPassedReviewResultText(review: HomeExamPassedReview | null | undefined) {
  return normalizeText(review?.resultSummary) || normalizeText(review?.title) || '수강생 합격 후기'
}

function examPassedReviewSummary(review: HomeExamPassedReview | null | undefined) {
  const studentName = normalizeText(review?.studentName)
  const title = normalizeText(review?.title)

  return [studentName, title].filter(Boolean).join(' 합격현황 ') || '배우앤배움 입시센터 합격생의 이야기'
}

function examPassedReviewSchoolLogoUrl(review: HomeExamPassedReview | null | undefined) {
  const school = review?.school
  const media = typeof school === 'object' ? school.logoMedia : null

  return mediaUrl(media)
}

function socialImageUrl(link: HomeSocialLink) {
  return socialMediaUrl(link.representativeImage) || youtubeThumbnailUrl(link.externalUrl)
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
  const url =
    media.sizes?.medium?.url || media.url || (media.filename ? `/media/${media.filename}` : '')

  return getMediaUrl(url, media.updatedAt)
}

function socialMediaUrl(value: number | null | Media | undefined) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const media = value as Media
  const url =
    media.url || media.sizes?.medium?.url || (media.filename ? `/media/${media.filename}` : '')

  return getMediaUrl(url, media.updatedAt)
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = normalizeText(value)

  if (!trimmed) {
    return ''
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return getMediaUrl(trimmed)
  }

  return getMediaUrl(`/${trimmed.replace(/^\/+/, '')}`)
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
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
    const shouldQueryCurriculums = hasSearchableHomeCurriculum(center)
    const [
      screenAppearances,
      artistPress,
      examPassedReviews,
      examPassedVideos,
      news,
      socialLinks,
      footer,
      curriculums,
    ] =
      await Promise.all([
        payload.find({
          collection: 'screen-appearances',
          depth: 2,
          limit: screenAppearanceLimit,
          overrideAccess: false,
          pagination: false,
          select: {
            appearanceType: true,
            actorInputMode: true,
            bodyImages: true,
            broadcastStation: true,
            className: true,
            linkedProfiles: true,
            performerName: true,
            profileImageMedia: true,
            profileImagePath: true,
            projectTitle: true,
            publishedAt: true,
            roleName: true,
            slug: true,
            thumbnailMedia: true,
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
          where: publishedArtistPressWhere(center),
        }),
        center === 'exam'
          ? payload.find({
              collection: 'exam-passed-reviews',
              depth: 2,
              limit: examPassedReviewLimit,
              overrideAccess: false,
              pagination: false,
              select: {
                publishedAt: true,
                resultSummary: true,
                school: true,
                slug: true,
                studentImagePath: true,
                studentName: true,
                title: true,
              },
              sort: '-publishedAt',
              where: centerArrayWhere('exam'),
            })
          : Promise.resolve({ docs: [] }),
        center === 'exam'
          ? payload.find({
              collection: 'exam-passed-videos',
              depth: 0,
              limit: examPassedVideoLimit,
              overrideAccess: false,
              pagination: false,
              select: {
                publishedAt: true,
                slug: true,
                title: true,
                youtubeCode: true,
                youtubeUrl: true,
              },
              sort: '-publishedAt',
              where: centerArrayWhere('exam'),
            })
          : Promise.resolve({ docs: [] }),
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
        shouldQueryCurriculums
          ? payload
              .find({
                collection: 'curriculums',
                depth: 0,
                limit: 200,
                overrideAccess: false,
                pagination: false,
                select: {
                  educationDayFriday: true,
                  educationDayMonday: true,
                  educationDaySaturday: true,
                  educationDaySunday: true,
                  educationDayThursday: true,
                  educationDayTuesday: true,
                  educationDayWednesday: true,
                  educationStartTime: true,
                },
                where: {
                  centers: {
                    equals: center,
                  },
                } satisfies Where,
              })
              .catch(() => ({ docs: [] }))
          : Promise.resolve({ docs: [] }),
      ])

    return {
      artistPress: artistPress.docs as HomeArtistPress[],
      curriculums: curriculums.docs as HomeCurriculum[],
      examPassedReviews: examPassedReviews.docs as HomeExamPassedReview[],
      examPassedVideos: examPassedVideos.docs as HomeExamPassedVideo[],
      news: news.docs as HomeNews[],
      screenAppearances: screenAppearances.docs as HomeScreenAppearance[],
      socialAccounts: centerSocialAccounts(footer as Footer, center),
      socialLinks: socialLinks.docs as HomeSocialLink[],
    }
  } catch {
    return {
      artistPress: [],
      curriculums: [],
      examPassedReviews: [],
      examPassedVideos: [],
      news: [],
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
