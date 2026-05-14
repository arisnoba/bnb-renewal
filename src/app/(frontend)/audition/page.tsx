import type { Metadata } from 'next'
import type { CSSProperties } from 'react'

import { AuditionForm } from './AuditionForm'
import { AuditionLightTheme } from './AuditionLightTheme'

export const metadata: Metadata = {
  title: '오디션 지원하기',
  description: '배우앤배움 오디션 지원하기',
}

export default function AuditionPage() {
  return (
    <main className="bg-background pb-24 text-foreground" style={auditionLightThemeVars}>
      <AuditionLightTheme />
      <section className="relative min-h-[520px] overflow-hidden bg-foreground text-background">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-[position:72%_26%] opacity-55"
          style={{
            backgroundImage:
              "url('/legacy/profiles/bnbhighteen/new_profile/763/3717534017_zki7HX3s_3cabfdf80584ec76f59e95abfd9b9157512a5ee7.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-foreground/45" />
        <div className="container relative flex min-h-[520px] flex-col justify-end pb-14 pt-36">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-background/75">
              Casting Audition
            </p>
            <h1 className="text-5xl font-semibold tracking-normal md:text-7xl">
              오디션 지원하기
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-background/80 md:text-lg">
              드라마 캐스팅 에이전시와 광고 모델 캐스팅 에이전시에서 재능있는 배우를 찾습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="container grid gap-5 py-8 md:grid-cols-3">
          <InfoItem label="모집분야" value="연기자" />
          <InfoItem label="모집기간" value="상시접수" />
          <InfoItem label="지원자격" value="20세 이상 39세 이하 신인 또는 경력자" />
        </div>
      </section>

      <section className="container mt-14">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Application
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">오디션신청</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              필수 항목을 입력하고 프로필 자료를 첨부해 주세요. 1차 서류전형은 합격자에 한해
              개별 통보합니다.
            </p>
          </aside>

          <div className="rounded-lg border bg-background p-5 shadow-xs md:p-8">
            <AuditionForm />
          </div>
        </div>
      </section>
    </main>
  )
}

const auditionLightThemeVars = {
  '--background': 'oklch(100% 0 0deg)',
  '--foreground': 'oklch(14.5% 0 0deg)',
  '--card': 'oklch(96.5% 0.005 265deg)',
  '--card-foreground': 'oklch(14.5% 0 0deg)',
  '--popover': 'oklch(100% 0 0deg)',
  '--popover-foreground': 'oklch(14.5% 0 0deg)',
  '--primary': 'oklch(20.5% 0 0deg)',
  '--primary-foreground': 'oklch(98.5% 0 0deg)',
  '--secondary': 'oklch(97% 0 0deg)',
  '--secondary-foreground': 'oklch(20.5% 0 0deg)',
  '--muted': 'oklch(97% 0 0deg)',
  '--muted-foreground': 'oklch(55.6% 0 0deg)',
  '--accent': 'oklch(97% 0 0deg)',
  '--accent-foreground': 'oklch(20.5% 0 0deg)',
  '--destructive': 'oklch(57.7% 0.245 27.325deg)',
  '--border': 'oklch(92.2% 0 0deg)',
  '--input': 'oklch(92.2% 0 0deg)',
  '--ring': 'oklch(70.8% 0 0deg)',
  '--success': 'oklch(78% 0.08 200deg)',
} as CSSProperties

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  )
}
