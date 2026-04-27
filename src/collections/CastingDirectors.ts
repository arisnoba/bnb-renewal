import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const CastingDirectors: CollectionConfig = {
  slug: "casting-directors",
  labels: {
    plural: "캐스팅 디렉터",
    singular: "캐스팅 디렉터",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "personName",
      "company",
      "centers",
      "authorName",
      "publishedAt",
      "updatedAt",
    ],
    group: "캐스팅/오디션",
    useAsTitle: "personName",
  },
  defaultSort: "personName",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    ...adminTabs([
      {
        label: "디렉터",
        fields: [
          adminRow([
            {
              name: "personName",
              type: "text",
              label: "이름",
              required: true,
              unique: true,
            },
            {
              name: "company",
              type: "text",
              label: "회사",
              required: true,
            },
          ]),
          {
            name: "category",
            type: "text",
            label: "분류",
          },
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
      authorNameField,
    ]),
    legacyCollapsible(),
  ],
};
