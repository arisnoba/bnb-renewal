import type { Metadata } from 'next'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter, centers } from '@/lib/centers'

import { FacilitiesGallery } from './FacilitiesGallery.client'
import { facilityImages } from './facilityImages'

type Args = {
  params: Promise<{
    slug: string
  }>
}

const centerSlugs = Object.keys(centers)

export function generateStaticParams() {
  return centerSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)
  const centerLabel = centers[center]

  return {
    description: `배우앤배움 ${centerLabel} 시설 안내와 내부 공간 이미지를 확인하세요.`,
    title: `시설 안내 | ${centerLabel}`,
  }
}

export default async function FacilitiesPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(decodeURIComponent(slug))
  const decoIcons = getPageDecoIcons(3, `facilities-${center}`)

  return (
    <main className="page page-dark page-facilities bg-neutral-950 text-white" data-center={center}>
      <section
        aria-labelledby="facilities-title"
        className="section-facilities-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ backgroundImage: "url('/assets/facilities/gallery_39.jpg')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/70" />
        <PageDeco className="hidden -left-39 top-28 opacity-100 md:block" icon={decoIcons[0]} size="360px" />
        <PageDeco className="hidden -right-18 bottom-[-56px] opacity-100 md:block" icon={decoIcons[1]} size="360px" />
        <div className="container relative flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-30">
          <header className="section-facilities-hero__head">
            <h1
              className="section-facilities-hero__title type-display-l font-extrabold leading-[1.2] md:type-display-xl"
              id="facilities-title"
            >
              <span className="block text-brand">배우앤배움</span>
              <span className="block text-white">시설 안내</span>
            </h1>
          </header>
        </div>
      </section>

      <section
        aria-labelledby="facilities-gallery-title"
        className="section-facilities-gallery relative overflow-hidden py-16 md:py-30"
      >
        <div className="container relative mb-14 md:mb-24">
          <header className="section-facilities-gallery__head">
            <p className="type-label-l font-bold text-brand">시설안내</p>
            <h2
              className="mt-10 type-display-m font-bold leading-[1.35] text-white md:type-display-l"
              id="facilities-gallery-title"
            >
              배우가 디자인 되는 곳
              <br />
              배우앤배움 아트센터 강남 사옥
            </h2>
            <p className="mt-10 max-w-280 type-body-m leading-normal text-white/70">
              배우앤배움 아트센터는 배우 훈련에 최적화된 스튜디오로 설계한 ‘공간 디자이너 김종구’의 작품입니다.
            </p>
          </header>
        </div>
        <div className="section-facilities-gallery__stage relative">
          <PageDeco className="hidden -right-28 top-[-25%] opacity-100 md:block" icon={decoIcons[2]} size="360px" />
          <FacilitiesGallery images={facilityImages} />
        </div>
      </section>
    </main>
  )
}
