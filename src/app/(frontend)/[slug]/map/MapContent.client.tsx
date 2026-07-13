'use client'

import type { CenterSlug } from '@/lib/centers'

import { WordRotate } from '@/components/ui/word-rotate'
import type { CenterLocation } from '@/lib/centerLocations'
import { cn } from '@/utilities/ui'
import { Building2, MapPin, Phone, Printer } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { NaverMap } from './NaverMap.client'

type MapContentProps = {
  initialCenter: CenterSlug
  locations: CenterLocation[]
  scriptUrl: string | null
}

const campusGalleryItems = [
  { desktopSpan: 'lg:[grid-column:span_6/span_6]', fileName: 'bnb-campus.jpg', label: 'BNB Campus' },
  {
    desktopSpan: 'lg:[grid-column:span_6/span_6]',
    fileName: 'bnb-enm-bnb-art-center.jpg',
    label: 'BNB EnM · BNB Art Center',
  },
  {
    desktopSpan: 'lg:[grid-column:span_6/span_6]',
    fileName: 'bnb-avenue-center-bnb-highteen-center-bnb-cnx.jpg',
    label: 'BNB Avenue Center · BNB Highteen Center · BNB CNX',
  },
  {
    desktopSpan: 'lg:[grid-column:span_6/span_6]',
    fileName: 'bnb-kids-center.jpg',
    label: 'BNB Kids Center',
  },
  {
    desktopSpan: 'lg:[grid-column:span_6/span_6]',
    fileName: 'bnb-exam-center.jpg',
    label: 'BNB Exam Center',
  },
  {
    desktopSpan: 'lg:[grid-column:span_5/span_5]',
    fileName: 'bnb-industry-bnb-casting-bnb-music-fanconn.jpg',
    label: 'BNB Industry · BNB Casting · BNB Music · Fanconn',
  },
  {
    desktopSpan: 'lg:[grid-column:span_5/span_5]',
    fileName: 'bistus-baa-bx-agency-vord-insight-deepcon-x-stream.jpg',
    label: 'Bistus · BAA · BX Agency · Vord Insight · Deepcon · X Stream',
  },
  {
    desktopSpan: 'lg:[grid-column:span_5/span_5]',
    fileName: 'bnb-media-center.jpg',
    label: 'BNB Media Center',
  },
  {
    desktopSpan: 'lg:[grid-column:span_5/span_5]',
    fileName: 'baewoohwa-studio.jpg',
    label: 'Baewoohwa Studio',
  },
  {
    desktopSpan: 'lg:[grid-column:span_5/span_5]',
    fileName: 'bnb-play-town-perfect-performance-ent.jpg',
    label: 'BNB Play Town · Perfect Performance Ent',
  },
  {
    desktopSpan: 'lg:[grid-column:span_5/span_5]',
    fileName: 'bnb-play.jpg',
    label: 'BNB Play',
  },
]

export function MapContent({ initialCenter, locations, scriptUrl }: MapContentProps) {
  const [selectedCenter, setSelectedCenter] = useState(initialCenter)
  const selectedLocation =
    locations.find((location) => location.slug === selectedCenter) ?? locations[0]!

  return (
    <>
      <section aria-labelledby="map-content-title" className="container section-p-block-base">
        <div className="mb-[60px] flex flex-col gap-10">
          <div className="page-heading page-heading--dark">
            <p className="page-eyebrow">오시는 길</p>
            <h1 className="page-title" id="map-content-title">
              배우의 가능성이 완성되는 공간
              <br />
              <WordRotate
                className="block"
                activeWord={selectedLocation.name}
                inline
                motionProps={{
                  initial: { opacity: 0, y: -38 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: 38 },
                  transition: { duration: 0.25, ease: 'easeOut' },
                }}
                words={locations.map((location) => location.name)}
              />
            </h1>
          </div>

          <nav aria-label="센터 선택" className="flex flex-wrap gap-2" data-center={selectedCenter}>
            {locations.map((location) => {
              const isSelected = location.slug === selectedCenter

              return (
                <button
                  aria-current={isSelected ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center justify-center rounded-full border px-4 md:px-5 py-2.5 md:py-3 text-sm md:text-base font-semibold leading-normal transition-[border-color,background-color,color,opacity]',
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
          <NaverMap location={selectedLocation} locations={locations} scriptUrl={scriptUrl} />
          <CenterInfoCard location={selectedLocation} />
        </div>
      </section>

      <CampusGallery />
    </>
  )
}

function CampusGallery() {
  return (
    <section
      aria-labelledby="map-campus-title"
      className="section-map-campus flex flex-col gap-6 pb-20 md:gap-10 md:pb-[120px]"
    >
      <div className="container flex items-center gap-3">
        <Building2 aria-hidden="true" className="size-5 text-brand" strokeWidth={2.4} />
        <h2 className="type-headline-s font-bold leading-[1.2] text-white" id="map-campus-title">
          BNB CAMPUS
        </h2>
      </div>

      <div className="section-map-campus__gallery grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-[repeat(30,minmax(0,1fr))]">
        {campusGalleryItems.map((item) => (
          <figure
            className={cn(
              'group relative h-[180px] min-w-0 overflow-hidden bg-neutral-900 md:h-[240px] lg:h-[290px]',
              item.desktopSpan,
            )}
            key={item.fileName}
            title={item.label}
          >
            <Image
              alt={`${item.label} 건물 외관`}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              fill
              sizes="(min-width: 1024px) 17vw, (min-width: 768px) 33vw, 50vw"
              src={`/assets/map/${item.fileName}`}
            />
            <figcaption className="absolute inset-0 flex items-center justify-center bg-black/70 px-4 text-center type-title-m font-bold leading-[1.4] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="[overflow-wrap:anywhere]">{item.label}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function CenterInfoCard({ location }: { location: CenterLocation }) {
  return (
    <section className="section-map-info flex flex-col gap-8 rounded-xl bg-neutral-900 p-6 md:p-8 lg:flex-row lg:items-start">
      <div className="section-map-info__summary flex min-w-0 flex-col gap-6 md:flex-row lg:w-[630px] lg:shrink-0 border-white/10 md:pt-8 md:border-b lg:border-r lg:border-b-0 lg:py-0 lg:pr-10">
        <div className="relative size-[148px] shrink-0 overflow-hidden rounded-lg bg-neutral-600">
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="148px"
            src={location.imageSrc}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {location.logoSrc ? (
            <span className="relative block h-8 w-[120px]">
              <Image
                alt={location.name}
                className="object-contain object-left"
                fill
                sizes="120px"
                src={location.logoSrc}
              />
            </span>
          ) : (
            <p className="type-title-m font-bold leading-[1.4] text-white">{location.tabLabel}</p>
          )}
          <div className="flex flex-col gap-2 type-body-s leading-normal text-white">
            <h3 className="font-bold">{location.name}</h3>
            <p className="text-white/60">{location.summary}</p>
          </div>
        </div>
      </div>

      <div className="section-map-info__details flex min-w-0 flex-1 flex-col gap-6 ">
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
