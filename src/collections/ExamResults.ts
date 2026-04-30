import type { CollectionConfig, Field } from "payload";

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
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  imagePathField,
  isExamAdminMenuHidden,
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

const examResultSlugify = createKoreanSlugifyWithFallback("exam-result");

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
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    imagePathField("thumbnailPath", "미디어"),
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
        label: "상태",
        defaultValue: "archived",
        options: displayStatusOptions,
      },
      authorNameField,
      slugField({
        slugify: examResultSlugify,
      }),
    ]),
  ],
};
