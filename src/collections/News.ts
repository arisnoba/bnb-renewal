import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const News: CollectionConfig = {
  slug: "news",
  labels: {
    plural: "뉴스",
    singular: "뉴스",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "centers",
      "authorName",
      "category",
      "publishedAt",
      "updatedAt",
    ],
    group: "운영/소식",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    ...adminTabs([
      {
        label: "콘텐츠",
        fields: [
          {
            name: "title",
            type: "text",
            label: "제목",
            required: true,
          },
          {
            name: "category",
            type: "text",
            label: "분류",
          },
          {
            name: "excerpt",
            type: "textarea",
            label: "요약",
          },
          {
            name: "bodyHtml",
            type: "textarea",
            label: "본문",
            required: true,
          },
        ],
      },
      {
        label: "미디어",
        fields: [imagePathField("thumbnailPath", "썸네일 이미지")],
      },
    ]),
    ...sidebarFields([
      centersField,
      ...publishingFields,
      authorNameField,
      {
        name: "viewCount",
        type: "number",
        label: "조회수",
        defaultValue: 0,
      },
    ]),
    legacyCollapsible(),
  ],
};
