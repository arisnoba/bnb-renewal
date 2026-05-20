import type { CollectionConfig } from "payload";

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
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
import { slugField } from "payload";
import { createKoreanSlugifyWithFallback } from "../utilities/koreanSlugify";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  sidebarFields,
} from "./shared";

const artistPressSlugify = createKoreanSlugifyWithFallback("artist-press");

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
            },
            {
              name: "generation",
              type: "text",
              label: "기수",
              required: true,
            },
          ]),
          {
            name: "body",
            type: "richText",
            editor: artistPressBodyEditor,
            label: "본문",
          },
        ],
      },
      {
        label: "미디어",
        fields: [
          {
            name: "agency",
            type: "relationship",
            label: "소속사",
            relationTo: "artist-press-agencies",
            admin: {
              description:
                "소속사가 검색되지 않으면 먼저 출신 아티스트 소속사 설정에 등록하세요.",
            },
          },
          {
            name: "thumbnailMedia",
            type: "upload",
            label: "썸네일 이미지",
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
          MetaTitleField({
            hasGenerateFn: true,
          }),
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
