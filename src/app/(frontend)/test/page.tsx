import type { Metadata } from 'next'

import { TestNavigation } from './_components/TestNavigation'
import { testNavigationGroups } from './_components/testNavigationData'

export const metadata: Metadata = {
  title: '테스트 페이지',
}

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

      <section className="container mt-10">
        <TestNavigation groups={testNavigationGroups} />
      </section>

      <section className="container mt-10">
        <div className="grid gap-4 md:grid-cols-3">
          {testNavigationGroups.slice(2).map((group) => (
            <div className="rounded-lg border border-border bg-card p-5" key={group.title}>
              <h2 className="text-lg font-semibold tracking-normal">{group.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {group.description}
              </p>
              <p className="mt-4 font-mono text-sm text-muted-foreground">
                {group.links.length}개 페이지
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
