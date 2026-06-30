import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerOptions,
  type CenterFilterValue,
  type CenterValue,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  publishingFields,
  sidebarFields,
  slugField,
} from "./shared";
import { createUniqueSlugBeforeValidate } from "./slugUtils";

const setCastingAppearanceSlug = createUniqueSlugBeforeValidate({
  collection: "casting-appearances",
  fallbackPrefix: "casting-appearance",
  getSlugParts: ({ data, originalDoc }) => [data.title ?? originalDoc?.title],
});

type RevalidatePath = typeof revalidatePath;
type CastingAppearanceWithCenters = {
  id: number | string;
  centers?: CenterFilterValue[] | CenterFilterValue | null;
};

function selectedCenterValues(value: CastingAppearanceWithCenters["centers"]) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  if (values.includes("all")) {
    return centerOptions.map((option) => option.value);
  }

  return Array.from(
    new Set(
      values
        .map((item) => String(item ?? "").trim())
        .filter((item): item is CenterValue =>
          centerOptions.some((option) => option.value === item),
        ),
    ),
  );
}

export function castingStatusCenterPaths(
  centers: CastingAppearanceWithCenters["centers"],
  previousCenters?: CastingAppearanceWithCenters["centers"],
) {
  return Array.from(
    new Set(
      [
        ...selectedCenterValues(centers),
        ...selectedCenterValues(previousCenters),
      ].map((center) => `/${center}/casting-status`),
    ),
  );
}

function revalidateCastingStatusCenterPaths({
  centers,
  previousCenters,
  revalidate = revalidatePath,
  req,
}: {
  centers: CastingAppearanceWithCenters["centers"];
  previousCenters?: CastingAppearanceWithCenters["centers"];
  revalidate?: RevalidatePath;
  req:
    | Parameters<CollectionAfterChangeHook>[0]["req"]
    | Parameters<CollectionAfterDeleteHook>[0]["req"];
}) {
  if (req.context.disableRevalidate) {
    return;
  }

  for (const path of castingStatusCenterPaths(centers, previousCenters)) {
    req.payload.logger.info(`Revalidating casting status path ${path}`);
    revalidate(path, "page");
  }
}

const revalidateCastingStatusAfterChange: CollectionAfterChangeHook<CastingAppearanceWithCenters> = ({
  doc,
  previousDoc,
  req,
}) => {
  revalidateCastingStatusCenterPaths({
    centers: doc.centers,
    previousCenters: previousDoc?.centers,
    req,
  });

  return doc;
};

const revalidateCastingStatusAfterDelete: CollectionAfterDeleteHook<CastingAppearanceWithCenters> = ({
  doc,
  req,
}) => {
  revalidateCastingStatusCenterPaths({
    centers: doc.centers,
    req,
  });

  return doc;
};

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
