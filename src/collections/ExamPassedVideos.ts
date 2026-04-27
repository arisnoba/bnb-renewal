import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  isExamAdminMenuHidden,
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
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["title", "centers", "authorName", "youtubeUrl", "publishedAt", "updatedAt"],
    group: "후기/합격",
    hidden: ({ user }) => isExamAdminMenuHidden(user),
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
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
    ...sidebarFields([centersField, ...publishingFields, authorNameField]),
    legacyCollapsible(),
  ],
};
