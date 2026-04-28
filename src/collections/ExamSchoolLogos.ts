import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminCollapsible,
  adminRow,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  isExamAdminMenuHidden,
  legacyMetaField,
  sidebarFields,
} from "./shared";

function validateSchoolSlug(value: unknown) {
  const slug = String(value ?? "").trim();

  if (!slug) {
    return "학교 슬러그를 입력하세요.";
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "학교 슬러그는 영문 소문자, 숫자, 하이픈(-)만 입력할 수 있습니다.";
  }

  return true;
}

export const ExamSchoolLogos: CollectionConfig = {
  slug: "exam-school-logos",
  labels: {
    plural: "대학 로고 설정",
    singular: "대학 로고 설정",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["schoolName", "schoolSlug", "centers", "authorName", "updatedAt"],
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
        admin: {
          description:
            "영문 소문자, 숫자, 하이픈(-)만 입력하세요. 예: seoul-arts",
        },
        validate: validateSchoolSlug,
      },
    ]),
    {
      name: "logoMedia",
      type: "upload",
      label: "로고 이미지",
      relationTo: "media",
    },
    {
      name: "reviewCount",
      type: "number",
      label: "후기 수",
      defaultValue: 0,
      admin: {
        hidden: true,
      },
    },
    ...sidebarFields([centersField, authorNameField]),
    adminCollapsible("레거시/원본", [
      {
        name: "logoPath",
        type: "text",
        label: "레거시 로고 경로",
      },
      {
        name: "logoOriginalName",
        type: "text",
        label: "원본 파일명",
        admin: {
          hidden: true,
        },
      },
      {
        name: "logoFile",
        type: "text",
        label: "로고 파일",
        admin: {
          hidden: true,
        },
      },
      {
        name: "logoWidth",
        type: "number",
        label: "가로",
        admin: {
          hidden: true,
        },
      },
      {
        name: "logoHeight",
        type: "number",
        label: "세로",
        admin: {
          hidden: true,
        },
      },
      legacyMetaField,
    ]),
  ],
};
