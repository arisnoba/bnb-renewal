import type { CollectionBeforeValidateHook, CollectionConfig, Field } from "payload";

import {
  BlockquoteFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { centerScopedCollectionAccess } from "./access";
import {
  authorNameField,
  authorNameFromCenters,
  centersField,
  displayStatusOptions,
  imagePathField,
  isExamAdminMenuHidden,
  publishedAtField,
  publishingStatusSelectAdmin,
  sidebarFields,
} from "./shared";
import {
  createFinalizeIdSlugAfterCreate,
  createIdSlugBeforeValidate,
  idSlugField,
} from "./slugUtils";
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from "./revalidateFrontend";

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

const examCentersField = {
  ...centersField,
  defaultValue: ["exam"],
  admin: {
    ...(centersField.admin ?? {}),
    hidden: true,
    readOnly: true,
  },
} as Field;

function userDisplayName(user: unknown) {
  if (!user || typeof user !== "object") {
    return undefined;
  }

  const name = (user as { name?: unknown }).name;
  const email = (user as { email?: unknown }).email;

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  if (typeof email === "string" && email.trim()) {
    return email.trim();
  }

  return undefined;
}

const setExamResultCenterBeforeValidate: CollectionBeforeValidateHook = ({ data, req }) => {
  if (!data) {
    return data;
  }

  return {
    ...data,
    authorName: userDisplayName(req.user) ?? data.authorName ?? authorNameFromCenters(["exam"]),
    centers: ["exam"],
  };
};

const setExamResultSlug = createIdSlugBeforeValidate();
const finalizeExamResultSlugAfterCreate = createFinalizeIdSlugAfterCreate("exam-results");
const revalidateExamResultAfterChange = createCenterRevalidationAfterChange({
  cacheTags: [
    "frontend_exam_results_university",
    "frontend_exam_results_arts_high_school",
  ],
  reason: "exam result",
  suffixes: ["", "university-results", "arts-high-results"],
});
const revalidateExamResultAfterDelete = createCenterRevalidationAfterDelete({
  cacheTags: [
    "frontend_exam_results_university",
    "frontend_exam_results_arts_high_school",
  ],
  reason: "exam result",
  suffixes: ["", "university-results", "arts-high-results"],
});

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
    afterChange: [finalizeExamResultSlugAfterCreate, revalidateExamResultAfterChange],
    afterDelete: [revalidateExamResultAfterDelete],
    beforeValidate: [setExamResultCenterBeforeValidate, setExamResultSlug],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    imagePathField("thumbnailPath", "대표 이미지"),
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
        admin: publishingStatusSelectAdmin(),
      },
      authorNameField,
      idSlugField,
    ]),
  ],
};
