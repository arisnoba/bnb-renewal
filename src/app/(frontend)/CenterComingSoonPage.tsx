import Link from 'next/link'
import { House, Phone } from 'lucide-react'

import { Logo } from '@/components/Logo/Logo'
import {
  centerPreparationBadge,
  centerPreparationMessage,
  centerPreparationTitle,
} from '@/lib/centerAvailability'
import { primaryPublicHref } from '@/lib/centerDomains'
import { centerLogoFor } from '@/lib/centerLogos'
import type { CenterSlug } from '@/lib/centers'
import { customerServiceHoursSummary } from '@/lib/customerServiceHours'

export function CenterComingSoonPage({ center }: { center: CenterSlug }) {
  const centerLogo = centerLogoFor(center)

  return (
    <main
      className="page page-dark page-coming-soon min-h-[calc(100svh-var(--admin-bar-height,0))] text-white"
      data-center={center}
    >
      <section
        aria-labelledby="center-coming-soon-title"
        className="section-coming-soon flex min-h-[inherit] items-center section-p-block-base"
      >
        <div className="container-sm flex flex-col items-center text-center">
          <Logo
            {...centerLogo}
            className="section-coming-soon__logo w-auto"
            loading="eager"
            priority="high"
          />
          <p className="section-coming-soon__badge mt-10 inline-flex rounded-full border border-brand/60 px-4 py-2 type-label-s font-bold tracking-[0.16em] text-brand">
            {centerPreparationBadge}
          </p>
          <h1
            className="section-coming-soon__title mt-6 text-balance type-headline-l font-extrabold text-foreground"
            id="center-coming-soon-title"
          >
            {centerPreparationTitle(center)}
          </h1>
          <p className="section-coming-soon__message mt-5 max-w-150 text-balance type-body-m leading-normal text-muted-foreground">
            {centerPreparationMessage}
          </p>

          <div className="section-coming-soon__actions mt-10 flex w-full max-w-120 flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 type-label-m font-bold text-brand-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href={primaryPublicHref()}
              prefetch={false}
            >
              <House aria-hidden="true" className="size-5" strokeWidth={2.2} />
              다른 센터 보기
            </Link>
            <a
              className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-3 type-label-m font-bold text-foreground transition-colors hover:border-white/50 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="tel:15779929"
            >
              <Phone aria-hidden="true" className="size-5" strokeWidth={2.2} />
              1577-9929
            </a>
          </div>

          <p className="section-coming-soon__contact mt-5 type-body-s leading-normal text-muted-foreground">
            오픈 전 문의가 필요하시면 대표전화로 연락해 주세요.
            <br />
            {customerServiceHoursSummary(center)}
          </p>
        </div>
      </section>
    </main>
  )
}
