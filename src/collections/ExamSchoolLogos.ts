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
  legacyMetaField,
  sidebarFields,
} from "./shared";

export const ExamSchoolLogos: CollectionConfig = {
  slug: "exam-school-logos",
  labels: {
    plural: "대학 로고 설정",
    singular: "대학 로고 설정",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["schoolName", "centers", "authorName", "reviewCount", "updatedAt"],
    group: "입시센터 후기/합격",
    hidden: ({ user }) => isExamAdminMenuHidden(user),
    useAsTitle: "schoolName",
  },
  defaultSort: "schoolName",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    adminRow([
      {
        name: "schoolName",
        type: "text",
        label: "학교명",
        required: true,
      },
      {
        name: "schoolSlug",
        type: "text",
        label: "학교 슬러그",
        required: true,
        unique: true,
      },
    ]),
    {
      name: "reviewCount",
      type: "number",
      label: "후기 수",
      defaultValue: 0,
    },
    imagePathField("logoPath", "로고 이미지", true),
    adminRow([
      { name: "logoOriginalName", type: "text", label: "원본 파일명" },
      {
        name: "logoFile",
        type: "text",
        label: "로고 파일",
        required: true,
      },
    ]),
    adminRow([
      { name: "logoWidth", type: "number", label: "가로" },
      { name: "logoHeight", type: "number", label: "세로" },
    ]),
    ...sidebarFields([centersField, authorNameField]),
    adminCollapsible("레거시/원본", [legacyMetaField]),
  ],
};
