import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const CastingAppearances: CollectionConfig = {
  slug: "casting-appearances",
  labels: {
    plural: "캐스팅 출연현황",
    singular: "캐스팅 출연현황",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "centers",
      "authorName",
      "broadcaster",
      "castingStatus",
      "publishedAt",
    ],
    group: "캐스팅/오디션",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    ...adminTabs([
      {
        label: "작품 정보",
        fields: [
          { name: "title", type: "text", label: "제목", required: true },
          { name: "castingStatus", type: "text", label: "캐스팅 상태" },
          adminRow([
            { name: "broadcaster", type: "text", label: "방송사" },
            { name: "productionCompany", type: "text", label: "제작사" },
          ]),
          adminRow([
            { name: "directors", type: "text", label: "감독" },
            { name: "writers", type: "text", label: "작가" },
          ]),
          { name: "bodyHtml", type: "textarea", label: "본문" },
        ],
      },
      {
        label: "출연자",
        fields: [
          {
            name: "castMembers",
            type: "array",
            label: "출연자",
            labels: {
              plural: "출연자",
              singular: "출연자",
            },
            admin: {
              initCollapsed: false,
            },
            fields: [
              adminRow([
                { name: "actorName", type: "text", label: "배우 이름" },
                { name: "roleName", type: "text", label: "역할" },
                {
                  name: "episodeNumbers",
                  type: "text",
                  label: "출연회차",
                  admin: {
                    description: "예: 1,2,5,6",
                  },
                },
              ]),
            ],
          },
        ],
      },
      {
        label: "미디어/캐스팅",
        fields: [
          adminRow([
            imagePathField("thumbnailPath", "썸네일"),
            { name: "castingCompany", type: "text", label: "캐스팅 회사" },
          ]),
        ],
      },
    ]),
    ...sidebarFields([centersField, ...publishingFields, authorNameField]),
    legacyCollapsible(),
  ],
};
