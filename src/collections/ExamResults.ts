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

export const ExamResults: CollectionConfig = {
  slug: "exam-results",
  labels: {
    plural: "합격결과",
    singular: "합격결과",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ["title", "resultType", "publishedAt", "updatedAt"],
    group: "후기/합격",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  fields: [
    ...adminTabs([
      {
        label: "합격결과",
        fields: [
          { name: "title", type: "text", label: "제목", required: true },
          adminRow([
            centersField,
            {
              name: "resultType",
              type: "text",
              label: "결과 유형",
              required: true,
            },
          ]),
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
    ...sidebarFields(publishingFields),
    legacyCollapsible(),
  ],
};
