import type { Metadata } from 'next'
import type { CSSProperties } from 'react'

import { ConsultationForm } from './ConsultationForm'
import {
  type ConsultationSearchParams,
  resolveInitialInquiryType,
} from './inquiryTypeParams'

export const metadata: Metadata = {
  title: '상담하기',
  description: '배우앤배움 상담하기',
}

type ConsultPageProps = {
  searchParams?: Promise<ConsultationSearchParams>
}

export default async function ConsultPage({ searchParams }: ConsultPageProps) {
  const initialInquiryType = resolveInitialInquiryType(await searchParams)

  return (
    <main className="page page-light page-consult pb-24" style={consultLightThemeVars}>
      <section className="relative min-h-[520px] overflow-hidden bg-foreground text-background">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-[position:66%_28%] opacity-55"
          style={{
            backgroundImage:
              "url('/legacy/profiles/bnbhighteen/new_profile/763/3717534017_zki7HX3s_3cabfdf80584ec76f59e95abfd9b9157512a5ee7.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-foreground/45" />
        <div className="container relative flex min-h-[520px] flex-col justify-end pb-14 pt-36">
          <div className="page-heading page-hero-dark max-w-3xl">
            <p className="page-eyebrow uppercase tracking-[0.14em]">
              Consultation
            </p>
            <h1 className="page-title">상담하기</h1>
            <p className="page-desc max-w-2xl">
              배우앤배움의 센터별 상담과 제휴 문의를 한 페이지에서 신청할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="container grid gap-5 py-8 md:grid-cols-3">
          <InfoItem label="문의유형" value="아트 · 입시 · 하이틴 · 키즈 · 애비뉴 · 제휴" />
          <InfoItem label="예약방식" value="희망일과 시간 선택" />
          <InfoItem label="진행상태" value="상담 문의 저장 연결" />
        </div>
      </section>

      <section className="container section-p-block-sm">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <p className="type-label-m font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Request
            </p>
            <h2 className="mt-3 type-headline-l font-semibold tracking-normal">상담 신청</h2>
            <p className="mt-4 type-body-s leading-7 text-muted-foreground">
              문의 유형에 따라 필요한 항목만 표시됩니다. 센터별 상담과 제휴 신청을 같은
              양식에서 확인합니다.
            </p>
          </aside>

          <div className="rounded-lg border bg-background p-5 shadow-xs md:p-8">
            <ConsultationForm initialInquiryType={initialInquiryType} />
          </div>
        </div>
      </section>
    </main>
  )
}

const consultLightThemeVars = {
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
      <p className="type-body-s text-muted-foreground">{label}</p>
      <p className="type-title-s font-semibold">{value}</p>
    </div>
  )
}
