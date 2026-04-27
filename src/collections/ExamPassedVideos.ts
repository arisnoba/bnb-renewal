import type { CollectionConfig } from "payload";

import { allowAll, loggedInOnly } from "./access";
import {
  adminRow,
  adminTabs,
  centersField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const ExamPassedVideos: CollectionConfig = {
  slug: "exam-passed-videos",
  labels: {
    plural: "합격영상",
    singular: "합격영상",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ["title", "youtubeUrl", "publishedAt", "updatedAt"],
    group: "후기/합격",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  fields: [
    ...adminTabs([
      {
        label: "영상",
        fields: [
          { name: "title", type: "text", label: "제목", required: true },
          adminRow([
            {
              name: "youtubeCode",
              type: "text",
              label: "유튜브 코드",
              required: true,
              unique: true,
            },
            {
              name: "youtubeUrl",
              type: "text",
              label: "유튜브 URL",
              required: true,
            },
          ]),
          { name: "bodyHtml", type: "textarea", label: "본문" },
        ],
      },
    ]),
    ...sidebarFields([centersField, ...publishingFields]),
    legacyCollapsible(),
  ],
};
