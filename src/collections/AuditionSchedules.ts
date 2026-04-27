import type { CollectionConfig } from "payload";

import { allowAll, loggedInOnly } from "./access";
import {
  adminDateConfig,
  adminRow,
  adminTabs,
  centersField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const AuditionSchedules: CollectionConfig = {
  slug: "audition-schedules",
  labels: {
    plural: "오디션 일정",
    singular: "오디션 일정",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: [
      "title",
      "centers",
      "eventType",
      "scheduleStartDate",
      "updatedAt",
    ],
    group: "캐스팅/오디션",
    useAsTitle: "title",
  },
  defaultSort: "-scheduleStartDate",
  fields: [
    ...adminTabs([
      {
        label: "일정",
        fields: [
          {
            name: "title",
            type: "text",
            label: "제목",
            required: true,
          },
          {
            name: "eventType",
            type: "text",
            label: "일정 유형",
            required: true,
          },
          adminRow([
            {
              name: "scheduleStartDate",
              type: "date",
              label: "시작일",
              admin: adminDateConfig,
              required: true,
            },
            {
              name: "scheduleEndDate",
              type: "date",
              label: "종료일",
              admin: adminDateConfig,
              required: true,
            },
          ]),
          {
            name: "bodyHtml",
            type: "textarea",
            label: "본문",
          },
        ],
      },
    ]),
    ...sidebarFields([
      centersField,
      ...publishingFields,
      {
        name: "authorName",
        type: "text",
        label: "작성자명",
      },
      {
        name: "dedupeKey",
        type: "text",
        label: "중복 기준 키",
        required: true,
        unique: true,
      },
    ]),
    legacyCollapsible([
      adminRow([
        {
          name: "scheduleStartRaw",
          type: "text",
          label: "원본 시작일",
          required: true,
        },
        {
          name: "scheduleEndRaw",
          type: "text",
          label: "원본 종료일",
          required: true,
        },
      ]),
    ]),
  ],
};
