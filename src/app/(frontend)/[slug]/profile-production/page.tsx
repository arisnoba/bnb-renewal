import type { Metadata } from "next";

import Image from "next/image";

import { getPageDecoIcons, PageDeco } from "@/components/PageDeco";
import {
  assertCenter,
  centers,
  getCenterLabel,
  type CenterSlug,
} from "@/lib/centers";

import { ProfileProductionIndex } from "./ProfileProductionIndex.client";

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

type ProfileProductionMedia =
  | {
      alt?: string;
      kind: "single";
      objectPosition?: string;
      src: string;
    }
  | {
      images: Array<{
        alt?: string;
        className?: string;
        objectFit?: "contain" | "cover";
        objectPosition?: string;
        src: string;
      }>;
      kind: "grid";
    };

type ProfileProductionItem = {
  description: string[];
  id: string;
  media: ProfileProductionMedia;
  title: string;
};

type ProfileProductionCenterConfig = {
  heroImage: string;
  items: ProfileProductionItem[];
};

const profileProductionCenters = Object.keys(centers) as CenterSlug[];

function profileProductionAsset(center: CenterSlug, filename: string) {
  return `/assets/profile-production/${center}/${filename}`;
}

const artProfileProductionItems = [
  {
    description: [
      "프로필 촬영 및 개인연기 영상제작 등 모두 BNB 전용 스튜디오에서 진행됩니다. BNB 스튜디오는 최고급 장비를 보유하고 있으며, 단독 헤어&메이크업실을 갖추고 있어 프라이빗한 서비스를 이용하실 수 있습니다.",
    ],
    id: "studio",
    media: {
      kind: "single",
      objectPosition: "center",
      src: "/assets/profile-production/art-01.jpg",
    },
    title: "BNB 전용 스튜디오",
  },
  {
    description: [
      "프로필 촬영을 희망하는 수강생은 하단의 QR 코드를 통해 신청폼을 작성합니다.",
    ],
    id: "application",
    media: {
      kind: "single",
      objectPosition: "center",
      src: "/assets/profile-production/art-02.jpg",
    },
    title: "프로필 신청",
  },
  {
    description: [
      "촬영 스케줄이 결정되면 촬영에 앞서 작가님과 함께 컨셉 미팅을 진행하게 됩니다. 이때 연기자는 작가님과 본인이 준비한 컨셉에 대해 상의 후 조명, 포즈, 헤어, 메이크업, 의상 등 프로필 제작의 전반적인 진행내용을 결정하게 됩니다.",
    ],
    id: "concept-meeting",
    media: {
      kind: "single",
      objectPosition: "center",
      src: "/assets/profile-production/art-03.jpg",
    },
    title: "촬영 콘셉트미팅",
  },
  {
    description: [
      "프로필 촬영 당일 스튜디오에는 포토그래퍼/헤어팀/메이크업팀/그 외 스태프들이 촬영시간에 맞춰 시작합니다. 헤어&메이크업팀의 경우, 청담동 연예인 전문 헤어샵 디자이너가 1:1로 배우를 직접 케어합니다.",
    ],
    id: "shooting",
    media: {
      kind: "single",
      objectPosition: "center",
      src: "/assets/profile-production/art-04.jpg",
    },
    title: "프로필 촬영",
  },
  {
    description: [
      "촬영이 끝나면 스튜디오에서 연기자에게 1차 원본 전체 파일을 jpg로 전송합니다. 전달받은 사진 중 A컷 사진 분류 후, 다시 스튜디오측에 2차 사진 보정작업을 의뢰합니다. (스튜디오의 보정작업은 약 10-14일 정도 소요됩니다.)",
    ],
    id: "retouching",
    media: {
      kind: "single",
      objectPosition: "center",
      src: "/assets/profile-production/art-05.jpg",
    },
    title: "A컷 분류 및 보정작업",
  },
] satisfies ProfileProductionItem[];

function createDefaultProfileProductionItems(
  center: CenterSlug,
): ProfileProductionItem[] {
  const isKids = center === "kids";

  return [
    {
      description: [
        "프로필 촬영을 원하시는 수강생은 배우앤배움 아트센터 1층 안내데스크에서 프로필 애플리케이션을 작성한 후 작성된 애플리케이션을 매니지먼트팀에 전달합니다.",
      ],
      id: "application",
      media: {
        kind: "single",
        objectPosition: "center",
        src: profileProductionAsset(center, "profile_img01.jpg"),
      },
      title: "프로필 신청",
    },
    {
      description: [
        isKids
          ? "촬영 스케줄이 결정되면 촬영에 앞서 매니지먼트팀과 함께 의상 및 콘셉트미팅을 진행하게 됩니다. 이때 연기자는 매니지먼트팀과 본인의 준비한 콘셉에 대한 내용을 상의한 후 조명, 포즈, 헤어, 메이크업, 의상 등 프로필 제작의 전반적인 진행내용을 결정하게 됩니다."
          : "촬영 스케줄이 결정되면 촬영에 앞서 매니지먼트팀과 함께 콘셉트미팅을 진행하게 됩니다. 이때 연기자는 매니지먼트팀과 본인의 준비한 콘셉에 대한 내용을 상의한 후 조명, 포즈, 헤어, 메이크업, 의상 등 프로필 제작의 전반적인 진행내용을 결정하게 됩니다.",
      ],
      id: "concept-meeting",
      media: {
        kind: "single",
        objectPosition: "center",
        src: profileProductionAsset(center, "profile_img02.jpg"),
      },
      title: "촬영 콘셉트미팅",
    },
    {
      description: [
        "프로필 촬영 당일 스튜디오에는 포토그래퍼/헤어팀/메이크업팀/그 외 스태프들이 촬영시간에 맞춰 시작합니다. 특히 현장이 익숙하지 않은 수강생들을 위해 배우앤배움 매니지먼트팀 매니저들의 현장지원으로 연기자가 촬영에 집중할 수 있도록 서포트합니다.",
      ],
      id: "shooting",
      media: {
        kind: "single",
        objectPosition: "center",
        src: profileProductionAsset(center, "profile_img03.jpg"),
      },
      title: "프로필 촬영",
    },
    {
      description: [
        "촬영이 끝나면 스튜디오에서 연기자에게 1차 원본 전체 파일을 jpg로 전송합니다. 전달받은 사진을 배우앤배움 담당매니저와 함께 A컷 사진 분류 후, 다시 스튜디오측에 2차 사진 보정작업을 의뢰합니다. (스튜디오의 보정작업은 약 5일 정도 소요됩니다.)",
      ],
      id: "retouching",
      media: {
        kind: "single",
        objectPosition: "center",
        src: profileProductionAsset(center, "profile_img04.jpg"),
      },
      title: "A컷 분류 및 보정작업",
    },
    {
      description: [
        "2차 보정작업이 완료된 사진파일을 스튜디오에서 수령 후 배우앤배움 디자인실에서 배우 프로필 PPT로 최종 디자인합니다. 완성된 파일은 디자인실에서 다시 연기자와 매니지먼트팀으로 전달됩니다.",
      ],
      id: "profile-design",
      media: {
        kind: "single",
        objectPosition: "center",
        src: profileProductionAsset(center, "profile_img05.jpg"),
      },
      title: "최종 프로필 디자인",
    },
  ];
}

const profileProductionConfigs = {
  art: {
    heroImage: "/assets/profile-production/hero.png",
    items: artProfileProductionItems,
  },
  avenue: {
    heroImage: profileProductionAsset("avenue", "hero.jpg"),
    items: createDefaultProfileProductionItems("avenue"),
  },
  exam: {
    heroImage: profileProductionAsset("exam", "hero.jpg"),
    items: createDefaultProfileProductionItems("exam"),
  },
  highteen: {
    heroImage: profileProductionAsset("highteen", "hero.jpg"),
    items: createDefaultProfileProductionItems("highteen"),
  },
  kids: {
    heroImage: profileProductionAsset("kids", "hero.jpg"),
    items: createDefaultProfileProductionItems("kids"),
  },
} satisfies Record<CenterSlug, ProfileProductionCenterConfig>;

const profileProductionCardDecoClasses = [
  "left-[calc(var(--page-deco-size)/-2)] top-[calc(var(--page-deco-size)/-2)]",
  "right-[calc(var(--page-deco-size)/-2)] top-[calc(var(--page-deco-size)/-2)]",
  "right-[calc(var(--page-deco-size)/-2)] bottom-[calc(var(--page-deco-size)/-2)]",
] as const;

export function generateStaticParams() {
  return profileProductionCenters.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const center = assertCenter(slug);

  return {
    description: `${getCenterLabel(center)} 프로필 제작 절차와 BNB 전용 스튜디오 안내`,
    title: `프로필 제작 절차 안내 | ${getCenterLabel(center)}`,
  };
}

export default async function ProfileProductionPage({ params }: Args) {
  const { slug } = await params;
  const center = assertCenter(slug);
  const profileProductionConfig = profileProductionConfigs[center];
  const profileProductionItems = profileProductionConfig.items;
  const decoIcons = getPageDecoIcons(
    profileProductionItems.length + 2,
    `profile-production-${center}`,
  );

  return (
    <main
      className="page page-light page-profile-production"
      data-center={center}
    >
      <section
        aria-labelledby="profile-production-hero-title"
        className="section-profile-production-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-60"
          fill
          priority
          sizes="100vw"
          src={profileProductionConfig.heroImage}
        />
        <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[38%] max-md:!hidden md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:!hidden md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1
            className="section-profile-production-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
            id="profile-production-hero-title"
          >
            <span className="block text-brand">캐스팅</span>
            <span className="block">배우 케어 시스템</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="profile-production-list-title"
        className="section-profile-production-list section-p-block-base bg-white text-neutral-900"
      >
        <div className="container grid items-start gap-12 overflow-visible lg:grid-cols-3">
          <aside className="section-profile-production-list__aside lg:sticky lg:top-[calc(var(--page-top-offset)+32px)] lg:self-start">
            <h2
              className="section-profile-production-list__title type-display-m font-semibold md:type-display-l"
              id="profile-production-list-title"
            >
              프로필 제작
              <br className="hidden md:block" /> 절차 안내
            </h2>

            <ProfileProductionIndex
              items={profileProductionItems.map(({ id, title }) => ({
                id,
                title,
              }))}
            />
          </aside>

          <div className="section-profile-production-list__items col-span-1 flex flex-col gap-16 md:gap-20 lg:col-span-2">
            {profileProductionItems.map((item, index) => (
              <article
                className="section-profile-production-card scroll-mt-(--page-top-offset)"
                id={item.id}
                key={item.id}
              >
                <div className="section-profile-production-card__media relative aspect-[552/320]">
                  <PageDeco
                    className={[
                      "z-20 opacity-90",
                      profileProductionCardDecoClasses[
                        index % profileProductionCardDecoClasses.length
                      ],
                    ].join(" ")}
                    icon={decoIcons[index + 2]}
                    size="clamp(64px, 6vw, 90px)"
                  />
                  <ProfileProductionMedia
                    media={item.media}
                    title={item.title}
                  />
                </div>
                <div className="section-profile-production-card__body mt-8 flex flex-col gap-5">
                  <header className="section-profile-production-card__head flex flex-col gap-3 sm:flex-row sm:items-end">
                    <span className="section-profile-production-card__number inline-flex w-fit rounded-full bg-neutral-900 px-3 py-1 type-label-m font-extrabold leading-[1.2] text-white">
                      {formatProfileProductionIndex(index)}
                    </span>
                    <h3 className="section-profile-production-card__title type-title-l font-bold leading-[1.2] text-neutral-900">
                      {item.title}
                    </h3>
                  </header>
                  <div className="section-profile-production-card__description flex flex-col gap-4 type-body-m leading-relaxed text-neutral-500">
                    {item.description.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileProductionMedia({
  media,
  title,
}: {
  media: ProfileProductionMedia;
  title: string;
}) {
  if (media.kind === "single") {
    return (
      <div className="relative z-10 size-full overflow-hidden bg-neutral-200">
        <Image
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          fill
          sizes="(max-width: 1023px) calc(100vw - 40px), 552px"
          src={media.src}
          style={{ objectPosition: media.objectPosition }}
        />
      </div>
    );
  }

  return (
    <div className="relative z-10 grid size-full grid-cols-2 overflow-hidden bg-neutral-200">
      {media.images.map((image, index) => (
        <div
          className={[
            "section-profile-production-card__media-cell relative min-h-0 overflow-hidden",
            image.className ?? "",
          ].join(" ")}
          key={`${title}-${image.src}-${index}`}
        >
          <Image
            alt=""
            aria-hidden="true"
            className={
              image.objectFit === "contain"
                ? "size-full object-contain"
                : "size-full object-cover"
            }
            fill
            sizes="(max-width: 1023px) calc((100vw - 40px) / 2), 276px"
            src={image.src}
            style={{ objectPosition: image.objectPosition }}
          />
        </div>
      ))}
    </div>
  );
}

function formatProfileProductionIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}
