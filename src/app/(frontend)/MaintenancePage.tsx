import Image from 'next/image'
import { Phone } from 'lucide-react'

import {
  maintenanceMessage,
  maintenanceTitle,
  type MaintenanceSettings,
} from '@/SiteSettings/maintenance'

export function MaintenancePage({ settings }: { settings: MaintenanceSettings | null }) {
  const title = maintenanceTitle(settings)
  const message = maintenanceMessage(settings)

  return (
    <main className="page page-dark page-maintenance min-h-[calc(100svh-var(--admin-bar-height,0))] text-white">
      <section
        aria-labelledby="maintenance-title"
        className="section-maintenance flex min-h-[inherit] items-center section-p-block-base"
      >
        <div className="container-sm flex flex-col items-center text-center">
          <Image
            alt="배우앤배움"
            className="section-maintenance__logo h-auto w-30"
            height={24}
            priority
            src="/assets/common/logo/logo-enm.svg"
            width={128}
          />

          <h1
            className="section-maintenance__title mt-8 type-headline-l font-extrabold text-foreground"
            id="maintenance-title"
          >
            {title}
          </h1>
          <p className="section-maintenance__message mt-5 max-w-140 text-balance type-body-m leading-normal text-muted-foreground">
            {message}
          </p>
          <div className="section-maintenance__contact mt-12 w-full max-w-140 border-t border-white/15 pt-8">
            <p className="type-label-m font-bold text-muted-foreground">고객센터 안내</p>
            <a
              className="mt-3 inline-flex items-center justify-center gap-2 type-title-l font-extrabold text-foreground transition-colors hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="tel:15779929"
            >
              <Phone aria-hidden="true" className="size-5" strokeWidth={2.4} />
              <span>1577-9929</span>
            </a>
            <p className="mt-3 type-body-s leading-normal text-muted-foreground">
              점검 중 문의가 필요하시면 대표전화로 연락해 주세요.
              <br className="hidden sm:block" />
              평일 09:30 ~ 19:30 · 주말 09:30 ~ 16:00
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
