import type { Metadata } from 'next'

import { PageIntro } from '@/components/PageIntro'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { getAboutHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
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
    title: '시설 안내',
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
        <PageHeroImage image={getAboutHeroImage()} className="opacity-55 grayscale" />
        <div aria-hidden="true" className="absolute inset-0 bg-black/70" />
        <PageDeco className="hidden -left-39 top-28 opacity-100 md:block" icon={decoIcons[0]} size="360px" />
        <PageDeco className="hidden -right-18 bottom-[-56px] opacity-100 md:block" icon={decoIcons[1]} size="360px" />
        <div className="container relative flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-30">
          <header className="section-facilities-hero__head">
            <h1
              className="section-facilities-hero__title page-hero-label"
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
          <PageIntro
            as="h2"
            className="section-facilities-gallery__head page-heading--dark"
            description="배우앤배움 아트센터는 배우 훈련에 최적화된 스튜디오로 설계한 ‘공간 디자이너 김종구’의 작품입니다."
            descriptionClassName="[--page-desc-line-height:1.5] [--page-desc-max-width:1120px]"
            eyebrow="시설안내"
            id="facilities-gallery-title"
            title={'배우가 디자인 되는 곳\n배우앤배움 아트센터 강남 사옥'}
          />
        </div>
        <div className="section-facilities-gallery__stage relative">
          <PageDeco className="hidden -right-28 top-[-25%] opacity-100 md:block" icon={decoIcons[2]} size="360px" />
          <FacilitiesGallery images={facilityImages} />
        </div>
      </section>
    </main>
  )
}
