import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { centers } from '@/lib/centers'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '테스트 페이지',
}

const publicTestPages = [
  {
    description: '최근 마이그레이션된 뉴스 컬렉션 공개 목록',
    href: '/news',
    label: '뉴스',
  },
  {
    description: '출신 아티스트 언론/소개 콘텐츠 공개 목록',
    href: '/artist-press',
    label: '출신 아티스트',
  },
  {
    description: '게시글 템플릿 목록',
    href: '/posts',
    label: '게시글',
  },
  {
    description: '프론트 검색 화면',
    href: '/search',
    label: '검색',
  },
]

const centerNewsPages = Object.entries(centers).map(([slug, label]) => ({
  description: `${label} 전용 뉴스 목록`,
  href: `/${slug}/news`,
  label: `${label} 뉴스`,
}))

const testGroups = [
  {
    description: '현재 프론트에서 직접 확인할 수 있는 공개 페이지입니다.',
    links: publicTestPages,
    title: '공개 페이지',
  },
  {
    description: '센터 필터가 적용된 뉴스 목록입니다.',
    links: centerNewsPages,
    title: '센터별 뉴스',
  },
]

export default function TestPage() {
  return (
    <main className="pt-24 pb-24">
      <section className="container">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Test Pages
          </p>
          <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">테스트 페이지</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            개발 중인 프론트 화면을 한 곳에서 빠르게 확인할 수 있습니다.
          </p>
        </div>
      </section>

      <div className="container mt-12 grid gap-12">
        {testGroups.map((group) => (
          <section key={group.title}>
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-normal">{group.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.links.map((link) => (
                <Button
                  asChild
                  className="h-auto justify-start rounded-lg border-border bg-card px-5 py-4 text-left text-card-foreground shadow-none hover:bg-accent"
                  key={link.href}
                  variant="outline"
                >
                  <Link href={link.href}>
                    <span className="grid gap-1">
                      <span className="text-base font-semibold">{link.label}</span>
                      <span className="whitespace-normal text-sm font-normal leading-6 text-muted-foreground">
                        {link.description}
                      </span>
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        {link.href}
                      </span>
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
