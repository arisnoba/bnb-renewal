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
import { createKoreanSlugifyWithFallback } from "../utilities/koreanSlugify";

import { centerScopedCollectionAccess } from "./access";
import {
  adminCollapsible,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  imagePathField,
  isExamAdminMenuHidden,
  legacyMetaField,
  publishedAtField,
  sidebarFields,
} from "./shared";

const examPassedReviewBodyEditor = lexicalEditor({
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

const examPassedReviewSlugify = createKoreanSlugifyWithFallback("exam-passed-review");

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

function stringFromPath(value: unknown, path: string[]) {
  let current = value;

  for (const key of path) {
    if (!current || typeof current !== "object") {
      return "";
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current.trim() : "";
}

function legacyStudentImagePathFromDoc(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const doc = value as Record<string, unknown>;
  const studentImagePath =
    typeof doc.studentImagePath === "string" ? doc.studentImagePath.trim() : "";

  if (studentImagePath) {
    return studentImagePath;
  }

  return stringFromPath(doc.legacyMeta, ["studentImage", "path"]);
}

function legacySourceValueFromDoc(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const doc = value as Record<string, unknown>;
  const directValue = doc[key];

  if (typeof directValue === "string" && directValue.trim()) {
    return directValue.trim();
  }

  if (typeof directValue === "number" && Number.isFinite(directValue)) {
    return String(directValue);
  }

  const legacyValue = stringFromPath(doc.legacyMeta, [key]);

  return legacyValue;
}

function fileNameFromPath(value: string) {
  const pathname = value.split("?")[0] ?? "";

  return pathname.split("/").filter(Boolean).pop() ?? "";
}

function examReviewBoTableFromSourceTable(value: string) {
  if (value === "g5_write_new_hoogi" || value === "exam_passed_reviews") {
    return "new_hoogi";
  }

  return value || "new_hoogi";
}

function localLegacyStudentImagePathFromDoc(value: unknown) {
  const imagePath = legacyStudentImagePathFromDoc(value);

  if (!imagePath || imagePath.startsWith("/legacy/")) {
    return imagePath;
  }

  if (!imagePath.includes("/web/data/file/new_hoogi/")) {
    return imagePath;
  }

  const fileName = fileNameFromPath(imagePath);
  const sourceDb = legacySourceValueFromDoc(value, "sourceDb") || "bnbuniv";
  const sourceId = legacySourceValueFromDoc(value, "sourceId");
  const sourceTable = legacySourceValueFromDoc(value, "sourceTable");

  if (!fileName || !sourceId) {
    return imagePath;
  }

  return [
    "/legacy/exam-passed-reviews",
    sourceDb,
    examReviewBoTableFromSourceTable(sourceTable),
    sourceId,
    "student",
    fileName,
  ].join("/");
}

function hasInterviews(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function cleanLegacyText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b\ufeff]/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function extractLegacyReviewContent(html: string) {
  const { document } = new JSDOM(html).window;
  const sceneWrap = document.querySelector(".scene_wrap");
  const bodyRoot = (sceneWrap?.cloneNode(true) ?? document.body.cloneNode(true)) as Element;
  const interviewRoot = sceneWrap ?? document;
  const interviews = Array.from(interviewRoot.querySelectorAll(".scene_career"))
    .map((item) => {
      const question = cleanLegacyText(item.querySelector("span")?.textContent ?? "");
      const answer = cleanLegacyText(item.querySelector("p")?.textContent ?? "");

      return question && answer ? { question, answer } : undefined;
    })
    .filter((item): item is { answer: string; question: string } => Boolean(item));

  bodyRoot.querySelectorAll(".scene_career").forEach((item) => item.remove());
  bodyRoot.querySelectorAll("img").forEach((image) => image.remove());

  const bodyHtml = sceneWrap ? bodyRoot.outerHTML.trim() : bodyRoot.innerHTML.trim();

  return {
    bodyHtml: bodyHtml || html,
    interviews,
  };
}

async function lexicalBodyFromLegacyHtml({
  html,
  req,
}: {
  html: string;
  req: Parameters<CollectionBeforeValidateHook>[0]["req"];
}) {
  const adapter = await examPassedReviewBodyEditor({
    config: req.payload.config,
    parentIsLocalized: false,
  });

  return convertHTMLToLexical({
    editorConfig: adapter.editorConfig,
    html,
    JSDOM,
  });
}

const populateExamPassedReviewBodyFromLegacyHtmlBeforeValidate: CollectionBeforeValidateHook =
  async ({ data, originalDoc, req }) => {
    if (!data || (hasLexicalContent(data.body) && hasInterviews(data.interviews))) {
      return data;
    }

    const html = legacyHtmlFromDoc(data) || legacyHtmlFromDoc(originalDoc);

    if (!html) {
      return data;
    }

    const docWithOriginalSource =
      originalDoc && typeof originalDoc === "object"
        ? { ...originalDoc, ...data }
        : data;
    const studentImagePath = localLegacyStudentImagePathFromDoc(docWithOriginalSource);
    const parsed = extractLegacyReviewContent(html);
    const body = hasLexicalContent(data.body)
      ? data.body
      : await lexicalBodyFromLegacyHtml({ html: parsed.bodyHtml, req });

    return {
      ...data,
      body,
      interviews: hasInterviews(data.interviews) ? data.interviews : parsed.interviews,
      studentImagePath,
    };
  };

const populateExamPassedReviewBodyFromLegacyHtmlAfterRead: CollectionAfterReadHook =
  async ({ doc, req }) => {
    if (!doc || (hasLexicalContent(doc.body) && hasInterviews(doc.interviews))) {
      return doc;
    }

    const html = legacyHtmlFromDoc(doc);

    if (!html) {
      return doc;
    }

    const studentImagePath = localLegacyStudentImagePathFromDoc(doc);
    const parsed = extractLegacyReviewContent(html);
    const body = hasLexicalContent(doc.body)
      ? doc.body
      : await lexicalBodyFromLegacyHtml({ html: parsed.bodyHtml, req });

    return {
      ...doc,
      body,
      interviews: hasInterviews(doc.interviews) ? doc.interviews : parsed.interviews,
      studentImagePath,
    };
  };

const examCentersField = {
  ...centersField,
  defaultValue: ["exam"],
} as Field;

export const ExamPassedReviews: CollectionConfig = {
  slug: "exam-passed-reviews",
  labels: {
    plural: "합격후기",
    singular: "합격후기",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["title", "centers", "authorName", "school", "publishedAt", "updatedAt"],
    group: "입시센터 후기/합격",
    hidden: ({ user }) => isExamAdminMenuHidden(user),
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterRead: [populateExamPassedReviewBodyFromLegacyHtmlAfterRead],
    beforeValidate: [
      centerScopedBeforeValidate,
      populateExamPassedReviewBodyFromLegacyHtmlBeforeValidate,
    ],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    {
      name: "school",
      type: "relationship",
      label: "학교선택",
      relationTo: "exam-school-logos",
      required: true,
      admin: {
        description:
          "학교가 검색되지 않으면 먼저 대학 로고 설정에 학교와 로고를 등록하세요.",
      },
    },
    imagePathField("studentImagePath", "학생이미지", true),
    {
      name: "body",
      type: "richText",
      editor: examPassedReviewBodyEditor,
      label: "본문",
    },
    {
      name: "interviews",
      type: "array",
      label: "인터뷰",
      fields: [
        {
          name: "question",
          type: "text",
          label: "질문",
          required: true,
        },
        {
          name: "answer",
          type: "textarea",
          label: "대답",
          required: true,
        },
      ],
    },
    ...sidebarFields([
      examCentersField,
      publishedAtField,
      {
        name: "displayStatus",
        type: "select",
        label: "상태",
        defaultValue: "archived",
        options: displayStatusOptions,
      },
      {
        name: "authorName",
        type: "text",
        label: "작성자",
        admin: {
          readOnly: true,
        },
      },
      slugField({
        slugify: examPassedReviewSlugify,
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
        defaultValue: "exam_passed_reviews",
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
      {
        name: "schoolName",
        type: "text",
        label: "학교명",
      },
      {
        name: "schoolLogoSlug",
        type: "text",
        label: "학교 로고 슬러그",
      },
      imagePathField("schoolLogoPath", "학교 로고 경로"),
      legacyMetaField,
    ]),
  ],
  versions: {
    maxPerDoc: 15,
  },
};
