import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  publishingFields,
  sidebarFields,
  slugField,
} from "./shared";
import { createUniqueSlugBeforeValidate } from "./slugUtils";
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from "./revalidateFrontend";

const setCastingAppearanceSlug = createUniqueSlugBeforeValidate({
  collection: "casting-appearances",
  fallbackPrefix: "casting-appearance",
  getSlugParts: ({ data, originalDoc }) => [data.title ?? originalDoc?.title],
});

const revalidateCastingStatusAfterChange = createCenterRevalidationAfterChange({
  reason: "casting status",
  suffixes: ["casting-status"],
});

const revalidateCastingStatusAfterDelete = createCenterRevalidationAfterDelete({
  reason: "casting status",
  suffixes: ["casting-status"],
});

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
      "slug",
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
    afterChange: [revalidateCastingStatusAfterChange],
    afterDelete: [revalidateCastingStatusAfterDelete],
    beforeValidate: [centerScopedBeforeValidate, setCastingAppearanceSlug],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    ...adminTabs([
      {
        label: "작품 정보",
        fields: [
          imagePathField("thumbnailPath", "썸네일"),
          { name: "castingStatus", type: "text", label: "캐스팅 상태" },
          adminRow([
            { name: "broadcaster", type: "text", label: "방송사" },
            { name: "productionCompany", type: "text", label: "제작사" },
          ]),
          adminRow([
            { name: "directors", type: "text", label: "감독" },
            { name: "writers", type: "text", label: "작가" },
          ]),
        ],
      },
      {
        label: "캐스팅/출연자",
        fields: [
          { name: "castingCompany", type: "text", label: "캐스팅 회사" },
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
              components: {
                RowLabel:
                  "@/components/payload/CastingAppearanceCastMemberRowLabel#CastingAppearanceCastMemberRowLabel",
              },
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
    ]),
    ...sidebarFields([centersField, ...publishingFields, authorNameField]),
    slugField(),
  ],
};
