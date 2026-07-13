import type { CSSProperties } from 'react'

import Image from 'next/image'
import { ExternalLink, Headphones } from 'lucide-react'

import { PageIntro } from '@/components/PageIntro'
import type { CenterSlug } from '@/lib/centers'
import { centers } from '@/lib/centers'
import { ConsultationForm } from './ConsultationForm'
import {
  type ConsultationSearchParams,
  inquiryTypeFromCenter,
  resolveInitialInquiryType,
} from './inquiryTypeParams'

type ConsultPageContentProps = {
  center: CenterSlug
  searchParams?: Promise<ConsultationSearchParams>
}

const contactCards = [
  {
    body: '등록상담 및 휴학, 복학, 환불 등의 문의사항은 상담센터로 연락주시면 정성껏 답변드리겠습니다.',
    details: [
      { label: '평일', value: '09:30 ~ 19:30 / 점심시간 12:00 ~ 13:00' },
      { label: '주말', value: '09:30 ~ 16:00' },
    ],
    href: 'tel:15779929',
    icon: Headphones,
    title: 'CS전화 상담',
    value: '1577-9929',
  },
  {
    body: '배우앤배움과 카카오톡 친구를 맺으면 다양한 정보를 받아보실 수 있습니다.',
    details: [
      { label: '평일', value: '09:30 ~ 19:30 / 점심시간 12:00 ~ 13:00' },
      { label: '주말', value: '09:30 ~ 16:00' },
    ],
    href: 'http://pf.kakao.com/_pxixhIxd',
    iconSrc: '/assets/icons/kakaotalk.svg',
    title: '카카오톡 상담',
    value: 'ID : 배우앤배움',
  },
]

const infoItems = [
  {
    title: '상담신청자 개별연락',
    value: 'CS 상담 센터에서 상담 신청자의 방문 예약 일정을 체크 후, 확인차 연락드립니다.',
  },
  {
    title: '당일 상담 희망자',
    value: '당일 상담을 원하시면 반드시 CS 상담 센터에 전화 후, 상담 일정을 확인하시기 바랍니다.',
  },
]

export async function ConsultPageContent({ center, searchParams }: ConsultPageContentProps) {
  const initialInquiryType = resolveInitialInquiryType(
    await searchParams,
    inquiryTypeFromCenter(center),
  )
  const centerName = centers[center]

  return (
    <main
      className="page page-light page-consult page-top-offset pb-24"
      data-center={center}
      style={consultLightThemeVars}
    >
      <section
        aria-labelledby="consult-hero-title"
        className="section-consult-hero section-p-block-sm bg-background"
      >
        <div className="container-sm">
          <PageIntro
            className="section-consult-hero__heading"
            eyebrow="온라인 상담"
            id="consult-hero-title"
            title={`${centerName}와 함께할\n당신의 이야기를 기다립니다.`}
          />

          <div className="section-consult-hero__cards mt-12 grid border border-border md:grid-cols-2">
            {contactCards.map((item, index) => (
              <ContactCard isFirst={index === 0} item={item} key={item.title} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-consult-info bg-muted py-10" aria-label="상담 안내">
        <div className="container-sm grid gap-8 md:grid-cols-2 md:gap-15">
          {infoItems.map((item, index) => (
            <InfoItem isPrimary={index === 0} item={item} key={item.title} />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="consult-form-title"
        className="section-consult-form section-p-block-sm scroll-mt-(--page-top-offset) bg-background"
        id="partnership"
      >
        <div className="container-sm">
          <div className="section-consult-form__stack grid gap-10">
            <div className="section-consult-form__panel bg-background">
              <ConsultationForm initialInquiryType={initialInquiryType} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

const consultLightThemeVars = {
  '--background': 'oklch(100% 0 0deg)',
  '--foreground': 'oklch(14.5% 0 0deg)',
  '--card': 'oklch(96.5% 0.005 265deg)',
  '--card-foreground': 'oklch(14.5% 0 0deg)',
  '--popover': 'oklch(100% 0 0deg)',
  '--popover-foreground': 'oklch(14.5% 0 0deg)',
  '--primary': 'oklch(20.5% 0 0deg)',
  '--primary-foreground': 'oklch(98.5% 0 0deg)',
  '--secondary': 'oklch(97% 0 0deg)',
  '--secondary-foreground': 'oklch(20.5% 0 0deg)',
  '--muted': 'oklch(97% 0 0deg)',
  '--muted-foreground': 'oklch(55.6% 0 0deg)',
  '--accent': 'oklch(97% 0 0deg)',
  '--accent-foreground': 'oklch(20.5% 0 0deg)',
  '--destructive': 'oklch(57.7% 0.245 27.325deg)',
  '--border': 'oklch(92.2% 0 0deg)',
  '--input': 'oklch(92.2% 0 0deg)',
  '--ring': 'oklch(70.8% 0 0deg)',
  '--success': 'oklch(78% 0.08 200deg)',
} as CSSProperties

type ContactCardItem = (typeof contactCards)[number]

function ContactCard({ isFirst, item }: { isFirst: boolean; item: ContactCardItem }) {
  const Icon = 'icon' in item ? item.icon : null
  const iconSrc = 'iconSrc' in item ? item.iconSrc : null
  const isExternalLink = item.href?.startsWith('http') ?? false

  return (
    <article
      className={`section-consult-card flex flex-col gap-6 p-4 min-[360px]:p-6 md:p-10 ${isFirst ? '' : 'border-t border-border md:border-l md:border-t-0'}`}
    >
      <div className="section-consult-card__body grid gap-4">
        <div className="section-consult-card__title flex items-center gap-3">
          {iconSrc ? (
            <Image
              alt=""
              aria-hidden="true"
              className="size-8"
              height={32}
              src={iconSrc}
              unoptimized
              width={32}
            />
          ) : (
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand text-white">
              {Icon ? <Icon aria-hidden="true" className="size-4" strokeWidth={2.4} /> : null}
            </span>
          )}
          <h2 className="type-title-l font-bold text-foreground">{item.title}</h2>
        </div>
        <p className="type-body-s leading-normal text-muted-foreground">{item.body}</p>
      </div>
      <div className="section-consult-card__meta grid gap-3">
        {item.href ? (
          <a
            className="inline-flex w-fit items-center gap-1.5 type-title-m font-bold text-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={item.href}
            rel={isExternalLink ? 'noopener noreferrer' : undefined}
            target={isExternalLink ? '_blank' : undefined}
          >
            <span>{item.value}</span>
            {isExternalLink ? (
              <ExternalLink
                aria-hidden="true"
                className="size-3.5 text-muted-foreground/55"
                strokeWidth={2}
              />
            ) : null}
          </a>
        ) : (
          <p className="type-title-m font-bold text-foreground">{item.value}</p>
        )}
        <dl className="grid gap-1 type-body-s leading-normal text-muted-foreground">
          {item.details.map((detail) => (
            <div
              className="grid grid-cols-[32px_minmax(0,1fr)] items-baseline gap-x-1.5 min-[360px]:grid-cols-[44px_minmax(0,1fr)] min-[360px]:gap-x-2"
              key={detail.label}
            >
              <dt className="whitespace-nowrap font-bold text-foreground">{detail.label}</dt>
              <dd className="min-w-0 whitespace-nowrap type-caption-s min-[430px]:type-body-s">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  )
}

function InfoItem({
  isPrimary,
  item,
}: {
  isPrimary: boolean
  item: (typeof infoItems)[number]
}) {
  return (
    <div className="section-consult-info__item grid gap-3">
      <h2 className={`type-title-s font-bold ${isPrimary ? 'text-brand' : 'text-foreground'}`}>
        {item.title}
      </h2>
      <p className="type-body-s leading-normal text-muted-foreground">{item.value}</p>
    </div>
  )
}
