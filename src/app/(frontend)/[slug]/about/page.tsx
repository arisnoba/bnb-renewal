import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { centers, type CenterSlug } from '@/lib/centers'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type CenterIntro = {
  id: 'enm' | CenterSlug
  centerSlug?: CenterSlug
  englishName: string
  title: string
  body: string[]
  imageSrc: string
  imageAlt: string
  caption: string
  href?: string
  linkLabel?: string
}

const centerSlugs = Object.keys(centers) as CenterSlug[]

const centerIntroductions: CenterIntro[] = [
  {
    id: 'enm',
    englishName: '배우앤배움 EnM',
    title:
      '배우앤배움 EnM은 신인 배우 발굴부터 교육, 데뷔 이후 매니지먼트까지 연결하는 통합형 엔터테인먼트 교육 플랫폼입니다.',
    body: [
      '실전 중심의 커리큘럼과 업계 최고 수준의 전문가 네트워크를 기반으로 단순한 교육을 넘어 아티스트의 성장을 체계적으로 지원합니다.',
    ],
    imageSrc: '/assets/center-about/enm-kim-miji.png',
    imageAlt: 'EnM 대표 김미지',
    caption: 'EnM 대표 김미지',
  },
  {
    id: 'art',
    centerSlug: 'art',
    englishName: 'Art Center',
    title: 'Baewoo New Branding : 배우를 새로운 시각으로 브랜딩하다',
    body: [
      "배우앤배움 아트센터는 'Baewoo New Branding' 철학을 바탕으로, 배우를 새로운 시각에서 바라보고 브랜딩하는 대한민국 1위 매체 연기 교육 기관입니다. 대중들이 배우의 어떤 연기에 매력을 느끼는지 분석하고, 시장에서 요구하는 연기 트랜드에 맞춰 새로운 커리큘럼을 개발, 이에 맞춰 감각적인 훈련과 모니터링을 통하여 배우가 필요한 부분을 도출해내는 시스템으로 배우가 자신만의 색깔로 성장해 실전에서 경쟁력을 갖출 수 있도록 지원합니다. 국내 60여 개의 중·대형 기획사와 협력해 소속 배우 위탁 교육 및 신인개발 부분을 공유하고 각 매니지먼트사의 신인 오디션을 전략적으로 함께 진행하고 있으며, 드라마 제작사들과 계열사인 ARKO Lab 에이전시와 협력하여 연간 20편 이상의 작품에서 주·조연을 포함한 핵심 배역을 캐스팅합니다.",
      '배우앤배움은 국내 최초로 ‘교육(Academy) + 캐스팅(Agency) + 배우관리(Management)’ 시스템을 구축하여, 배우의 성장과 데뷔를 체계적으로 지원하는 대한민국 연기교육의 선구자입니다. 배우가 자신의 예술을 브랜드화하여 산업과 대중이 원하는 새로운 배우로 자리 잡을 수 있도록 이끌어가며, 드라마, 영화, 광고산업을 대표하는 실무진들과의 긴밀한 협업을 통해 대한민국 연기 교육과 신인개발의 패러다임을 만들어 가겠습니다.',
    ],
    imageSrc: '/assets/center-about/art-kim-minsik.png',
    imageAlt: '아트센터 센터장 김민식',
    caption: '센터장 김민식',
    href: '/art',
    linkLabel: 'Art Center',
  },
  {
    id: 'exam',
    centerSlug: 'exam',
    englishName: 'Exam Center',
    title:
      '배우앤배움 입시센터는 <너 자신이 곧 작품이다>라는 교육철학을 담아, 체계적인 커리큘럼과 수준 높은 교육관리시스템을 바탕으로 입시교육의 새로운 프레임을 제시합니다.',
    body: [
      '배우앤배움 입시센터는 개개인의 대학입시에 대한 방향성을 제시하고 연극영화과 입시에 관한 모든 것을 전적으로 책임지고 가르칩니다. 또한, 각각의 학생에 대하여 매주 회의를 통해 개인의 수업 진도와 능력, 장점을 분석해서 하나의 작품을 탄생시키기 위한 앞으로의 진행 방향을 소통하고 공유합니다. 특히, 국내 최대 입시 전문 인프라와 전문시설을 모두 갖추고 있으며 한예종 최대 합격률을 보유하고 있는 국내 최고 실력의 원장진과 특기 강사진이 포진되어 있습니다.',
    ],
    imageSrc: '/assets/center-about/exam-kim-byeonghyeon.png',
    imageAlt: '입시센터 센터장 김병현',
    caption: '센터장 김병현',
    href: '/exam',
    linkLabel: 'Exam Center',
  },
  {
    id: 'highteen',
    centerSlug: 'highteen',
    englishName: 'High-teen Center',
    title: '배우앤배움 하이틴센터는 국내 최고의 청소년 방송연기 트레이닝 센터입니다.',
    body: [
      '배우앤배움 교육 LAB사에서 개발한 국내에서 가장 확실한 청소년 매체연기 커리큘럼으로 철저한 현장 진출을 위한 연기를 목표로 두고, 학생 개개인의 교육 컨설팅과 이미지 메이킹을 통해 BNB의 캐스팅디렉터와 매니저들과의 존속적인 업무공조를 통해 하이틴 아역배우로 시작해 성인 연기자로 자리잡을 수 있는 가장 실제적이고 효과적인 전문 하이틴 신인개발 시스템을 구축했습니다.',
      '또한, 체계적인 연기 트레이닝과 배우 인큐베이팅 시스템을 인정받아, 국내 중/대형 기획사 50여곳의 신인배우 위탁교육을 진행하고 있으며, 아카데미의 <교육>, 에이전시의 <캐스팅>, 매니지먼트의 <배우관리>. 3가지 프로배우 양성시스템을 국내 최초로 연기학원에 적용하였습니다.',
      '이를 통해 하이틴배우로서 드라마,영화,광고 촬영 현장에 나갈 수 있는 가장 빠르고 효과적인 방향성을 제시하며 특히, 국내 중/대형 기획사 50여 곳에 하이틴 배우들의 매니지먼트 전속계약을 진행하고 있습니다. 배우앤배움 하이틴센터는 대한민국의 하이틴 아역배우 문화를 선도하는 최고의 교육콘텐츠 기업으로 도약하겠습니다.',
    ],
    imageSrc: '/assets/center-about/highteen-kim-yeseul.png',
    imageAlt: '하이틴센터 센터장 김예슬',
    caption: '센터장 김예슬',
    href: '/highteen',
    linkLabel: 'High-teen Center',
  },
  {
    id: 'kids',
    centerSlug: 'kids',
    englishName: 'Kids Center',
    title:
      '아이가 대본을 보며 <무작정 외우려고> 한다면, 어머니는 아이에게 "이 상황에 어떤 생각이 드니?"라고 물어보세요.',
    body: [
      '배우앤배움 키즈센터는 아이의 잠재되어 있던 연기에 관한 시선과 감각을 깨우고, 아이들이 스스로 깨닫고 대본에 접근할 수 있도록 교육하며, 전문화된 캐스팅 시스템을 통해 아역배우로서 촬영 현장에 나갈 수 있는 가장 빠르고 효과적인 방향성을 제시합니다.',
      '배우앤배움 키즈센터는 아역 배우에게 필요한 교육과 진로에 대한 각 분야의 전문가들과 함께 오랜시간 구축해온 탄탄하고 체계적인 시스템을 바탕으로 단순한 교육의 개념을 넘어선 아카데미의 <교육>, 에이전시의 <캐스팅>, 매니지먼트의 <아역배우관리>. 3가지 프로아역배우 양성시스템을 국내 최초로 연기학원에 적용하였습니다.',
      '또한, 배우앤배움 교육 LAB사와의 지속적인 키즈 매체연기에 대한 커리큘럼 연구개발과 함께 드라마, 영화 광고산업을 대표해온 실무진과의 존속적인 업무공조로 대한민국의 새로운 아역 연기교육 문화를 창출하는 최고의 예체능 교육콘텐츠 기업으로 도약하겠습니다.',
    ],
    imageSrc: '/assets/center-about/kids-lee-eonju.png',
    imageAlt: '키즈센터 센터장 이언주',
    caption: '센터장 이언주',
    href: '/kids',
    linkLabel: 'Kids Center',
  },
  {
    id: 'avenue',
    centerSlug: 'avenue',
    englishName: 'AVENUE CENTER',
    title: '배우앤배움 에비뉴센터는 경험을 연기로 완성하는 전문 트레이닝 센터입니다.',
    body: [
      '오랜 시간 쌓아온 이야기와 감각은 그 자체로 강력한 힘이 됩니다. 에비뉴센터는 각 연기자가 가진 고유한 색깔과 내면의 힘을 발굴하고, 시장 트렌드에 맞춘 커리큘럼과 체계적인 트레이닝을 통해 자신만의 연기로 완성될 수 있도록 지원합니다.',
      '개인별 컨설팅과 이미지 메이킹을 통해 연기자로서의 브랜드를 구축하고, BNB 캐스팅디렉터들과의 긴밀한 협력을 바탕으로 드라마, 영화, 광고 현장으로의 실질적인 진출을 함께합니다.',
      '교육·캐스팅·배우관리를 하나로 잇는 전문 시스템을 국내 최초로 구축하여, 연기자가 자신만의 색깔로 성장해 실전에서 경쟁력을 갖출 수 있도록 지원합니다. 또한, 자사 BNB CASTING 시스템을 통해 다양한 캐스팅 업체와 협력하여 드라마, 영화, 광고 등 다양한 작품에서 폭넓은 캐스팅을 진행하고 있습니다.',
    ],
    imageSrc: '/assets/center-about/avenue-yoo-hana.png',
    imageAlt: '에비뉴센터 센터장 유하나',
    caption: '센터장 유하나',
    href: '/avenue',
    linkLabel: 'AVENUE CENTER',
  },
]

export function generateStaticParams() {
  return centerSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = centerFromSlug(decodeURIComponent(slug))

  if (!center) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  return {
    title: '센터소개',
    description: `배우앤배움 ${centers[center]} 센터소개`,
  }
}

function centerFromSlug(slug: string): CenterSlug | null {
  return centerSlugs.includes(slug as CenterSlug) ? (slug as CenterSlug) : null
}

export default async function CenterAboutPage({ params }: Args) {
  const { slug } = await params
  const center = centerFromSlug(decodeURIComponent(slug))

  if (!center) {
    notFound()
  }

  const decoIcons = getPageDecoIcons(4, `center-about-${center}`)

  return (
    <main className="page page-dark page-about" data-center={center}>
      <section
        aria-labelledby="center-about-hero-title"
        className="section-center-about-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.16)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '96px 96px',
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/65" />
        <PageDeco className="-left-24 top-[20%] md:-left-36" icon={decoIcons[0]} />
        <PageDeco className="-right-20 bottom-[-8%] md:-right-28" icon={decoIcons[1]} />
        <div className="container relative flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-30">
          <h1
            className="section-center-about-hero__title type-display-xl font-extrabold leading-[1.2]"
            id="center-about-hero-title"
          >
            <span className="block text-brand">배우앤배움</span>
            <span className="block text-white">센터소개</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="center-about-list-title"
        className="section-center-about-list section-p-block-lg relative overflow-hidden"
      >
        <PageDeco className="-left-28 top-[22%] md:-left-36" icon={decoIcons[2]} />
        <PageDeco className="-right-28 bottom-[18%] md:-right-40" icon={decoIcons[3]} />
        <div className="container relative">
          <header className="section-center-about-list__head mb-16 md:mb-30">
            <h2
              className="type-display-l font-extrabold uppercase leading-[1.15] text-white"
              id="center-about-list-title"
            >
              BAEWOO &amp;
              <br />
              BAEWOOM
            </h2>
          </header>

          <div className="section-center-about-list__items divide-y divide-white/15 border-white/15">
            {centerIntroductions.map((item) => (
              <CenterIntroArticle item={item} key={item.id} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function CenterIntroArticle({ item }: { item: CenterIntro }) {
  return (
    <article
      className="section-center-about-card grid gap-10 py-16 first:pt-0 md:grid-cols-[minmax(0,648px)_minmax(220px,1fr)] md:items-start md:gap-20 md:py-20"
      data-center={item.centerSlug}
    >
      <div className="section-center-about-card__copy flex flex-col items-start gap-8 md:gap-10">
        <div className="space-y-6 text-white">
          <h3 className="type-headline-l font-bold leading-normal">
            {item.englishName}
          </h3>
          <div className="space-y-6 leading-normal">
            <p className="type-title-s font-bold">{item.title}</p>
            {item.body.map((paragraph) => (
              <p className="type-body-s text-white/60" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        {item.href ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/40 px-5 py-3 type-label-l font-semibold leading-none text-white transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            href={item.href}
          >
            {item.linkLabel ?? item.englishName}
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </Link>
        ) : null}
      </div>

      <figure className="section-center-about-card__profile justify-self-start md:justify-self-end">
        <Image
          alt={item.imageAlt}
          className="section-center-about-card__profile-image size-[220px] object-contain md:size-60"
          height={240}
          src={item.imageSrc}
          width={240}
        />
        <figcaption className="mt-6 text-center type-body-m font-semibold leading-none text-white">
          {item.caption}
        </figcaption>
      </figure>
    </article>
  )
}
