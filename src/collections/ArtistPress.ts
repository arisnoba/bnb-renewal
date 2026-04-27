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

export const ArtistPress: CollectionConfig = {
  slug: "artist-press",
  labels: {
    plural: "출신 아티스트",
    singular: "출신 아티스트",
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
      "actorName",
      "generation",
      "publishedAt",
      "updatedAt",
    ],
    group: "매니지먼트",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  fields: [
    ...adminTabs([
      {
        label: "아티스트",
        fields: [
          {
            name: "title",
            type: "text",
            label: "제목",
            required: true,
          },
          adminRow([
            {
              name: "actorName",
              type: "text",
              label: "배우명",
              required: true,
            },
            {
              name: "generation",
              type: "text",
              label: "기수",
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
      {
        label: "미디어",
        fields: [
          adminRow([imagePathField("thumbnailPath", "썸네일")]),
          adminRow([imagePathField("agencyLogoPath", "소속사 로고")]),
        ],
      },
    ]),
    ...sidebarFields([centersField, ...publishingFields]),
    legacyCollapsible(),
  ],
};
