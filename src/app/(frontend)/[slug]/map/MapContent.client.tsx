'use client'

import type { CenterSlug } from '@/lib/centers'

import { centerLocationList, centerLocations } from '@/lib/centerLocations'
import { cn } from '@/utilities/ui'
import { MapPin, Phone, Printer } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { NaverMap } from './NaverMap.client'

type MapContentProps = {
  initialCenter: CenterSlug
  scriptUrl: string | null
}

export function MapContent({ initialCenter, scriptUrl }: MapContentProps) {
  const [selectedCenter, setSelectedCenter] = useState(initialCenter)
  const selectedLocation = centerLocations[selectedCenter]

  return (
    <section className="container section-p-block-base" data-center={selectedCenter}>
      <div className="mb-[60px] flex flex-col gap-10">
        <div>
          <p className="mb-10 type-title-l font-bold leading-[1.4] text-brand">오시는 길</p>
          <h2 className="font-['Pyeojin_Gothic','Pretendard',sans-serif] type-display-l font-bold leading-[1.25] tracking-normal md:leading-[1.35]">
            배우의 가능성이 완성되는 공간
            <br />
            {selectedLocation.name}
          </h2>
        </div>

        <nav aria-label="센터 선택" className="flex flex-wrap gap-3">
          {centerLocationList.map((location) => {
            const isSelected = location.slug === selectedCenter

            return (
              <button
                aria-current={isSelected ? 'page' : undefined}
                className={cn(
                  'inline-flex h-[45px] items-center justify-center rounded-full border px-5 type-title-m font-bold leading-[1.4] transition-[border-color,background-color,color,opacity]',
                  isSelected
                    ? 'border-brand bg-brand text-white'
                    : 'border-white bg-transparent text-white opacity-40 hover:opacity-80',
                )}
                key={location.slug}
                onClick={() => setSelectedCenter(location.slug)}
                type="button"
              >
                {location.tabLabel}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-6">
        <NaverMap location={selectedLocation} scriptUrl={scriptUrl} />
        <CenterInfoCard location={selectedLocation} />
      </div>
    </section>
  )
}

function CenterInfoCard({ location }: { location: (typeof centerLocationList)[number] }) {
  return (
    <section className="section-map-info flex flex-col gap-8 rounded-xl bg-neutral-900 p-6 md:p-8 lg:flex-row lg:items-start">
      <div className="section-map-info__summary flex min-w-0 flex-col gap-6 md:flex-row lg:w-[631px] lg:shrink-0">
        <div className="relative size-[148px] shrink-0 overflow-hidden rounded-xl bg-neutral-600">
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="148px"
            src="/assets/map/map-hero.png"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {location.logoSrc ? (
            <Image
              alt={location.name}
              className="h-8 w-[120px] object-contain object-left"
              height={36}
              src={location.logoSrc}
              width={120}
            />
          ) : (
            <p className="type-title-m font-bold leading-[1.4] text-white">{location.tabLabel}</p>
          )}
          <div className="flex flex-col gap-2 type-body-s leading-normal text-white">
            <h3 className="font-bold">{location.name}</h3>
            <p className="text-white/60">{location.summary}</p>
          </div>
        </div>
      </div>

      <div className="section-map-info__details flex min-w-0 flex-1 flex-col gap-6 border-white/10 pt-8 md:border-t lg:border-l lg:border-t-0 lg:py-0 lg:pl-10">
        <InfoItem icon={<MapPin aria-hidden="true" size={18} />} label="주소">
          {location.address}
        </InfoItem>
        <InfoItem icon={<Phone aria-hidden="true" size={18} />} label="전화">
          {location.phone}
        </InfoItem>
        {location.fax ? (
          <InfoItem icon={<Printer aria-hidden="true" size={18} />} label="팩스">
            {location.fax}
          </InfoItem>
        ) : null}
      </div>
    </section>
  )
}

function InfoItem({
  children,
  icon,
  label,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex min-w-0 gap-6 type-body-s leading-normal text-white">
      <div className="flex w-14 shrink-0 items-center gap-3 font-bold">
        <span className="text-neutral-600">{icon}</span>
        <h3>{label}</h3>
      </div>
      <p className="min-w-0 flex-1 text-white/60">{children}</p>
    </div>
  )
}
