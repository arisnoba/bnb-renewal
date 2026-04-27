import type { CollectionConfig } from "payload";

import { allowAll, loggedInOnly } from "./access";
import {
  adminCollapsible,
  adminRow,
  adminTabs,
  imagePathField,
  legacyMetaField,
} from "./shared";

export const ExamSchoolLogos: CollectionConfig = {
  slug: "exam-school-logos",
  labels: {
    plural: "합격 학교 로고",
    singular: "합격 학교 로고",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ["schoolName", "reviewCount", "updatedAt"],
    group: "후기/합격",
    useAsTitle: "schoolName",
  },
  defaultSort: "schoolName",
  fields: [
    ...adminTabs([
      {
        label: "학교",
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
        ],
      },
      {
        label: "로고",
        fields: [
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
        ],
      },
    ]),
    adminCollapsible("레거시/원본", [legacyMetaField]),
  ],
};
