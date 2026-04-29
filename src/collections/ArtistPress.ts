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
  adminRow,
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
  const adapter = await artistPressBodyEditor({
    config: req.payload.config,
    parentIsLocalized: false,
  });

  return convertHTMLToLexical({
    editorConfig: adapter.editorConfig,
    html,
    JSDOM,
  });
}

const populateArtistPressBodyFromLegacyHtmlBeforeValidate: CollectionBeforeValidateHook =
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

const populateArtistPressBodyFromLegacyHtmlAfterRead: CollectionAfterReadHook =
  async ({ doc, req }) => {
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
    group: "매니지먼트",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterRead: [populateArtistPressBodyFromLegacyHtmlAfterRead],
    beforeValidate: [
      centerScopedBeforeValidate,
      populateArtistPressBodyFromLegacyHtmlBeforeValidate,
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
            name: "thumbnailMedia",
            type: "upload",
            label: "썸네일 이미지",
            relationTo: "media",
          },
          {
            name: "agencyLogoMedia",
            type: "upload",
            label: "소속사 이미지",
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
            defaultValue: "artist_press",
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
          },
          imagePathField("thumbnailPath", "레거시 썸네일 경로"),
          imagePathField("agencyLogoPath", "레거시 소속사 로고 경로"),
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
    slugField({
      slugify: artistPressSlugify,
    }),
  ],
  versions: {
    maxPerDoc: 15,
  },
};
