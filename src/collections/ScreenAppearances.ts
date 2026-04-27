import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const ScreenAppearances: CollectionConfig = {
  slug: "screen-appearances",
  labels: {
    plural: "드라마/광고 출연장면",
    singular: "드라마/광고 출연장면",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "centers",
      "authorName",
      "performerName",
      "projectTitle",
      "publishedAt",
    ],
    group: "캐스팅/오디션",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    ...adminTabs([
      {
        label: "출연장면",
        fields: [
          { name: "title", type: "text", label: "제목", required: true },
          {
            name: "appearanceType",
            type: "text",
            label: "출연 유형",
            required: true,
          },
          adminRow([
            {
              name: "performerName",
              type: "text",
              label: "출연자",
              required: true,
            },
            { name: "className", type: "text", label: "반/클래스" },
          ]),
          adminRow([
            { name: "projectTitle", type: "text", label: "작품명" },
            { name: "roleName", type: "text", label: "역할" },
          ]),
          { name: "airDateLabel", type: "text", label: "방영일 표시" },
          { name: "bodyHtml", type: "textarea", label: "본문" },
        ],
      },
      {
        label: "미디어",
        fields: [
          adminRow([imagePathField("profileImagePath", "프로필 이미지")]),
          adminRow([imagePathField("thumbnailPath", "썸네일")]),
        ],
      },
    ]),
    ...sidebarFields([centersField, ...publishingFields, authorNameField]),
    legacyCollapsible(),
  ],
};
