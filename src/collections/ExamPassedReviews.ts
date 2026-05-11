import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
} from "payload";

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
  adminRow,
  authorNameFromCenters,
  centersField,
  displayStatusOptions,
  imagePathField,
  isExamAdminMenuHidden,
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

const setExamPassedReviewCenterBeforeValidate: CollectionBeforeValidateHook =
  async ({ data, req }) => {
    if (!data) {
      return data;
    }

    return {
      ...data,
      authorName: userDisplayName(req.user) ?? data.authorName ?? authorNameFromCenters(["exam"]),
      centers: ["exam"],
    };
  };

const examCentersField = {
  ...centersField,
  defaultValue: ["exam"],
  admin: {
    ...(centersField.admin ?? {}),
    hidden: true,
    readOnly: true,
  },
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
    beforeValidate: [setExamPassedReviewCenterBeforeValidate],
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
    adminRow([
      {
        name: "studentName",
        type: "text",
        label: "학생명",
        required: true,
      },
      {
        name: "cohort",
        type: "text",
        label: "기수",
      },
    ]),
    {
      name: "resultSummary",
      type: "textarea",
      label: "합격현황",
    },
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
      labels: {
        plural: "인터뷰",
        singular: "인터뷰",
      },
      admin: {
        components: {
          RowLabel:
            "@/components/payload/ExamPassedReviewInterviewRowLabel#ExamPassedReviewInterviewRowLabel",
        },
      },
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
    ]),
  ],
  versions: {
    maxPerDoc: 15,
  },
};
