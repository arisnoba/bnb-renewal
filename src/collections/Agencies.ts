import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess, globalAdminOnly } from "./access";
import {
  allCentersBeforeValidate,
  adminRow,
  adminTabs,
  authorNameField,
  centersField,
  legacyCollapsible,
  sidebarFields,
} from "./shared";

export const Agencies: CollectionConfig = {
  slug: "agencies",
  labels: {
    plural: "에이전시",
    singular: "에이전시",
  },
  access: {
    ...centerScopedCollectionAccess,
    create: globalAdminOnly,
  },
  admin: {
    defaultColumns: ["subject", "name", "centers", "authorName", "displayOrder", "updatedAt"],
    group: "교육",
    useAsTitle: "subject",
  },
  defaultSort: "displayOrder",
  hooks: {
    beforeValidate: [allCentersBeforeValidate],
  },
  fields: [
    ...adminTabs([
      {
        label: "에이전시",
        fields: [
          adminRow([
            {
              name: "subject",
              type: "text",
              label: "회사명",
              required: true,
            },
            {
              name: "name",
              type: "text",
              label: "영문명",
            },
          ]),
          {
            name: "logoMedia",
            type: "upload",
            label: "회사 로고 이미지",
            relationTo: "media",
          },
          {
            name: "summary",
            type: "textarea",
            label: "요약",
          },
        ],
      },
      {
        label: "출신 배우",
        fields: [
          {
            name: "actors",
            type: "array",
            label: "출신 배우",
            fields: [
              adminRow([
                {
                  name: "name",
                  type: "text",
                  label: "이름",
                  required: true,
                },
                {
                  name: "generation",
                  type: "text",
                  label: "기수",
                },
              ]),
            ],
          },
        ],
      },
    ]),
    ...sidebarFields([
      centersField,
      authorNameField,
      {
        name: "displayOrder",
        type: "number",
        label: "정렬순서",
        defaultValue: 0,
      },
    ]),
    legacyCollapsible(),
  ],
};
