import type { CollectionConfig } from "payload";

import { allowAll, loggedInOnly } from "./access";
import {
  adminCollapsible,
  adminTabs,
  legacyMetaField,
  sidebarFields,
} from "./shared";

export const VideoCastings: CollectionConfig = {
  slug: "video-castings",
  labels: {
    plural: "영상 캐스팅",
    singular: "영상 캐스팅",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ["title", "broadcaster", "displayOrder", "updatedAt"],
    group: "레거시 콘텐츠",
    useAsTitle: "title",
  },
  defaultSort: "displayOrder",
  fields: [
    ...adminTabs([
      {
        label: "영상",
        fields: [
          {
            name: "title",
            type: "text",
            label: "제목",
            required: true,
          },
          {
            name: "broadcaster",
            type: "text",
            label: "방송사",
          },
          {
            name: "youtubeUrl",
            type: "text",
            label: "유튜브 URL",
          },
          {
            name: "messageHtml",
            type: "textarea",
            label: "메시지",
          },
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
