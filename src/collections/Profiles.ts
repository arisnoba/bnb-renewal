import type { CollectionConfig } from "payload";

import { allowAll, loggedInOnly } from "./access";
import {
  adminRow,
  adminTabs,
  centersField,
  imagePathField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const Profiles: CollectionConfig = {
  slug: "profiles",
  labels: {
    plural: "프로필",
    singular: "프로필",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ["name", "centers", "filter", "publishedAt", "updatedAt"],
    group: "매니지먼트",
    useAsTitle: "name",
  },
  defaultSort: "-publishedAt",
  fields: [
    ...adminTabs([
      {
        label: "프로필",
        fields: [
          adminRow([
            {
              name: "name",
              type: "text",
              label: "이름",
              required: true,
            },
            {
              name: "englishName",
              type: "text",
              label: "영문명",
            },
          ]),
          {
            name: "filter",
            type: "text",
            label: "필터",
          },
          adminRow([
            {
              name: "height",
              type: "text",
              label: "키",
            },
            {
              name: "weight",
              type: "text",
              label: "몸무게",
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
      {
        label: "미디어",
        fields: [imagePathField("profileImagePath", "프로필 이미지")],
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
    ]),
    legacyCollapsible(),
  ],
};
