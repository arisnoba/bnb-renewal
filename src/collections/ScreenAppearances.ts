import type { CollectionBeforeValidateHook, CollectionConfig, SelectField, Validate } from "payload";

import { centerScopedCollectionAccess } from "./access";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";
import {
  adminRow,
  adminTabs,
  adminDateConfig,
  authorNameField,
  authorNameFromCenters,
  centerOptions,
  centersField,
  imagePathField,
  isGlobalAdminUser,
  publishingFields,
  sidebarFields,
  slugField,
  userCenterValue,
} from "./shared";
import { createUniqueSlugBeforeValidate } from "./slugUtils";

const screenAppearanceBeforeValidate: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) {
    return data;
  }

  const user = req.user;
  const userCenter = userCenterValue(user);
  const nextData: Record<string, unknown> = { ...data };

  if (user && !isGlobalAdminUser(user)) {
    if (!userCenter) {
      throw new Error("관리자 계정에 유효한 센터가 없습니다.");
    }

    const originalCenter =
      originalDoc && typeof originalDoc === "object"
        ? (originalDoc as { centers?: unknown }).centers
        : undefined;

    nextData.centers = originalCenter ?? userCenter;
  } else {
    const raw = nextData.centers;
    const normalized = Array.isArray(raw) ? raw[0] : raw;

    nextData.centers =
      typeof normalized === "string" && normalized.trim()
        ? normalized.trim()
        : userCenter ?? "";
  }

  nextData.authorName =
    typeof nextData.centers === "string"
      ? (authorNameFromCenters([nextData.centers]) ?? nextData.authorName)
      : nextData.authorName;

  return nextData;
};

const screenAppearanceTypeOptions = [
  { label: "드라마", value: "drama" },
  { label: "광고", value: "commercial" },
];

const actorInputModeOptions = [
  { label: "프로필 선택", value: "profile" },
  { label: "직접 입력", value: "manual" },
];

type ScreenAppearanceData = {
  actorInputMode?: unknown;
  centers?: unknown;
};

function hasRelationshipValue(value: unknown) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function selectedCenterValues(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .map((item) => String(item ?? "").trim())
    .filter((item) => item && item !== "all");
}

function profileFilterForSelectedCenters({
  data,
  siblingData,
}: {
  data?: unknown;
  siblingData?: unknown;
}) {
  const siblingCenters =
    siblingData && typeof siblingData === "object"
      ? (siblingData as ScreenAppearanceData).centers
      : undefined;
  const documentCenters =
    data && typeof data === "object"
      ? (data as ScreenAppearanceData).centers
      : undefined;
  const centers = selectedCenterValues(siblingCenters ?? documentCenters);

  if (centers.length === 0) {
    return true;
  }

  return {
    or: centers.map((center) => ({
      centers: {
        contains: center,
      },
    })),
  };
}

const validateLinkedProfiles: Validate<
  unknown,
  unknown,
  ScreenAppearanceData
> = (value, { siblingData }) => {
  if (siblingData?.actorInputMode === "manual") {
    return true;
  }

  return hasRelationshipValue(value)
    ? true
    : "프로필 선택 방식에서는 연결된 프로필을 선택해야 합니다.";
};

const validateScreenAppearanceCenter: Validate<
  unknown,
  unknown,
  ScreenAppearanceData
> = (value) => {
  const center = Array.isArray(value) ? value[0] : value;

  return typeof center === "string" && center.trim()
    ? true
    : "센터를 선택해야 합니다.";
};

const validateManualPerformerName: Validate<
  string,
  unknown,
  ScreenAppearanceData
> = (value, { siblingData }) => {
  if (siblingData?.actorInputMode !== "manual") {
    return true;
  }

  return String(value ?? "").trim()
    ? true
    : "직접 입력 방식에서는 출연자명을 입력해야 합니다.";
};

const setScreenAppearanceSlug = createUniqueSlugBeforeValidate({
  collection: "screen-appearances",
  fallbackPrefix: "screen-appearance",
  getSlugParts: ({ data, originalDoc }) => [
    data.centers ?? originalDoc?.centers,
    data.projectTitle ?? originalDoc?.projectTitle ?? data.title ?? originalDoc?.title,
  ],
});

export const ScreenAppearances: CollectionConfig = {
  slug: "screen-appearances",
  labels: {
    plural: "드라마/광고 출연장면",
    singular: "드라마/광고 출연장면",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "slug",
      "centers",
      "authorName",
      "performerName",
      "projectTitle",
      "publishedAt",
    ],
    group: "캐스팅/오디션",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterChange: [
      normalizeUploadedMediaPrefixes([
        { path: "bodyImages.*.image", role: "screen-appearances.body-image" },
      ]),
    ],
    beforeValidate: [screenAppearanceBeforeValidate, setScreenAppearanceSlug],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    ...adminTabs([
      {
        label: "출연장면",
        fields: [
          {
            ...centersField,
            hasMany: false,
            defaultValue: undefined,
            options: centerOptions,
            validate: validateScreenAppearanceCenter,
            admin: {
              className: "bnb-admin-required-field",
              isClearable: true,
              placeholder: "선택해 주세요",
            },
          } as SelectField,
          {
            name: "actorInputMode",
            type: "radio",
            label: "출연자 입력 방식",
            defaultValue: "profile",
            options: actorInputModeOptions,
            required: true,
            admin: {
              layout: "horizontal",
            },
          },
          {
            name: "linkedProfiles",
            type: "relationship",
            label: "연결된 프로필",
            relationTo: "profiles",
            hasMany: true,
            filterOptions: profileFilterForSelectedCenters,
            validate: validateLinkedProfiles,
            admin: {
              description:
                "선택한 센터의 프로필만 검색합니다. 프로필과 연결만 저장하며 경력관리에는 자동으로 등록되지 않습니다.",
              condition: (_data, siblingData) =>
                siblingData?.actorInputMode !== "manual",
            },
          },
          adminRow([
            {
              name: "performerName",
              type: "text",
              label: "출연자",
              validate: validateManualPerformerName,
              admin: {
                components: {
                  Cell:
                    "@/components/payload/ScreenAppearancePerformerCell#ScreenAppearancePerformerCell",
                },
                condition: (_data, siblingData) =>
                  siblingData?.actorInputMode === "manual",
              },
            },
            {
              name: "className",
              type: "text",
              label: "반/클래스",
              admin: {
                condition: (_data, siblingData) =>
                  siblingData?.actorInputMode === "manual",
              },
            },
          ]),
          adminRow([
            { name: "projectTitle", type: "text", label: "작품명" },
            { name: "roleName", type: "text", label: "역할" },
          ]),
          {
            name: "appearanceType",
            type: "select",
            label: "출연 유형",
            options: screenAppearanceTypeOptions,
            required: true,
          },
          {
            name: "airDateLabel",
            type: "date",
            label: "방영일 표시",
            admin: adminDateConfig,
          },
          {
            name: "introText",
            type: "textarea",
            label: "소개 문장",
          },
          {
            name: "careerItems",
            type: "array",
            label: "필모그래피",
            labels: {
              plural: "필모그래피",
              singular: "필모그래피",
            },
            admin: {
              condition: (_data, siblingData) =>
                siblingData?.actorInputMode === "manual",
              components: {
                RowLabel:
                  "@/components/payload/ScreenAppearanceCareerRowLabel#ScreenAppearanceCareerRowLabel",
              },
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
      {
        label: "미디어",
        fields: [
          adminRow([imagePathField("profileImagePath", "프로필 이미지")]),
          adminRow([imagePathField("thumbnailPath", "썸네일")]),
          {
            name: "bodyImages",
            type: "array",
            label: "본문 이미지",
            labels: {
              plural: "본문 이미지",
              singular: "본문 이미지",
            },
            admin: {
              className: "screen-appearance-body-images-field",
              components: {
                beforeInput: [
                  "@/components/payload/ScreenAppearanceBodyImagesField#ScreenAppearanceBodyImagesField",
                ],
                RowLabel:
                  "@/components/payload/ScreenAppearanceBodyImageRowLabel#ScreenAppearanceBodyImageRowLabel",
              },
              initCollapsed: true,
            },
            fields: [
              {
                name: "image",
                type: "upload",
                label: "이미지",
                relationTo: "media",
                required: true,
              },
            ],
          },
        ],
      },
    ]),
    ...sidebarFields([...publishingFields, authorNameField]),
    slugField(),
  ],
};
