import { cn } from '@/utilities/ui'

type SkeletonTone = 'dark' | 'light'

function SkeletonBlock({
  className,
  tone = 'light',
}: {
  className?: string
  tone?: SkeletonTone
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block animate-pulse rounded-md',
        tone === 'dark' ? 'bg-white/10' : 'bg-neutral-200',
        className,
      )}
    />
  )
}

function LoadingLabel() {
  return <span className="sr-only">콘텐츠를 불러오는 중입니다.</span>
}

function PageIntroSkeleton({ tone = 'light' }: { tone?: SkeletonTone }) {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-4 w-28" tone={tone} />
      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-full max-w-[520px]" tone={tone} />
        <SkeletonBlock className="h-9 w-3/4 max-w-[420px]" tone={tone} />
      </div>
    </div>
  )
}

function FilterSkeleton({ tone = 'light' }: { tone?: SkeletonTone }) {
  const widths = ['w-28', 'w-36', 'w-32', 'w-40']

  return (
    <div className="flex max-w-full gap-2 overflow-hidden" aria-hidden="true">
      {widths.map((width) => (
        <SkeletonBlock className={cn('h-11 shrink-0 rounded-full', width)} key={width} tone={tone} />
      ))}
    </div>
  )
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
  )
}

function CardSkeleton({ mediaRatio = 'aspect-4/3' }: { mediaRatio?: string }) {
  return (
    <div className="min-w-0 overflow-hidden border border-neutral-200 bg-white">
      <SkeletonBlock className={cn('w-full rounded-none', mediaRatio)} />
      <div className="space-y-3 p-5">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-6 w-full" />
        <SkeletonBlock className="h-4 w-4/5" />
      </div>
    </div>
  )
}

export function NewsArchiveLoadingSkeleton() {
  return (
    <main aria-busy="true" className="page page-light page-news-archive page-top-offset">
      <LoadingLabel />
      <section aria-label="뉴스 목록 콘텐츠 로딩" className="section-news-list section-p-block-base">
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
  )
}

export function HeroArchiveLoadingSkeleton({
  cardCount = 12,
  kind,
  showTabs = false,
}: {
  cardCount?: number
  kind: 'artist-press' | 'direct-castings' | 'screen-appearances'
  showTabs?: boolean
}) {
  const pageClassNameByKind: Record<
    'artist-press' | 'direct-castings' | 'screen-appearances',
    string
  > = {
    'artist-press': 'page-artist-press-archive',
    'direct-castings': 'page-direct-castings',
    'screen-appearances': 'page-screen-appearances',
  }

  return (
    <main aria-busy="true" className={cn('page page-light', pageClassNameByKind[kind])}>
      <LoadingLabel />
      <section
        aria-label="페이지 상단 콘텐츠 로딩"
        className="relative min-h-[520px] overflow-hidden bg-black md:min-h-[760px]"
        data-page-tone="dark"
      >
        <div
          aria-hidden="true"
          className="absolute -inset-x-8 -top-12 grid grid-cols-3 gap-2 opacity-70 md:-inset-x-12 md:-top-24 md:grid-cols-6 md:rotate-[-5.5deg] md:scale-110 md:gap-4"
        >
          {Array.from({ length: 24 }).map((_, index) => (
            <SkeletonBlock className="aspect-4/3 rounded-md bg-white/10" key={index} tone="dark" />
          ))}
        </div>
        <div className="absolute inset-0 bg-black/65" aria-hidden="true" />
        <div className="container relative z-10 flex min-h-[520px] items-end pb-18 pt-32 md:min-h-[760px] md:pb-[120px]">
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
              <CardSkeleton key={index} mediaRatio={kind === 'direct-castings' ? 'aspect-3/4' : 'aspect-4/3'} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export function GenericArchiveLoadingSkeleton({
  cardCount = 8,
  pageClassName,
}: {
  cardCount?: number
  pageClassName: string
}) {
  return (
    <main aria-busy="true" className={cn('page page-light page-top-offset', pageClassName)}>
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
  )
}

export function DetailLoadingSkeleton({
  media = false,
  tone = 'light',
  wide = false,
}: {
  media?: boolean
  tone?: SkeletonTone
  wide?: boolean
}) {
  const containerClassName = wide ? 'container' : 'container-sm'

  return (
    <article
      aria-busy="true"
      className={cn(
        'page page-detail page-top-offset',
        tone === 'dark' ? 'page-dark' : 'page-light',
      )}
    >
      <LoadingLabel />
      <section className="section-detail section-p-block-base">
        <div className={cn(containerClassName, 'mb-10')}>
          <div className={cn('border-b-2 pb-7', tone === 'dark' ? 'border-white' : 'border-foreground')}>
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
              <SkeletonBlock className="h-10 w-full max-w-[720px]" tone={tone} />
              <SkeletonBlock className="h-10 w-2/3 max-w-[520px]" tone={tone} />
            </div>
            <SkeletonBlock className="h-5 w-3/4 max-w-[560px]" tone={tone} />
          </header>

          {media ? (
            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
              <div className="space-y-3">
                <SkeletonBlock className="aspect-[55/64] w-full rounded-none" tone={tone} />
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonBlock className="aspect-square w-full rounded-none" key={index} tone={tone} />
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                {Array.from({ length: 7 }).map((_, index) => (
                  <SkeletonBlock
                    className={cn('h-5', index % 3 === 0 ? 'w-full' : 'w-4/5')}
                    key={index}
                    tone={tone}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <SkeletonBlock className="aspect-video w-full rounded-none" tone={tone} />
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonBlock
                  className={cn('h-5', index % 3 === 0 ? 'w-full' : 'w-5/6')}
                  key={index}
                  tone={tone}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </article>
  )
}
