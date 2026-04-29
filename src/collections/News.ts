import type {
  CollectionAfterReadHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from "payload";

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields";
import {
  BlockquoteFeature,
  convertHTMLToLexical,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { JSDOM } from "jsdom";
import { slugField } from "payload";
import { createKoreanSlugifyWithFallback } from "../utilities/koreanSlugify";

import { centerScopedCollectionAccess } from "./access";
import {
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  imagePathField,
  legacyMetaField,
  publishedAtField,
  sidebarFields,
} from "./shared";

const newsSlugify = createKoreanSlugifyWithFallback("news");

const newsBodyEditor = lexicalEditor({
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

function hasLexicalContent(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const root = (value as { root?: unknown }).root;

  if (!root || typeof root !== "object") {
    return false;
  }

  const children = (root as { children?: unknown }).children;

  return Array.isArray(children) && children.length > 0;
}

function legacyHtmlFromDoc(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const bodyHtml = (value as { bodyHtml?: unknown }).bodyHtml;

  return typeof bodyHtml === "string" ? bodyHtml.trim() : "";
}

async function lexicalBodyFromLegacyHtml({
  html,
  req,
}: {
  html: string;
  req: Parameters<CollectionBeforeValidateHook>[0]["req"];
}) {
  const adapter = await newsBodyEditor({
    config: req.payload.config,
    parentIsLocalized: false,
  });

  return convertHTMLToLexical({
    editorConfig: adapter.editorConfig,
    html,
    JSDOM,
  });
}

const populateNewsBodyFromLegacyHtmlBeforeValidate: CollectionBeforeValidateHook =
  async ({ data, originalDoc, req }) => {
    if (!data || hasLexicalContent(data.body)) {
      return data;
    }

    const html = legacyHtmlFromDoc(data) || legacyHtmlFromDoc(originalDoc);

    if (!html) {
      return data;
    }

    return {
      ...data,
      body: await lexicalBodyFromLegacyHtml({ html, req }),
    };
  };

const populateNewsBodyFromLegacyHtmlAfterRead: CollectionAfterReadHook = async ({
  doc,
  req,
}) => {
  if (!doc || hasLexicalContent(doc.body)) {
    return doc;
  }

  const html = legacyHtmlFromDoc(doc);

  if (!html) {
    return doc;
  }

  return {
    ...doc,
    body: await lexicalBodyFromLegacyHtml({ html, req }),
  };
};

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
    afterRead: [populateNewsBodyFromLegacyHtmlAfterRead],
    beforeValidate: [
      centerScopedBeforeValidate,
      populateNewsBodyFromLegacyHtmlBeforeValidate,
    ],
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
            name: "excerpt",
            type: "textarea",
            label: "요약",
          },
          {
            name: "body",
            type: "richText",
            editor: newsBodyEditor,
            label: "본문",
          },
        ],
      },
      {
        label: "미디어",
        fields: [
          {
            name: "thumbnailMedia",
            type: "upload",
            label: "썸네일 이미지",
            relationTo: "media",
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
      {
        label: "레거시/원본",
        fields: [
          {
            name: "sourceDb",
            type: "text",
            label: "원본 DB",
            defaultValue: "payload",
            required: true,
          },
          {
            name: "sourceTable",
            type: "text",
            label: "원본 테이블",
            defaultValue: "news",
            required: true,
          },
          {
            name: "sourceId",
            type: "number",
            label: "원본 ID",
            defaultValue: 0,
            required: true,
          },
          {
            name: "bodyHtml",
            type: "textarea",
            label: "레거시 본문 HTML",
            defaultValue: "",
          },
          imagePathField("thumbnailPath", "레거시 썸네일 경로"),
          legacyMetaField,
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
