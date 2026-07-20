import type {
  Access,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
  SelectField,
  Validate,
} from "payload";

import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from "./revalidateFrontend";
import {
  adminRow,
  adminTabs,
  adminDateConfig,
  authorNameField,
  authorNameFromCenters,
  centerOptions,
  centersField,
  isGlobalAdminUser,
  publishingFields,
  sidebarFields,
  userCenterValue,
} from "./shared";
import {
  createFinalizeIdSlugAfterCreate,
  createIdSlugBeforeValidate,
  idSlugField,
} from "./slugUtils";

const screenAppearanceCenterAccess: Access = ({ req }) => {
  if (!req.user) {
    return false;
  }

  if (isGlobalAdminUser(req.user)) {
    return true;
  }

  const center = userCenterValue(req.user);

  if (!center) {
    return false;
  }

  return {
    centers: {
      equals: center,
    },
  };
};

const screenAppearanceCreateAccess: Access = ({ req }) => {
  if (!req.user) {
    return false;
  }

  return isGlobalAdminUser(req.user) || Boolean(userCenterValue(req.user));
};

export const screenAppearanceReadAccess: Access = ({ req }) => {
  if (!req.user) {
    return true;
  }

  return screenAppearanceCenterAccess({ req });
};

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
  { label: "영화", value: "movie" },
  { label: "광고", value: "commercial" },
];
const revalidateScreenAppearanceAfterChange = createCenterRevalidationAfterChange({
  cacheTagPrefixes: ["frontend_screen_appearances"],
  reason: "screen appearance",
  suffixes: ["", "screen-appearances"],
});
const revalidateScreenAppearanceAfterDelete = createCenterRevalidationAfterDelete({
  cacheTagPrefixes: ["frontend_screen_appearances"],
  reason: "screen appearance",
  suffixes: ["", "screen-appearances"],
});

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

function manualActorOnlyField(field: Field): Field {
  const fieldWithAdmin = field as Field & {
    admin?: Record<string, unknown>;
  };

  return {
    ...field,
    admin: {
      ...fieldWithAdmin.admin,
      condition: (_data: unknown, siblingData?: ScreenAppearanceData) =>
        siblingData?.actorInputMode === "manual",
    },
  } as Field;
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

const setScreenAppearanceSlug = createIdSlugBeforeValidate();
const finalizeScreenAppearanceSlugAfterCreate =
  createFinalizeIdSlugAfterCreate("screen-appearances");

export const ScreenAppearances: CollectionConfig = {
  slug: "screen-appearances",
  labels: {
    plural: "드라마/영화/광고 출연장면",
    singular: "드라마/영화/광고 출연장면",
  },
  access: {
    create: screenAppearanceCreateAccess,
    delete: screenAppearanceCenterAccess,
    read: screenAppearanceReadAccess,
    update: screenAppearanceCenterAccess,
  },
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
      finalizeScreenAppearanceSlugAfterCreate,
      revalidateScreenAppearanceAfterChange,
      normalizeUploadedMediaPrefixes([
        { path: "thumbnailMedia", role: "screen-appearances.thumbnail" },
        {
          path: "profileImageMedia",
          role: "screen-appearances.profile-image",
        },
        { path: "bodyImages.*.image", role: "screen-appearances.body-image" },
      ]),
    ],
    afterDelete: [revalidateScreenAppearanceAfterDelete],
    beforeValidate: [screenAppearanceBeforeValidate, setScreenAppearanceSlug],
  },
  fields: [
    ...adminTabs([
      {
        label: "작품 정보",
        fields: [
          { name: "title", type: "text", label: "제목", required: true },
          {
            ...centersField,
            hasMany: false,
            defaultValue: undefined,
            options: centerOptions,
            validate: validateScreenAppearanceCenter,
            admin: {
              isClearable: true,
              placeholder: "선택해 주세요",
            },
          } as SelectField,
          adminRow([
            {
              name: "broadcastStation",
              type: "relationship",
              label: "방송사 선택",
              relationTo: "broadcast-stations",
            },
            {
              name: "appearanceType",
              type: "select",
              label: "출연 유형",
              options: screenAppearanceTypeOptions,
              required: true,
            },
          ]),
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
            name: "airDateLabel",
            type: "date",
            label: "방영일",
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
          adminRow([
            manualActorOnlyField({
              name: "profileImageMedia",
              type: "upload",
              label: "프로필 이미지",
              relationTo: "media",
              admin: {
                width: "50%",
              },
            }),
            {
              name: "thumbnailMedia",
              type: "upload",
              label: "대표 이미지",
              relationTo: "media",
              admin: {
                description: "1120×620px 이상의 이미지를 권장합니다.",
                width: "50%",
              },
            },
          ]),
          {
            name: "profileImagePath",
            type: "text",
            label: "레거시 프로필 이미지",
            admin: {
              hidden: true,
            },
          },
          {
            name: "thumbnailPath",
            type: "text",
            label: "레거시 대표 이미지",
            admin: {
              hidden: true,
            },
          },
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
    idSlugField,
  ],
};
