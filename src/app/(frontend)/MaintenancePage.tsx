import Image from 'next/image'
import { Wrench } from 'lucide-react'

import {
  maintenanceMessage,
  maintenanceTitle,
  type MaintenanceSettings,
} from '@/SiteSettings/maintenance'

export function MaintenancePage({ settings }: { settings: MaintenanceSettings | null }) {
  const title = maintenanceTitle(settings)
  const message = maintenanceMessage(settings)

  return (
    <main className="page page-light page-maintenance min-h-[calc(100svh_-_var(--admin-bar-height,0px))] bg-white text-neutral-950">
      <section
        aria-labelledby="maintenance-title"
        className="section-maintenance flex min-h-[inherit] items-center bg-white section-p-block-base"
      >
        <div className="container-sm flex flex-col items-center text-center">
          <Image
            alt="배우앤배움"
            className="section-maintenance__logo h-auto w-40"
            height={42}
            priority
            src="/assets/common/logo/logo-art.svg"
            width={160}
          />
          <div className="section-maintenance__icon mt-14 grid size-16 place-items-center rounded-full bg-neutral-950 text-white">
            <Wrench aria-hidden="true" className="size-7" strokeWidth={2.2} />
          </div>
          <p className="section-maintenance__eyebrow mt-7 type-label-m font-bold text-muted-foreground">
            Maintenance
          </p>
          <h1
            className="section-maintenance__title mt-4 type-headline-l font-extrabold text-foreground"
            id="maintenance-title"
          >
            {title}
          </h1>
          <p className="section-maintenance__message mt-5 max-w-[560px] type-body-m leading-normal text-muted-foreground">
            {message}
          </p>
        </div>
      </section>
    </main>
  )
}
