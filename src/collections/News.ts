import type { CollectionConfig } from "payload";

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
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  publishingStatusSelectAdmin,
  sidebarFields,
  slugField,
} from "./shared";
import { seoTitleField } from "./seoFields";

const newsSlugify = createKoreanSlugifyWithFallback("news");
const revalidateNewsAfterChange = createCenterRevalidationAfterChange({
  reason: "news",
  suffixes: ["", "news"],
});
const revalidateNewsAfterDelete = createCenterRevalidationAfterDelete({
  reason: "news",
  suffixes: ["", "news"],
});

export const newsBodyEditor = lexicalEditor({
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

export const News: CollectionConfig = {
  slug: "news",
  labels: {
    plural: "뉴스",
    singular: "뉴스",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "slug",
      "centers",
      "authorName",
      "category",
      "publishedAt",
      "updatedAt",
    ],
    group: "운영/소식",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterChange: [
      revalidateNewsAfterChange,
      normalizeUploadedMediaPrefixes([
        { path: "thumbnailMedia", role: "news.thumbnail" },
        { path: "body", role: "news.body-image", type: "richText" },
      ]),
    ],
    afterDelete: [revalidateNewsAfterDelete],
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
          {
            name: "category",
            type: "text",
            label: "분류",
          },
          {
            name: "thumbnailMedia",
            type: "upload",
            label: "대표 이미지",
            relationTo: "media",
          },
          {
            name: "body",
            type: "richText",
            editor: newsBodyEditor,
            label: "본문",
          },
          {
            name: "excerpt",
            type: "textarea",
            label: "요약",
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
        admin: publishingStatusSelectAdmin(),
      },
      publishedAtField,
      authorNameField,
    ]),
    {
      name: "viewCount",
      type: "number",
      label: "조회수",
      defaultValue: 0,
      admin: {
        hidden: true,
      },
    },
    slugField({
      slugify: newsSlugify,
    }),
  ],
  versions: {
    maxPerDoc: 15,
  },
};
