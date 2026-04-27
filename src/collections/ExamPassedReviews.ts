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

export const ExamPassedReviews: CollectionConfig = {
  slug: "exam-passed-reviews",
  labels: {
    plural: "합격후기",
    singular: "합격후기",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ["title", "schoolName", "publishedAt", "updatedAt"],
    group: "후기/합격",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  fields: [
    ...adminTabs([
      {
        label: "후기",
        fields: [
          { name: "title", type: "text", label: "제목", required: true },
          adminRow([
            centersField,
            {
              name: "schoolName",
              type: "text",
              label: "학교명",
              required: true,
            },
          ]),
          { name: "bodyHtml", type: "textarea", label: "본문" },
        ],
      },
      {
        label: "미디어/학교",
        fields: [
          {
            name: "schoolLogoSlug",
            type: "text",
            label: "학교 로고 슬러그",
            required: true,
          },
          adminRow([imagePathField("schoolLogoPath", "학교 로고", true)]),
          adminRow([imagePathField("studentImagePath", "학생 이미지", true)]),
        ],
      },
    ]),
    ...sidebarFields(publishingFields),
    legacyCollapsible(),
  ],
};
