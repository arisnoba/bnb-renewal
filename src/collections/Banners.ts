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

export const Banners: CollectionConfig = {
  slug: "banners",
  labels: {
    plural: "배너",
    singular: "배너",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: [
      "label",
      "position",
      "device",
      "displayOrder",
      "updatedAt",
    ],
    group: "레거시 콘텐츠",
    useAsTitle: "label",
  },
  defaultSort: "displayOrder",
  fields: [
    ...adminTabs([
      {
        label: "배너",
        fields: [
          adminRow([
            {
              name: "label",
              type: "text",
              label: "관리명",
              required: true,
            },
            {
              name: "altText",
              type: "text",
              label: "대체 텍스트",
            },
          ]),
          {
            name: "url",
            type: "text",
            label: "링크 URL",
          },
          adminRow([
            {
              name: "position",
              type: "text",
              label: "노출 위치",
            },
            {
              name: "device",
              type: "text",
              label: "디바이스",
            },
          ]),
        ],
      },
    ]),
    ...sidebarFields([
      {
        name: "displayOrder",
        type: "number",
        label: "정렬순서",
        defaultValue: 0,
      },
      {
        name: "beginAt",
        type: "date",
        label: "시작일",
        admin: adminDateConfig,
      },
      {
        name: "endAt",
        type: "date",
        label: "종료일",
        admin: adminDateConfig,
      },
      {
        name: "openInNewWindow",
        type: "checkbox",
        label: "새 창 열기",
        defaultValue: false,
      },
      {
        name: "hasBorder",
        type: "checkbox",
        label: "테두리 표시",
        defaultValue: false,
      },
      {
        name: "hitCount",
        type: "number",
        label: "조회수",
        defaultValue: 0,
      },
      {
        name: "recordedAt",
        type: "date",
        label: "기록일",
        admin: adminDateConfig,
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
