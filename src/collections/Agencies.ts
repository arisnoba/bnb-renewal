import type { CollectionConfig } from "payload";

import { centerScopedPublishedCollectionAccess, globalAdminOnly } from "./access";
import {
  allCentersBeforeValidate,
  adminRow,
  adminTabs,
  authorNameField,
  centersField,
  displayStatusOptions,
  publishingStatusSelectAdmin,
  sidebarFields,
} from "./shared";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";

export const Agencies: CollectionConfig = {
  slug: "agencies",
  labels: {
    plural: "에이전시",
    singular: "에이전시",
  },
  access: {
    ...centerScopedPublishedCollectionAccess,
    create: globalAdminOnly,
  },
  admin: {
    defaultColumns: [
      "subject",
      "name",
      "centers",
      "displayStatus",
      "authorName",
      "displayOrder",
      "updatedAt",
    ],
    group: "교육",
    useAsTitle: "subject",
  },
  defaultSort: "displayOrder",
  hooks: {
    afterChange: [
      normalizeUploadedMediaPrefixes([{ path: "logoMedia", role: "agencies.logo" }]),
    ],
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
            labels: {
              plural: "출신 배우",
              singular: "출신 배우",
            },
            admin: {
              components: {
                RowLabel: "@/components/payload/AgencyActorRowLabel#AgencyActorRowLabel",
              },
            },
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
        name: "displayStatus",
        type: "select",
        label: "상태",
        defaultValue: "archived",
        options: displayStatusOptions,
        admin: publishingStatusSelectAdmin(),
      },
      {
        name: "displayOrder",
        type: "number",
        label: "정렬순서",
        defaultValue: 0,
      },
    ]),
  ],
};
