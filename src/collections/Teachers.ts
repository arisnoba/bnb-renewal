import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
  NumberFieldSingleValidation,
} from "payload";

import type { CenterSlug } from "@/lib/centers";
import { teacherBelongsToOrderCenter, teacherOrderFieldName } from "@/lib/teacherOrder";

import { allowAll, centerScopedCollectionAccess } from "./access";
import { koreanSlugify } from "../utilities/koreanSlugify";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from "./revalidateFrontend";
import {
  adminRow,
  adminCollapsible,
  adminTabs,
  authorNameField,
  centerOptions,
  centerScopedBeforeValidate,
  centersField,
  isGlobalAdminUser,
  publishingStatusSelectAdmin,
  sidebarFields,
  slugField,
  userCenterValue,
} from "./shared";
import { teacherOrderEndpoints } from "./teacherOrderEndpoint";

type TeacherSlugDoc = {
  id?: unknown;
  slug?: unknown;
};

function sameId(left: unknown, right: unknown) {
  return String(left ?? "") === String(right ?? "");
}

function teacherBaseSlug(value: unknown) {
  return koreanSlugify({ valueToSlugify: value }) || "teacher";
}

async function nextUniqueTeacherSlug({
  baseSlug,
  currentId,
  payload,
}: {
  baseSlug: string;
  currentId?: unknown;
  payload?: {
    find: (args: {
      collection: "teachers";
      depth: number;
      limit: number;
      overrideAccess: boolean;
      pagination: false;
    }) => Promise<{ docs: TeacherSlugDoc[] }>;
  };
}) {
  if (!payload) {
    return baseSlug;
  }

  const result = await payload.find({
    collection: "teachers",
    depth: 0,
    limit: 10000,
    overrideAccess: true,
    pagination: false,
  });
  const usedSlugs = new Set(
    result.docs
      .filter((doc) => !sameId(doc.id, currentId))
      .map((doc) => String(doc.slug ?? "").trim())
      .filter(Boolean)
  );

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

async function normalizeTeacherSlugData({
  data,
  originalDoc,
  req,
}: {
  data?: Record<string, unknown>;
  originalDoc?: Record<string, unknown>;
  req: {
    payload?: {
      find: (args: {
        collection: "teachers";
        depth: number;
        limit: number;
        overrideAccess: boolean;
        pagination: false;
      }) => Promise<{ docs: TeacherSlugDoc[] }>;
    };
  };
}) {
  if (!data) {
    return data;
  }

  const baseSlug = teacherBaseSlug(data.name ?? originalDoc?.name);

  return {
    ...data,
    slug: await nextUniqueTeacherSlug({
      baseSlug,
      currentId: data.id ?? originalDoc?.id,
      payload: req.payload,
    }),
  };
}

const normalizeTeacherSlugBeforeValidate: CollectionBeforeValidateHook = (args) =>
  normalizeTeacherSlugData(args);

const normalizeTeacherSlugBeforeChange: CollectionBeforeChangeHook = (args) =>
  normalizeTeacherSlugData(args);

const revalidateTeacherAfterChange = createCenterRevalidationAfterChange({
  cacheTagPrefixes: ["frontend_teachers"],
  reason: "teacher",
  suffixes: ["", "teachers"],
});

const revalidateTeacherAfterDelete = createCenterRevalidationAfterDelete({
  cacheTagPrefixes: ["frontend_teachers"],
  reason: "teacher",
  suffixes: ["", "teachers"],
});

function canUpdateTeacherOrder(center: CenterSlug, user: unknown) {
  return isGlobalAdminUser(user) || userCenterValue(user) === center;
}

function validateTeacherOrder(
  center: CenterSlug,
  centerLabel: string
): NumberFieldSingleValidation {
  return (value, { siblingData }) => {
    const centers = (siblingData as { centers?: unknown } | undefined)?.centers;

    if (!teacherBelongsToOrderCenter(centers, center)) {
      return true;
    }

    return typeof value === "number" && Number.isSafeInteger(value) && value >= 1
      ? true
      : `${centerLabel} 정렬 순서를 1 이상의 정수로 입력해 주세요.`;
  };
}

function teacherOrderFields(): Field[] {
  return centerOptions.map((option) => {
    const center = option.value as CenterSlug;
    const fieldName = teacherOrderFieldName(center);

    return {
      name: fieldName,
      type: "number",
      access: {
        update: ({ req }) => canUpdateTeacherOrder(center, req.user),
      },
      admin: {
        condition: (data, _siblingData, { user }) =>
          canUpdateTeacherOrder(center, user) && teacherBelongsToOrderCenter(data?.centers, center),
        description: `${option.label} 교육진 소개에 표시되는 순서입니다.`,
        step: 1,
      },
      index: true,
      label: `${option.label} 정렬 순서`,
      min: 1,
      validate: validateTeacherOrder(center, option.label),
    };
  });
}

export const Teachers: CollectionConfig = {
  slug: "teachers",
  labels: {
    plural: "강사진",
    singular: "강사",
  },
  access: {
    ...centerScopedCollectionAccess,
    read: allowAll,
  },
  admin: {
    components: {
      views: {
        order: {
          Component: "@/components/payload/TeacherOrderView#TeacherOrderView",
          exact: true,
          meta: {
            description: "센터별 강사진 노출 순서를 드래그해서 설정합니다.",
            title: "강사진 순서 설정",
          },
          path: "/order",
        },
      },
    },
    defaultColumns: ["name", "centers", "status", "updatedAt"],
    group: "교육",
    useAsTitle: "name",
  },
  defaultSort: "name",
  endpoints: teacherOrderEndpoints,
  hooks: {
    afterChange: [
      revalidateTeacherAfterChange,
      normalizeUploadedMediaPrefixes([
        { path: "profileImageMedia", role: "teachers.profile-image" },
        {
          path: "representativeWorks.*.posterMedia",
          role: "teachers.representative-work-poster",
        },
      ]),
    ],
    afterDelete: [revalidateTeacherAfterDelete],
    beforeChange: [normalizeTeacherSlugBeforeChange],
    beforeValidate: [centerScopedBeforeValidate, normalizeTeacherSlugBeforeValidate],
  },
  versions: {
    maxPerDoc: 15,
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "이름",
      required: true,
    },
    ...adminTabs([
      {
        label: "기본 정보",
        fields: [
          adminRow([
            {
              name: "role",
              type: "text",
              label: "직함",
            },
            {
              name: "summary",
              type: "text",
              label: "전공/학교",
              admin: {
                description:
                  "콤마(,)로 항목을 구분하면 홈페이지에서 각 항목이 줄바꿈되어 표시됩니다.",
              },
            },
          ]),
          {
            name: "profileImageMedia",
            type: "upload",
            label: "프로필 이미지",
            relationTo: "media",
            required: true,
          },
          {
            name: "photoImage1",
            type: "text",
            label: "갤러리 이미지 업로드",
            admin: {
              components: {
                Field:
                  "@/components/payload/TeacherAdditionalPhotosField#TeacherAdditionalPhotosField",
              },
              disableListColumn: true,
            },
          },
          ...["photoImage2", "photoImage3", "photoImage4", "photoImage5", "photoImage6"].map(
            (name): NonNullable<CollectionConfig["fields"]>[number] => ({
              name,
              type: "text",
              label: name,
              admin: {
                components: {
                  Field:
                    "@/components/payload/TeacherAdditionalPhotosField#TeacherAdditionalPhotoHiddenField",
                },
                disableListColumn: true,
              },
            })
          ),
        ],
      },
      {
        label: "필모그래피",
        fields: [
          {
            name: "careerItems",
            type: "array",
            label: "필모그래피",
            labels: {
              plural: "필모그래피",
              singular: "필모그래피",
            },
            admin: {
              components: {
                RowLabel:
                  "@/components/payload/TeacherFilmographyRowLabel#TeacherFilmographyRowLabel",
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
        label: "대표작",
        fields: [
          {
            name: "representativeWorks",
            type: "array",
            label: "대표작",
            labels: {
              plural: "대표작",
              singular: "대표작",
            },
            maxRows: 8,
            admin: {
              components: {
                RowLabel:
                  "@/components/payload/TeacherRepresentativeWorkRowLabel#TeacherRepresentativeWorkRowLabel",
              },
            },
            fields: [
              {
                name: "title",
                type: "text",
                label: "제목",
              },
              {
                name: "posterMedia",
                type: "upload",
                label: "포스터 이미지 업로드",
                relationTo: "media",
              },
              {
                name: "posterPath",
                type: "text",
                label: "포스터 이미지",
                admin: {
                  components: {
                    Field: "@/components/payload/ImagePathField#ImagePathField",
                  },
                  description:
                    "기존 레거시 경로입니다. 새 포스터는 위 업로드 필드를 사용해 주세요.",
                },
              },
              {
                name: "description",
                type: "text",
                label: "설명",
              },
            ],
          },
        ],
      },
    ]),
    ...sidebarFields([
      centersField,
      authorNameField,
      adminCollapsible("센터별 정렬 순서", teacherOrderFields(), false),
      {
        name: "displayOrder",
        type: "number",
        label: "기존 정렬 순서",
        defaultValue: 0,
        admin: {
          disableListColumn: true,
          disableListFilter: true,
          hidden: true,
        },
      },
      {
        name: "status",
        type: "select",
        label: "상태",
        defaultValue: "archived",
        options: [
          { label: "임시저장", value: "draft" },
          { label: "공개", value: "published" },
          { label: "비공개", value: "archived" },
        ],
        admin: publishingStatusSelectAdmin(),
      },
    ]),
    slugField({ slugify: koreanSlugify, useAsSlug: "name" }),
  ],
};
