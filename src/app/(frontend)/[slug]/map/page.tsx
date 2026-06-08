import type { Metadata } from 'next'

import { assertCenter } from '@/lib/centers'
import { centerLocationList, centerLocations } from '@/lib/centerLocations'

import { MapContent } from './MapContent.client'
import MapPageClient from './MapPage.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return centerLocationList.map((location) => ({ slug: location.slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)
  const location = centerLocations[center]

  return {
    description: `${location.name} 오시는 길과 주소, 전화번호를 확인하세요.`,
    title: `${location.name} 오시는 길`,
  }
}

const naverMapScriptUrl = resolveNaverMapScriptUrl()

export default async function CenterMapPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)

  return (
    <main className="map-page bg-[#111] text-white" data-center={center}>
      <MapPageClient />
      <section className="relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: "url('/assets/map/map-hero.png')" }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute -left-16 top-[15%] h-56 w-56 text-brand md:h-[360px] md:w-[360px]">
          <div className="absolute inset-x-[28%] inset-y-0 bg-current" />
          <div className="absolute inset-x-0 top-0 h-[44%] bg-current" />
        </div>
        <div className="pointer-events-none absolute -right-20 bottom-[8%] h-56 w-56 rounded-full border-[52px] border-brand md:h-[360px] md:w-[360px] md:border-[84px]" />
        <div className="container relative flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[120px]">
          <h1 className="font-['Pyeojin_Gothic','Pretendard',sans-serif] text-[44px] font-extrabold leading-[1.15] tracking-normal md:text-[60px]">
            <span className="block text-brand">배우앤배움</span>
            <span className="block">오시는 길</span>
          </h1>
        </div>
      </section>

      <MapContent initialCenter={center} scriptUrl={naverMapScriptUrl} />
    </main>
  )
}

function resolveNaverMapScriptUrl() {
  const keyId = process.env.NEXT_PUBLIC_NAVER_MAPS_KEY_ID
  const legacyClientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID
  const submodules = 'gl'

  if (keyId) {
    return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      keyId,
    )}&submodules=${submodules}`
  }

  if (legacyClientId) {
    return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${encodeURIComponent(
      legacyClientId,
    )}&submodules=${submodules}`
  }

  return null
}
