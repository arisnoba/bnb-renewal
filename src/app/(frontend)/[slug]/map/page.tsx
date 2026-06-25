import type { Metadata } from 'next'

import { footerCenterInfoMatchForCenter } from '@/Footer/centerInfo'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter } from '@/lib/centers'
import {
  centerLocationList,
  centerLocations,
  type CenterLocation,
} from '@/lib/centerLocations'
import { getCachedGlobal } from '@/utilities/getGlobals'

import { MapContent } from './MapContent.client'

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
    title: '오시는 길',
  }
}

const naverMapScriptUrl = resolveNaverMapScriptUrl()

export default async function CenterMapPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)
  const decoIcons = getPageDecoIcons(2, `map-hero-${center}`)
  const locations = await queryCenterLocations()

  return (
    <main className="page page-dark map-page" data-center={center}>
      <section className="relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: "url('/assets/map/map-hero.png')" }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <PageDeco
          className="-left-16 top-[15%]"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="-right-20 bottom-[8%]"
          icon={decoIcons[1]}
        />
        <div className="container relative flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[120px]">
          <div className="page-hero-label">
            <span className="block text-brand">배우앤배움</span>
            <span className="block">오시는 길</span>
          </div>
        </div>
      </section>

      <MapContent initialCenter={center} locations={locations} scriptUrl={naverMapScriptUrl} />
    </main>
  )
}

async function queryCenterLocations(): Promise<CenterLocation[]> {
  const footer = await getCachedGlobal('footer', 0)()
  const centerInfos = footer.centerInfos ?? []

  return centerLocationList.map((location) => {
    const centerInfo = footerCenterInfoMatchForCenter(centerInfos, location.slug)
    const address = mapAddress(centerInfo?.address) || location.address

    return address === location.address ? location : { ...location, address }
  })
}

function mapAddress(value: unknown) {
  return typeof value === 'string'
    ? value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
    : ''
}

function resolveNaverMapScriptUrl() {
  const keyId = process.env.NEXT_PUBLIC_NAVER_MAPS_KEY_ID
  const legacyClientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID

  if (keyId) {
    return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      keyId,
    )}`
  }

  if (legacyClientId) {
    return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${encodeURIComponent(
      legacyClientId,
    )}`
  }

  return null
}
