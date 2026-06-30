import type { CollectionConfig, Validate } from "payload";

import {
  MetaDescriptionField,
  MetaImageField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields";
import {
  BlockquoteFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { createKoreanSlugifyWithFallback } from "../utilities/koreanSlugify";

import { centerScopedCollectionAccess } from "./access";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from "./revalidateFrontend";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  sidebarFields,
  slugField,
} from "./shared";
import { seoTitleField } from "./seoFields";

const artistPressSlugify = createKoreanSlugifyWithFallback("artist-press");
const revalidateArtistPressAfterChange = createCenterRevalidationAfterChange({
  reason: "artist press",
  suffixes: ["", "artist-press"],
});
const revalidateArtistPressAfterDelete = createCenterRevalidationAfterDelete({
  reason: "artist press",
  suffixes: ["", "artist-press"],
});

const validateArtistPressAgency: Validate<unknown> = (value) => {
  return value ? true : "소속사를 선택해야 합니다.";
};

const artistPressBodyEditor = lexicalEditor({
  admin: {
    placeholder: "본문을 입력하세요.",
  },
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
});

export const ArtistPress: CollectionConfig = {
  slug: "artist-press",
  labels: {
    plural: "출신 아티스트",
    singular: "출신 아티스트",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "centers",
      "authorName",
      "actorName",
      "generation",
      "publishedAt",
      "updatedAt",
    ],
    group: "아티스트",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterChange: [
      revalidateArtistPressAfterChange,
      normalizeUploadedMediaPrefixes([
        { path: "thumbnailMedia", role: "artist-press.thumbnail" },
        { path: "agencyLogoMedia", role: "artist-press.agency-logo" },
        { path: "body", role: "artist-press.body-image", type: "richText" },
      ]),
    ],
    afterDelete: [revalidateArtistPressAfterDelete],
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "제목",
      required: true,
    },
    ...adminTabs([
      {
        label: "콘텐츠",
        fields: [
          adminRow([
            {
              name: "actorName",
              type: "text",
              label: "배우명",
              required: true,
              admin: {
                width: "33.333%",
              },
            },
            {
              name: "agency",
              type: "relationship",
              label: "소속사",
              relationTo: "artist-press-agencies",
              validate: validateArtistPressAgency,
              admin: {
                className: "bnb-admin-required-field",
                description:
                  "소속사가 검색되지 않으면 먼저 소속사 로고 설정에 등록하세요.",
                width: "33.333%",
              },
            },
            {
              name: "generation",
              type: "text",
              label: "기수",
              required: true,
              admin: {
                width: "33.333%",
              },
            },
          ]),
          {
            name: "thumbnailMedia",
            type: "upload",
            label: "대표 이미지",
            relationTo: "media",
          },
          {
            name: "agencyLogoMedia",
            type: "upload",
            label: "소속사 로고 이미지",
            relationTo: "media",
            admin: {
              hidden: true,
            },
          },
          {
            name: "body",
            type: "richText",
            editor: artistPressBodyEditor,
            label: "본문",
          },
        ],
      },
      {
        name: "meta",
        label: "SEO",
        fields: [
          OverviewField({
            titlePath: "meta.title",
            descriptionPath: "meta.description",
            imagePath: "meta.image",
          }),
          seoTitleField(),
          MetaImageField({
            relationTo: "media",
          }),
          MetaDescriptionField({}),
          PreviewField({
            hasGenerateFn: true,
            titlePath: "meta.title",
            descriptionPath: "meta.description",
          }),
        ],
      },
    ]),
    ...sidebarFields([
      centersField,
      {
        name: "displayStatus",
        type: "select",
        label: "상태",
        defaultValue: "archived",
        options: displayStatusOptions,
      },
      publishedAtField,
      authorNameField,
    ]),
    slugField({
      slugify: artistPressSlugify,
    }),
  ],
  versions: {
    maxPerDoc: 15,
  },
};
