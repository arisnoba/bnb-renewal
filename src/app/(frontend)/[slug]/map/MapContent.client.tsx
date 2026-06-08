'use client'

import type { CenterSlug } from '@/lib/centers'

import { centerLocationList, centerLocations } from '@/lib/centerLocations'
import { cn } from '@/utilities/ui'
import { MapPin, Phone, Printer } from 'lucide-react'
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
    <section className="container py-20 md:py-[120px]" data-center={selectedCenter}>
      <div className="mb-12 flex flex-col gap-10">
        <div>
          <p className="mb-10 text-xl font-bold leading-[1.4] text-brand">오시는 길</p>
          <h2 className="font-['Pyeojin_Gothic','Pretendard',sans-serif] text-[36px] font-bold leading-[1.25] tracking-normal md:text-5xl md:leading-[1.35]">
            배우의 가능성이 완성되는 공간
            <br />
            {selectedLocation.name}
          </h2>
        </div>

        <nav aria-label="센터 선택" className="flex flex-wrap gap-2">
          {centerLocationList.map((location) => {
            const isSelected = location.slug === selectedCenter

            return (
              <button
                aria-current={isSelected ? 'page' : undefined}
                className={cn(
                  'inline-flex h-11 items-center justify-center border px-5 text-sm font-bold leading-none transition-colors',
                  isSelected
                    ? 'border-brand bg-brand text-white'
                    : 'border-white/10 bg-[#1f1f1f] text-white/60 hover:border-white/30 hover:text-white',
                )}
                key={location.slug}
                onClick={() => setSelectedCenter(location.slug)}
                type="button"
              >
                {location.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-5">
        <NaverMap location={selectedLocation} scriptUrl={scriptUrl} />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.7fr)]">
          <InfoItem icon={<MapPin aria-hidden="true" size={18} />} label="주소">
            {selectedLocation.address}
          </InfoItem>
          <InfoItem icon={<Phone aria-hidden="true" size={18} />} label="전화">
            {selectedLocation.phone}
          </InfoItem>
          <InfoItem icon={<Printer aria-hidden="true" size={18} />} label="팩스">
            {selectedLocation.fax ?? '-'}
          </InfoItem>
        </div>
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
    <section className="flex min-h-[78px] min-w-0 flex-wrap items-center gap-x-7 gap-y-2 rounded-md bg-[#1f1f1f] p-6 md:p-7">
      <div className="flex shrink-0 items-center gap-3 text-white">
        <span className="text-[#4f4f4f]">{icon}</span>
        <h3 className="text-base font-bold leading-[1.5]">{label}</h3>
      </div>
      <p className="min-w-0 text-sm leading-[1.5] text-white/60">{children}</p>
    </section>
  )
}
