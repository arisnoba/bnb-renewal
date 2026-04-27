import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminCollapsible,
  adminRow,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  isExamAdminMenuHidden,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

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
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    {
      name: "school",
      type: "relationship",
      label: "학교 선택",
      relationTo: "exam-school-logos",
      required: true,
      admin: {
        description:
          "학교가 검색되지 않으면 먼저 대학 로고 설정에 학교와 로고를 등록하세요.",
      },
    },
    { name: "bodyHtml", type: "textarea", label: "본문" },
    adminRow([imagePathField("studentImagePath", "학생 이미지", true)]),
    adminCollapsible("레거시 학교 정보", [
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
      adminRow([imagePathField("schoolLogoPath", "학교 로고 경로")]),
    ]),
    ...sidebarFields([centersField, ...publishingFields, authorNameField]),
    legacyCollapsible(),
  ],
};
