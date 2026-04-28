import type {
  CollectionAfterReadHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
} from "payload";

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
import { centerScopedCollectionAccess } from "./access";
import {
  adminCollapsible,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  imagePathField,
  isExamAdminMenuHidden,
  legacyMetaField,
  publishedAtField,
  sidebarFields,
} from "./shared";

const examResultBodyEditor = lexicalEditor({
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

const resultTypeOptions = [
  { label: "대학", value: "university" },
  { label: "예술고", value: "arts_high_school" },
];

function examResultSlugify({ valueToSlugify }: { valueToSlugify?: unknown }) {
  const normalized = String(valueToSlugify ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const tokens = normalized.match(/[a-z0-9]+/g) ?? [];

  if (tokens.length > 0) {
    return tokens.join("-");
  }

  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6);

  return `exam-result-${date}-${suffix}`;
}

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

function isImageUrl(value: string) {
  const pathname = value.split("?")[0] ?? "";

  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(pathname);
}

function legacyBodyWithoutImageLinks(html: string) {
  const { document } = new JSDOM(html).window;
  const bodyRoot = document.body.cloneNode(true) as Element;

  bodyRoot.querySelectorAll("img").forEach((image) => image.remove());
  bodyRoot.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") ?? "";
    const text = link.textContent?.trim() ?? "";

    if (isImageUrl(href) || isImageUrl(text)) {
      link.remove();
    }
  });

  return bodyRoot.innerHTML.trim();
}

async function lexicalBodyFromLegacyHtml({
  html,
  req,
}: {
  html: string;
  req: Parameters<CollectionBeforeValidateHook>[0]["req"];
}) {
  const adapter = await examResultBodyEditor({
    config: req.payload.config,
    parentIsLocalized: false,
  });

  return convertHTMLToLexical({
    editorConfig: adapter.editorConfig,
    html,
    JSDOM,
  });
}

const populateExamResultBodyFromLegacyHtmlBeforeValidate: CollectionBeforeValidateHook =
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
      body: await lexicalBodyFromLegacyHtml({
        html: legacyBodyWithoutImageLinks(html),
        req,
      }),
    };
  };

const populateExamResultBodyFromLegacyHtmlAfterRead: CollectionAfterReadHook =
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
      body: await lexicalBodyFromLegacyHtml({
        html: legacyBodyWithoutImageLinks(html),
        req,
      }),
    };
  };

const examCentersField = {
  ...centersField,
  defaultValue: ["exam"],
} as Field;

export const ExamResults: CollectionConfig = {
  slug: "exam-results",
  labels: {
    plural: "합격결과",
    singular: "합격결과",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["title", "centers", "authorName", "resultType", "publishedAt", "updatedAt"],
    group: "입시센터 후기/합격",
    hidden: ({ user }) => isExamAdminMenuHidden(user),
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterRead: [populateExamResultBodyFromLegacyHtmlAfterRead],
    beforeValidate: [
      centerScopedBeforeValidate,
      populateExamResultBodyFromLegacyHtmlBeforeValidate,
    ],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    imagePathField("thumbnailPath", "미디어"),
    {
      name: "thumbnailSource",
      type: "text",
      label: "썸네일 출처",
      defaultValue: "admin",
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: "resultType",
      type: "select",
      label: "학교 유형",
      options: resultTypeOptions,
      required: true,
    },
    {
      name: "body",
      type: "richText",
      editor: examResultBodyEditor,
      label: "본문",
    },
    ...sidebarFields([
      examCentersField,
      publishedAtField,
      {
        name: "displayStatus",
        type: "select",
        label: "노출 상태",
        defaultValue: "published",
        options: displayStatusOptions,
        required: true,
      },
      authorNameField,
      slugField({
        slugify: examResultSlugify,
      }),
    ]),
    adminCollapsible("레거시/원본", [
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
        defaultValue: "exam_results",
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
      legacyMetaField,
    ]),
  ],
};
