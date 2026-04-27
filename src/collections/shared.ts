import type { Field } from "payload";

type AdminTab = {
  fields: Field[];
  label: string;
};

export const adminDateConfig = {
  date: {
    displayFormat: "yy.MM.dd",
    pickerAppearance: "dayOnly" as const,
  },
};

export const centerOptions = [
  { label: "아트센터", value: "art" },
  { label: "입시센터", value: "exam" },
  { label: "키즈센터", value: "kids" },
  { label: "하이틴센터", value: "highteen" },
  { label: "애비뉴센터", value: "avenue" },
  { label: "전체", value: "all" },
  { label: "미분류", value: "unknown" },
];

const centerValues = new Set(centerOptions.map((option) => option.value));

function userCenterValue(user: unknown) {
  if (!user || typeof user !== "object") {
    return "unknown";
  }

  const center = (user as { center?: unknown }).center;

  return typeof center === "string" && centerValues.has(center)
    ? center
    : "unknown";
}

export const displayStatusOptions = [
  { label: "임시저장", value: "draft" },
  { label: "공개", value: "published" },
  { label: "보관", value: "archived" },
];

export const centersField: Field = {
  name: "centers",
  type: "select",
  label: "센터",
  defaultValue: ({ user }) => [userCenterValue(user)],
  hasMany: true,
  hooks: {
    beforeValidate: [
      ({ req, value }) => {
        if (!req.user) {
          return Array.isArray(value) && value.length > 0
            ? value
            : ["unknown"];
        }

        const center = userCenterValue(req.user);

        if (center !== "art") {
          return [center];
        }

        return Array.isArray(value) && value.length > 0 ? value : [center];
      },
    ],
  },
  options: centerOptions,
  required: true,
  admin: {
    components: {
      Field: "@/components/payload/CentersField#CentersField",
    },
  },
};

export const sourceFields: Field[] = [
  {
    name: "sourceDb",
    type: "text",
    label: "원본 DB",
    required: true,
  },
  {
    name: "sourceTable",
    type: "text",
    label: "원본 테이블",
    required: true,
  },
  {
    name: "sourceId",
    type: "number",
    label: "원본 ID",
    required: true,
  },
  {
    name: "slug",
    type: "text",
    label: "슬러그",
    required: true,
    unique: true,
  },
];

export const publishingFields: Field[] = [
  {
    name: "publishedAt",
    type: "date",
    label: "발행일",
    defaultValue: () => new Date().toISOString(),
    admin: adminDateConfig,
  },
  {
    name: "displayStatus",
    type: "select",
    label: "노출 상태",
    defaultValue: "published",
    options: displayStatusOptions,
    required: true,
  },
];

export const legacyMetaField: Field = {
  name: "legacyMeta",
  type: "json",
  label: "레거시 메타",
};

export function adminCollapsible(
  label: string,
  fields: Field[],
  initCollapsed = true,
): Field {
  return {
    type: "collapsible",
    label,
    admin: {
      initCollapsed,
    },
    fields,
  };
}

export function adminRow(fields: Field[]): Field {
  return {
    type: "row",
    fields,
  };
}

export function sidebarField(field: Field): Field {
  const fieldWithAdmin = field as Field & {
    admin?: Record<string, unknown>;
  };

  return {
    ...field,
    admin: {
      ...fieldWithAdmin.admin,
      position: "sidebar",
    },
  } as Field;
}

export function sidebarFields(fields: Field[]): Field[] {
  return fields.map(sidebarField);
}

export function imagePathField(
  name: string,
  label: string,
  required = false,
): Field {
  return {
    name,
    type: "text",
    label,
    required,
    admin: {
      components: {
        Field: "@/components/payload/ImagePathField#ImagePathField",
      },
    },
  };
}

export function adminTabs(tabs: AdminTab[]): Field[] {
  return [
    {
      type: "tabs",
      tabs,
    },
  ];
}

export function legacyTab(fields: Field[] = []): AdminTab {
  return {
    label: "레거시/원본",
    fields: [...sourceFields, ...fields, legacyMetaField],
  };
}

export function legacyCollapsible(fields: Field[] = []): Field {
  return adminCollapsible("레거시/원본", [
    ...sourceFields,
    ...fields,
    legacyMetaField,
  ]);
}
