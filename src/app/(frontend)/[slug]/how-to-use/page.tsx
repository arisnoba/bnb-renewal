import type { Metadata } from 'next'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { assertCenter } from '@/lib/centers'
import { cn } from '@/utilities/ui'

import PageClient from '../page.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type ServiceItem = {
  description: string
  icon: string
  id: string
  title: string
}

const services: ServiceItem[] = [
  {
    description:
      '스타카드는 엄격한 기준으로 선정된 다양한 편의시설의 혜택 및 특전을 제공하는 배우앤배움 멤버쉽 서비스입니다.',
    icon: 'credit-card',
    id: 'starcard',
    title: '스타카드 발급',
  },
  {
    description:
      '학원과 가까운 거리의 피트니스에서 개인 운동을 배우앤배움 재학생이라면 누구나 무료로 이용할 수 있습니다.',
    icon: 'dumbbell',
    id: 'fitness',
    title: '전용 피트니스 무료제공',
  },
  {
    description: '최고급 장비와 시설로 영상과 사진 촬영이 모두 가능한 스튜디오입니다.',
    icon: 'camera-viewfinder',
    id: 'studio',
    title: '배우앤배움 촬영 스튜디오',
  },
  {
    description: '배우앤배움은 매월 제한된 인원으로 수강생 프로필 제작을 하고 있습니다.',
    icon: 'address-book',
    id: 'profile',
    title: '프로필 제작 및 PPT 디자인 서비스',
  },
  {
    description: '국내에서 이루어지는 모든 드라마&영화&광고 오디션의 정보를 취합해 보관하고 있습니다.',
    icon: 'clapperboard-play',
    id: 'audition-info',
    title: '드라마&영화&광고 오디션 정보안내',
  },
  {
    description:
      '아트센터 1층 DID에서 드라마 편성 예정에 관한 정보 및 현재 진행중인 드라마의 시놉시스를 확인하실 수 있습니다.',
    icon: 'tv-retro',
    id: 'drama-synopsis',
    title: '2025년 드라마 편성표&드라마 시놉시스 비치서비스',
  },
  {
    description:
      '아트센터 1층 DID에서 영화 편성 예정에 관한 정보 및 현재 진행중인 드라마의 시놉시스를 확인하실 수 있습니다.',
    icon: 'camera-movie',
    id: 'movie-synopsis',
    title: '2025년 영화 라인업&영화 시놉시스 비치서비스',
  },
  {
    description: '아트센터 1층 DID에서 국내 주요 광고모델 에이전시 50여 곳의 정보를 확인하실 수 있습니다.',
    icon: 'billboard',
    id: 'agency-list',
    title: '광고 에이전시 리스트정보 서비스',
  },
  {
    description:
      '배우앤배움 아트센터는 운영시간이 지난 후에도 지문 인식을 통해 출입할 수 있도록 운영되고 있습니다.',
    icon: 'fingerprint',
    id: 'security',
    title: '24시간 연습실 이용&지문 등록 보안서비스',
  },
  {
    description:
      '배우앤배움의 개인연습실은 특수 제작된 방음문과 2중 방음벽으로 마감되어 완벽한 방음 환경을 구현하였습니다.',
    icon: 'buildings',
    id: 'practice-room',
    title: '개인연습실&그룹스터디룸 제공',
  },
  {
    description:
      '배우앤배움 아트센터 교육팀은 매주 토요일마다 새로 준비한 오디션용 대본을 제공해드립니다.',
    icon: 'newspaper',
    id: 'weekly-script',
    title: '배배대본(주간 오디션 대본) 배포 서비스',
  },
  {
    description:
      '아트센터 3층 안내데스크에 방문하시면 영화 드라마 관련 독백/2인극 대본 모음집을 대여 및 복사하실 수 있습니다.',
    icon: 'notes',
    id: 'script-book',
    title: '대본모음집 이용가능',
  },
  {
    description:
      '아트센터 1층 안내데스크 로비에 설치된 PC를 통해 수업 자료나 대본 등 희망하시는 출력물을 인쇄.',
    icon: 'print',
    id: 'print',
    title: '학생 프린트 서비스',
  },
  {
    description: '아트센터 1층 안내데스크에서는 매주 <씨네21> 매거진 대여 하실 수 있습니다.',
    icon: 'books',
    id: 'cine21',
    title: '씨네21 잡지 비치',
  },
  {
    description:
      '다수의 인원이 사용하는 시설인 만큼 시설유지 및 보수 관리에 많은 투자를 아끼지 않고 있습니다.',
    icon: 'wind',
    id: 'air-care',
    title: '학원 전 구역 공기청정 시스템',
  },
]

const desktopLastRowStartIndex = services.length - (services.length % 2 === 0 ? 2 : 1)
const hasDesktopEmptyCell = services.length % 2 === 1

export function generateStaticParams() {
  return [{ slug: 'art' }]
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center !== 'art') {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  return {
    description: '배우앤배움 아트센터 곳곳에 숨어있는 프리미엄 서비스 안내',
    title: '학원100%이용법 | 배우앤배움 아트센터',
  }
}

export default async function ArtHowToUsePage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center !== 'art') {
    notFound()
  }

  return (
    <main className="page page-light page-how-to-use page-top-offset" data-center="art">
      <PageClient pageTone="light" />

      <section
        className="section-how-to-use section-p-block-base bg-white text-[#222]"
        aria-labelledby="how-to-use-title"
      >
        <div className="container-sm">
          <header className="section-how-to-use__head mb-[52px] md:mb-20">
            <h1 className="page-eyebrow">학원100%이용법</h1>
            <h2 id="how-to-use-title" className="page-title">
              배우앤배움 아트센터 곳곳에 숨어있는
              <br className="hidden md:block" />
              프리미엄 서비스를 만나보세요.
            </h2>
            <p className="page-desc">
              <span className="font-bold text-black">
                배우앤배움 곳곳에 숨어있는 프리미엄 서비스
              </span>
              <br />
              학원 100%이용법을 통해 배우앤배움의 다양한 혜택을 최대한 활용해보세요.
            </p>
            
          </header>

          <div className="section-how-to-use__grid grid border border-[#ddd] md:grid-cols-2">
            {services.map((service, index) => {
              const isDesktopLeftColumn = index % 2 === 0
              const isDesktopLastRow = index >= desktopLastRowStartIndex

              return (
                <article
                  className={cn(
                    'section-how-to-use__card flex min-h-[300px] flex-col p-7 md:min-h-[349px] md:p-10',
                    index < services.length - 1 && 'border-b border-[#e5e5e5]',
                    isDesktopLeftColumn && 'md:border-r md:border-[#e5e5e5]',
                    isDesktopLastRow && 'md:border-b-0',
                  )}
                  id={service.id}
                  key={service.id}
                >
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="section-how-to-use__icon block size-[60px] object-contain object-left opacity-70"
                    height={60}
                    src={`/assets/icons/fa/${service.icon}.svg`}
                    width={60}
                  />
                  <div className="section-how-to-use__body mt-12 flex flex-1 flex-col justify-end md:mt-14">
                    <h2 className="section-how-to-use__card-title m-0 text-[21px] font-semibold leading-[1.35] text-[#222] md:text-[24px]">
                      {service.title}
                    </h2>
                    <p className="section-how-to-use__card-description m-0 mt-7 text-[15px] font-normal leading-[1.5] text-[#777] md:text-[16px]">
                      {service.description}
                    </p>
                    <span
                      className="section-how-to-use__more mt-7 inline-flex w-fit items-center gap-2.5 text-[14px] font-extrabold leading-[1.4] text-[#222]"
                      aria-label={`${service.title} 자세히 보기`}
                    >
                      자세히 보기
                      <ChevronRight
                        aria-hidden="true"
                        className="section-how-to-use__more-icon size-[14px] opacity-80"
                        strokeWidth={2.2}
                      />
                    </span>
                  </div>
                </article>
              )
            })}
            {hasDesktopEmptyCell ? (
              <div
                aria-hidden="true"
                className="section-how-to-use__empty-cell hidden min-h-[349px] border-t border-[#e5e5e5] md:block"
              />
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
