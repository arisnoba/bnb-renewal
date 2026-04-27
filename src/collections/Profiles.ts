import type { CollectionConfig } from "payload";

import {
  getDefaultProfileFilterValue,
  isKnownProfileFilterValue,
  isProfileFilterValueAllowed,
} from "../lib/profileFilters";
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

type ProfileFilterContext = {
  data?: { centers?: unknown };
  originalDoc?: { centers?: unknown };
  siblingData?: { centers?: unknown };
};

function profileFilterCenters({
  data,
  originalDoc,
  siblingData,
}: ProfileFilterContext) {
  return siblingData?.centers ?? data?.centers ?? originalDoc?.centers;
}

export const Profiles: CollectionConfig = {
  slug: "profiles",
  labels: {
    plural: "프로필",
    singular: "프로필",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["name", "centers", "authorName", "filter", "publishedAt", "updatedAt"],
    group: "매니지먼트",
    useAsTitle: "name",
  },
  defaultSort: "-publishedAt",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    ...adminTabs([
      {
        label: "프로필",
        fields: [
          adminRow([
            {
              name: "name",
              type: "text",
              label: "이름",
              required: true,
            },
            {
              name: "englishName",
              type: "text",
              label: "영문명",
            },
          ]),
          {
            name: "filter",
            type: "text",
            label: "필터",
            required: true,
            hooks: {
              beforeValidate: [
                ({ data, originalDoc, siblingData, value }) => {
                  const centers = profileFilterCenters({
                    data,
                    originalDoc,
                    siblingData,
                  });
                  const trimmed = typeof value === "string" ? value.trim() : "";

                  if (isProfileFilterValueAllowed(trimmed, centers)) {
                    return trimmed;
                  }

                  return getDefaultProfileFilterValue(centers) ?? trimmed;
                },
              ],
            },
            validate: (value: unknown, context: ProfileFilterContext) => {
              const centers = profileFilterCenters(context);

              if (
                isProfileFilterValueAllowed(value, centers) ||
                isKnownProfileFilterValue(value)
              ) {
                return true;
              }

              return "선택한 센터에서 사용할 수 없는 필터입니다.";
            },
            admin: {
              components: {
                Field:
                  "@/components/payload/ProfileFilterField#ProfileFilterField",
              },
            },
          },
          adminRow([
            {
              name: "height",
              type: "text",
              label: "키",
            },
            {
              name: "weight",
              type: "text",
              label: "몸무게",
            },
          ]),
          imagePathField("profileImagePath", "프로필 이미지"),
        ],
      },
      {
        label: "경력관리",
        fields: [
          {
            name: "careerItems",
            type: "array",
            label: "경력관리",
            labels: {
              plural: "경력",
              singular: "경력",
            },
            fields: [
              {
                name: "title",
                type: "text",
                label: "타이틀",
                required: true,
              },
              {
                name: "content",
                type: "textarea",
                label: "내용",
              },
            ],
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
