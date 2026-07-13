import {
  getArtistHeroImage,
  getEducationHeroImage,
  getExamPassedHeroImage,
  getExamResultsHeroImage,
  PageHeroImage,
} from "@/app/(frontend)/_components/PageHeroImage";
import { HeroMosaicDim } from "@/app/(frontend)/_components/HeroMosaicDim";
import { getPageDecoIcons, PageDeco } from "@/components/PageDeco";
import type { CenterSlug } from "@/lib/centers";
import { cn } from "@/utilities/ui";
import Image from "next/image";

type SkeletonTone = "dark" | "light";

const loadingCenters = ["art", "avenue", "exam", "highteen", "kids"] as const;
const scheduleHeroImage = "/assets/casting-system/hero.png";

export function resolveLoadingCenter(
  value: string | string[] | undefined,
  fallback: CenterSlug = "art",
) {
  const slug = Array.isArray(value) ? value[0] : value;

  return loadingCenters.includes(slug as CenterSlug)
    ? (slug as CenterSlug)
    : fallback;
}

function SkeletonBlock({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: SkeletonTone;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block animate-pulse rounded-md",
        tone === "dark" ? "bg-white/10" : "bg-neutral-200",
        className,
      )}
    />
  );
}

function LoadingLabel() {
  return <span className="sr-only">콘텐츠를 불러오는 중입니다.</span>;
}

function PageIntroSkeleton({ tone = "light" }: { tone?: SkeletonTone }) {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-4 w-28" tone={tone} />
      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-full max-w-[520px]" tone={tone} />
        <SkeletonBlock className="h-9 w-3/4 max-w-[420px]" tone={tone} />
      </div>
    </div>
  );
}

function FilterSkeleton({ tone = "light" }: { tone?: SkeletonTone }) {
  const widths = ["w-28", "w-36", "w-32", "w-40"];

  return (
    <div className="flex max-w-full gap-2 overflow-hidden" aria-hidden="true">
      {widths.map((width) => (
        <SkeletonBlock
          className={cn("h-11 shrink-0 rounded-full", width)}
          key={width}
          tone={tone}
        />
      ))}
    </div>
  );
}

function NewsRowSkeleton() {
  return (
    <div className="grid gap-5 border-b border-neutral-200 py-7 md:grid-cols-[160px_minmax(0,1fr)_96px] md:items-center">
      <SkeletonBlock className="h-5 w-24" />
      <div className="space-y-3">
        <SkeletonBlock className="h-6 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
      <SkeletonBlock className="h-4 w-20 md:ml-auto" />
    </div>
  );
}

function CardSkeleton({ mediaRatio = "aspect-4/3" }: { mediaRatio?: string }) {
  return (
    <div className="min-w-0 overflow-hidden border border-neutral-200 bg-white">
      <SkeletonBlock className={cn("w-full rounded-none", mediaRatio)} />
      <div className="space-y-3 p-5">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-6 w-full" />
        <SkeletonBlock className="h-4 w-4/5" />
      </div>
    </div>
  );
}

function ExamResultCardSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-300 bg-white">
      <SkeletonBlock className="aspect-270/268 w-full rounded-none" />
      <div className="p-5">
        <SkeletonBlock className="h-5 w-4/5" />
      </div>
    </div>
  );
}

function ExamPassedReviewCardSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <SkeletonBlock className="aspect-[67/62] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <SkeletonBlock className="h-4 w-4/5" />
        <SkeletonBlock className="h-5 w-2/3" />
      </div>
    </div>
  );
}

function VideoCardSkeleton({ tone = "light" }: { tone?: SkeletonTone }) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden border",
        tone === "dark"
          ? "border-white/10 bg-white/6"
          : "border-neutral-200 bg-white",
      )}
    >
      <SkeletonBlock className="aspect-video w-full rounded-none" tone={tone} />
      <div className="space-y-3 p-5">
        <SkeletonBlock className="h-4 w-24" tone={tone} />
        <SkeletonBlock className="h-5 w-4/5" tone={tone} />
      </div>
    </div>
  );
}

function DarkContentGridSkeleton({ cardCount = 8 }: { cardCount?: number }) {
  return (
    <section className="section-p-block-base text-white">
      <div className="container">
        <div className="mb-14 md:mb-20">
          <PageIntroSkeleton tone="dark" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cardCount }).map((_, index) => (
            <VideoCardSkeleton key={index} tone="dark" />
          ))}
        </div>
      </div>
    </section>
  );
}

function EducationHeroLoadingSkeleton({
  center,
  decoSeed,
  imageClassName = "opacity-70 grayscale",
  overlayClassName = "bg-black/70",
  sectionClassName,
  titleRows = 2,
}: {
  center: CenterSlug;
  decoSeed: string;
  imageClassName?: string;
  overlayClassName?: string;
  sectionClassName: string;
  titleRows?: 2 | 3;
}) {
  const decoIcons = getPageDecoIcons(2, decoSeed);

  return (
    <section
      aria-label="페이지 상단 콘텐츠 로딩"
      className={cn(
        "relative min-h-140 overflow-hidden bg-black md:min-h-200",
        sectionClassName,
      )}
      data-page-tone="dark"
    >
      <PageHeroImage
        image={getEducationHeroImage(center)}
        className={imageClassName}
      />
      <div
        aria-hidden="true"
        className={cn("absolute inset-0", overlayClassName)}
      />
      <PageDeco
        className="-left-24 top-[42%] md:-left-28"
        icon={decoIcons[0]}
      />
      <PageDeco
        className="right-[-72px] top-[16%] md:right-[-104px]"
        icon={decoIcons[1]}
      />
      <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[142px]">
        <div className="space-y-4">
          <SkeletonBlock className="h-10 w-28" tone="dark" />
          <SkeletonBlock className="h-16 w-[min(72vw,420px)]" tone="dark" />
          {titleRows === 3 ? (
            <SkeletonBlock className="h-16 w-[min(64vw,340px)]" tone="dark" />
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CurriculumLoadingSkeleton() {
  return (
    <main
      aria-busy="true"
      className="page page-light page-curriculum"
      data-center="art"
    >
      <LoadingLabel />
      <EducationHeroLoadingSkeleton
        center="art"
        decoSeed="curriculum-loading"
        sectionClassName="section-curriculum-hero"
      />

      <section className="section-curriculum-search bg-neutral-950 py-6 text-white md:py-8">
        <div className="container grid gap-6 lg:grid-cols-[177px_minmax(0,1fr)] lg:items-center">
          <div className="space-y-3">
            <SkeletonBlock className="h-7 w-24" tone="dark" />
            <SkeletonBlock className="h-4 w-32" tone="dark" />
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock
                className="h-16 rounded-none bg-white/8"
                key={index}
                tone="dark"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-curriculum-list section-p-b-base bg-white pt-14 text-neutral-900 md:pt-20">
        <div className="container">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="min-h-[429px] rounded-xl border border-neutral-200 bg-neutral-50 p-8"
                key={index}
              >
                <div className="flex items-center gap-4">
                  <SkeletonBlock className="size-8 rounded-sm" />
                  <SkeletonBlock className="h-4 w-32" />
                </div>
                <div className="mt-9 space-y-3">
                  <SkeletonBlock className="h-8 w-full" />
                  <SkeletonBlock className="h-8 w-4/5" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
                <div className="mt-22 flex items-center justify-between gap-3">
                  <SkeletonBlock className="h-10 w-24 rounded-full" />
                  <div className="flex gap-1">
                    <SkeletonBlock className="h-10 w-12 rounded-full" />
                    <SkeletonBlock className="h-10 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ExamPassedVideosLoadingSkeleton() {
  const decoIcons = getPageDecoIcons(3, "exam-passed-videos-loading");

  return (
    <main
      aria-busy="true"
      className="page page-light page-exam-passed-videos"
      data-center="exam"
    >
      <LoadingLabel />
      <section
        aria-label="합격영상 상단 콘텐츠 로딩"
        className="section-exam-passed-videos-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <PageHeroImage
          image={getExamPassedHeroImage()}
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[36%] md:block md:-left-72 2xl:-left-39"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[16%] bottom-[-8%] md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[120px]">
          <div className="space-y-4">
            <SkeletonBlock className="h-10 w-36" tone="dark" />
            <SkeletonBlock className="h-16 w-[min(72vw,460px)]" tone="dark" />
          </div>
        </div>
      </section>

      <section className="section-exam-passed-videos-list section-p-block-base bg-white text-neutral-900">
        <div className="container">
          <div className="mb-16 md:mb-20">
            <PageIntroSkeleton />
          </div>
          <div className="mx-auto grid w-full max-w-280 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <VideoCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function RookiesLoadingSkeleton() {
  const decoIcons = getPageDecoIcons(3, "rookies-loading");

  return (
    <main
      aria-busy="true"
      className="page page-light page-rookies-archive"
      data-center="art"
      data-page-tone="dark"
    >
      <LoadingLabel />
      <section
        aria-label="BNB 루키 상단 콘텐츠 로딩"
        className="section-rookies-hero"
      >
        <PageHeroImage
          image={getArtistHeroImage("art")}
          className="section-rookies-hero__background"
        />
        <div aria-hidden="true" className="section-rookies-hero__overlay" />
        <PageDeco
          className="section-rookies-hero__deco section-rookies-hero__deco--left"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="section-rookies-hero__deco section-rookies-hero__deco--center"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="section-rookies-hero__deco section-rookies-hero__deco--right"
          icon={decoIcons[2]}
        />
        <div className="section-rookies-hero__content space-y-4">
          <SkeletonBlock className="h-10 w-32" tone="dark" />
          <SkeletonBlock className="h-16 w-full max-w-[420px]" tone="dark" />
        </div>
      </section>

      <section className="section-rookies-list">
        <div className="section-rookies-list__container">
          <div className="section-rookies-list__head">
            <PageIntroSkeleton />
          </div>
          <div className="mb-10">
            <FilterSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <CardSkeleton key={index} mediaRatio="aspect-3/4" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ScheduleLoadingSkeleton() {
  const decoIcons = getPageDecoIcons(3, "schedule-loading");

  return (
    <main
      aria-busy="true"
      className="page page-light page-schedule"
      data-center="art"
    >
      <LoadingLabel />
      <section
        aria-label="촬영ㆍ오디션 스케줄 상단 콘텐츠 로딩"
        className="section-schedule-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-center opacity-60"
          fill
          priority
          sizes="100vw"
          src={scheduleHeroImage}
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[36%] md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[12%] md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[18%] bottom-[-8%] md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[142px]">
          <div className="space-y-4">
            <SkeletonBlock className="h-10 w-28" tone="dark" />
            <SkeletonBlock className="h-16 w-[min(72vw,460px)]" tone="dark" />
          </div>
        </div>
      </section>

      <section className="section-schedule-calendar section-p-block-base bg-white text-neutral-900">
        <div className="container">
          <div className="mb-10 md:mb-16">
            <PageIntroSkeleton />
          </div>
          <div className="flex items-center justify-between gap-4 border-y border-neutral-200 py-5">
            <SkeletonBlock className="size-10 rounded-full" />
            <SkeletonBlock className="h-8 w-36" />
            <SkeletonBlock className="size-10 rounded-full" />
          </div>
          <div className="mt-10 hidden overflow-hidden border border-neutral-200 min-[769px]:block">
            <div className="grid grid-cols-7 border-b border-neutral-200 bg-white">
              {Array.from({ length: 7 }).map((_, index) => (
                <SkeletonBlock className="m-3 h-4 rounded-sm" key={index} />
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, index) => (
                <div
                  className="min-h-32 border-r border-b border-neutral-200 p-3 lg:min-h-38"
                  key={index}
                >
                  <SkeletonBlock className="h-4 w-6" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 space-y-3 min-[769px]:hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock className="h-20 rounded-none" key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function SpecialLectureLoadingSkeleton() {
  return (
    <main
      aria-busy="true"
      className="page page-dark page-special-lecture"
      data-center="highteen"
    >
      <LoadingLabel />
      <EducationHeroLoadingSkeleton
        center="highteen"
        decoSeed="highteen-special-lecture-loading"
        imageClassName="opacity-45 grayscale"
        overlayClassName="bg-black/65"
        sectionClassName="section-special-lecture-hero"
        titleRows={3}
      />
      <DarkContentGridSkeleton cardCount={8} />
    </main>
  );
}

export function NewsArchiveLoadingSkeleton() {
  return (
    <main
      aria-busy="true"
      className="page page-light page-news-archive page-top-offset"
    >
      <LoadingLabel />
      <section
        aria-label="뉴스 목록 콘텐츠 로딩"
        className="section-news-list section-p-block-base"
      >
        <div className="section-news-list__container">
          <div className="section-news-list__head">
            <PageIntroSkeleton />
          </div>
          <div className="section-news-list__tabs">
            <FilterSkeleton />
          </div>
          <div className="section-news-list__items">
            {Array.from({ length: 5 }).map((_, index) => (
              <NewsRowSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function HeroArchiveLoadingSkeleton({
  cardCount = 12,
  kind,
  showTabs = false,
}: {
  cardCount?: number;
  kind: "artist-press" | "direct-castings" | "screen-appearances";
  showTabs?: boolean;
}) {
  const pageClassNameByKind: Record<
    "artist-press" | "direct-castings" | "screen-appearances",
    string
  > = {
    "artist-press": "page-artist-press-archive",
    "direct-castings": "page-direct-castings",
    "screen-appearances": "page-screen-appearances",
  };
  const usesMosaicDim =
    kind === "direct-castings" || kind === "screen-appearances";
  const heroHeightClassName =
    kind === "artist-press"
      ? "min-h-[620px] md:min-h-200"
      : "min-h-140 md:min-h-200";

  return (
    <main
      aria-busy="true"
      className={cn("page page-light", pageClassNameByKind[kind])}
    >
      <LoadingLabel />
      <section
        aria-label="페이지 상단 콘텐츠 로딩"
        className={cn("relative overflow-hidden bg-black", heroHeightClassName)}
        data-page-tone="dark"
      >
        <div
          aria-hidden="true"
          className="absolute -inset-x-8 -top-12 grid grid-cols-3 gap-2 opacity-70 md:-inset-x-12 md:-top-24 md:grid-cols-6 md:rotate-[-5.5deg] md:scale-110 md:gap-4"
        >
          {Array.from({ length: 24 }).map((_, index) => (
            <SkeletonBlock
              className="aspect-4/3 rounded-md bg-white/10"
              key={index}
              tone="dark"
            />
          ))}
        </div>
        {usesMosaicDim ? (
          <HeroMosaicDim />
        ) : (
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        )}
        <div
          className={cn(
            "container relative z-10 flex items-end pb-20 pt-32 md:pb-[120px]",
            heroHeightClassName,
          )}
        >
          <div className="space-y-4">
            <SkeletonBlock className="h-9 w-32" tone="dark" />
            <SkeletonBlock className="h-14 w-[min(70vw,420px)]" tone="dark" />
          </div>
        </div>
      </section>

      <section className="section-p-block-base bg-white text-neutral-900">
        <div className="container">
          <div className="mb-12 md:mb-16">
            <PageIntroSkeleton />
          </div>
          {showTabs && (
            <div className="mb-10 border-b border-neutral-200 pb-5 md:mb-12">
              <FilterSkeleton />
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: cardCount }).map((_, index) => (
              <CardSkeleton
                key={index}
                mediaRatio={
                  kind === "direct-castings" ? "aspect-3/4" : "aspect-4/3"
                }
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ExamResultsLoadingSkeleton({
  resultType,
}: {
  resultType: "arts_high_school" | "university";
}) {
  const decoIcons = getPageDecoIcons(3, `exam-results-loading-${resultType}`);

  return (
    <main
      aria-busy="true"
      className="page page-light page-exam-results"
      data-center="exam"
    >
      <LoadingLabel />
      <section
        aria-label="합격현황 상단 콘텐츠 로딩"
        className="section-exam-results-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <PageHeroImage
          image={getExamResultsHeroImage()}
          className="opacity-60"
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[36%] md:block md:-left-72 2xl:-left-39"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[16%] bottom-[-8%] md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[120px]">
          <div className="space-y-4">
            <SkeletonBlock className="h-10 w-36" tone="dark" />
            <SkeletonBlock className="h-16 w-[min(72vw,420px)]" tone="dark" />
          </div>
        </div>
      </section>

      <section className="section-exam-results-list section-p-block-base bg-white text-neutral-900">
        <div className="container">
          <div className="mb-16 md:mb-20">
            <PageIntroSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <ExamResultCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ExamPassedReviewsLoadingSkeleton() {
  const decoIcons = getPageDecoIcons(3, "exam-passed-reviews-loading");

  return (
    <main
      aria-busy="true"
      className="page page-light page-exam-passed-reviews"
      data-center="exam"
    >
      <LoadingLabel />
      <section
        aria-label="합격후기 상단 콘텐츠 로딩"
        className="section-exam-passed-reviews-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <PageHeroImage
          image={getExamPassedHeroImage()}
          className="opacity-60"
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[36%] md:block md:-left-72 2xl:-left-39"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[16%] bottom-[-8%] md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[120px]">
          <div className="space-y-4">
            <SkeletonBlock className="h-10 w-36" tone="dark" />
            <SkeletonBlock className="h-16 w-[min(72vw,460px)]" tone="dark" />
          </div>
        </div>
      </section>

      <section className="section-exam-passed-reviews-list section-p-block-base bg-white text-neutral-900">
        <div className="container">
          <div className="mb-16 md:mb-20">
            <PageIntroSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <ExamPassedReviewCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function GenericArchiveLoadingSkeleton({
  cardCount = 8,
  pageClassName,
}: {
  cardCount?: number;
  pageClassName: string;
}) {
  return (
    <main
      aria-busy="true"
      className={cn("page page-light page-top-offset", pageClassName)}
    >
      <LoadingLabel />
      <section className="section-p-block-base">
        <div className="container">
          <div className="mb-12 md:mb-16">
            <PageIntroSkeleton />
          </div>
          <div className="mb-10">
            <FilterSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: cardCount }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function DetailLoadingSkeleton({
  media = false,
  tone = "light",
  wide = false,
}: {
  media?: boolean;
  tone?: SkeletonTone;
  wide?: boolean;
}) {
  const containerClassName = wide ? "container" : "container-sm";

  return (
    <article
      aria-busy="true"
      className={cn(
        "page page-detail page-top-offset",
        tone === "dark" ? "page-dark" : "page-light",
      )}
    >
      <LoadingLabel />
      <section className="section-detail section-p-block-base">
        <div className={cn(containerClassName, "mb-10")}>
          <div
            className={cn(
              "border-b-2 pb-7",
              tone === "dark" ? "border-white" : "border-foreground",
            )}
          >
            <SkeletonBlock className="h-6 w-36" tone={tone} />
          </div>
        </div>

        <div className={containerClassName}>
          <header className="mb-10 space-y-6 md:mb-16">
            <div className="flex items-start justify-between gap-8">
              <SkeletonBlock className="h-4 w-28" tone={tone} />
              <SkeletonBlock className="h-4 w-24" tone={tone} />
            </div>
            <div className="space-y-3">
              <SkeletonBlock
                className="h-10 w-full max-w-[720px]"
                tone={tone}
              />
              <SkeletonBlock className="h-10 w-2/3 max-w-[520px]" tone={tone} />
            </div>
            <SkeletonBlock className="h-5 w-3/4 max-w-[560px]" tone={tone} />
          </header>

          {media ? (
            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
              <div className="space-y-3">
                <SkeletonBlock
                  className="aspect-[55/64] w-full rounded-none"
                  tone={tone}
                />
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonBlock
                      className="aspect-square w-full rounded-none"
                      key={index}
                      tone={tone}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                {Array.from({ length: 7 }).map((_, index) => (
                  <SkeletonBlock
                    className={cn("h-5", index % 3 === 0 ? "w-full" : "w-4/5")}
                    key={index}
                    tone={tone}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <SkeletonBlock
                className="aspect-video w-full rounded-none"
                tone={tone}
              />
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonBlock
                  className={cn("h-5", index % 3 === 0 ? "w-full" : "w-5/6")}
                  key={index}
                  tone={tone}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </article>
  );
}
