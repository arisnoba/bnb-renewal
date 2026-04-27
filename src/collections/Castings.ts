import type { CollectionConfig } from "payload";

import { allowAll, loggedInOnly } from "./access";
import {
  adminCollapsible,
  adminDateConfig,
  adminRow,
  adminTabs,
  legacyMetaField,
  sidebarFields,
} from "./shared";

export const Castings: CollectionConfig = {
  slug: "castings",
  labels: {
    plural: "캐스팅",
    singular: "캐스팅",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ["title", "category", "publishedAt", "updatedAt"],
    group: "레거시 콘텐츠",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  fields: [
    ...adminTabs([
      {
        label: "콘텐츠",
        fields: [
          adminRow([
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
          ]),
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
    ]),
    ...sidebarFields([
      {
        name: "publishedAt",
        type: "date",
        label: "발행일",
        admin: adminDateConfig,
      },
      {
        name: "authorName",
        type: "text",
        label: "작성자명",
      },
    ]),
    adminCollapsible("레거시/원본", [
      {
        name: "sourceTable",
        type: "text",
        label: "원본 테이블",
        required: true,
      },
      {
        name: "sourceId",
        type: "number",
        label: "원본 ID",
        required: true,
      },
      {
        name: "slug",
        type: "text",
        label: "슬러그",
        required: true,
        unique: true,
      },
      legacyMetaField,
    ]),
  ],
};
