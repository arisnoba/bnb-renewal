import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  isExamAdminMenuHidden,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const ExamResults: CollectionConfig = {
  slug: "exam-results",
  labels: {
    plural: "합격결과",
    singular: "합격결과",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["title", "centers", "authorName", "resultType", "publishedAt", "updatedAt"],
    group: "입시센터 후기/합격",
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
        label: "합격결과",
        fields: [
          { name: "title", type: "text", label: "제목", required: true },
          {
            name: "resultType",
            type: "text",
            label: "결과 유형",
            required: true,
          },
          { name: "bodyHtml", type: "textarea", label: "본문" },
        ],
      },
      {
        label: "미디어",
        fields: [
          adminRow([
            imagePathField("thumbnailPath", "썸네일"),
            {
              name: "thumbnailSource",
              type: "text",
              label: "썸네일 출처",
              required: true,
            },
          ]),
        ],
      },
    ]),
    ...sidebarFields([centersField, ...publishingFields, authorNameField]),
    legacyCollapsible(),
  ],
};
