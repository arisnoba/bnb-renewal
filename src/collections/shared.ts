import type { CollectionBeforeValidateHook, Field } from "payload";

type AdminTab = {
  fields: Field[];
  label: string;
  name?: string;
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
];

export type CenterValue = (typeof centerOptions)[number]["value"];
export type CenterFilterValue = CenterValue | "all";

const centerValues = new Set(centerOptions.map((option) => option.value));
const centerFilterValues = new Set<CenterFilterValue>([
  "all",
  ...centerOptions.map((option) => option.value),
]);

const centerFilterOptions = [
  { label: "ALL", value: "all" },
  ...centerOptions,
];

const centerAuthorNames: Record<CenterValue, string> = {
  art: "배우앤배움 아트센터",
  avenue: "배우앤배움 애비뉴센터",
  exam: "배우앤배움 입시센터",
  highteen: "배우앤배움 하이틴센터",
  kids: "배우앤배움 키즈센터",
};

export function userCenterValue(user: unknown): CenterValue | undefined {
  if (!user || typeof user !== "object") {
    return undefined;
  }

  const center = (user as { center?: unknown }).center;

  return typeof center === "string" && centerValues.has(center)
    ? (center as CenterValue)
    : undefined;
}

export function isGlobalAdminUser(user: unknown) {
  if (!user || typeof user !== "object") {
    return false;
  }

  const role = (user as { role?: unknown }).role;

  return role === "master" || role === "admin";
}

export function isExamAdminMenuHidden(user: unknown) {
  return !isGlobalAdminUser(user) && userCenterValue(user) !== "exam";
}

function normalizeCenterFilterValues(value: unknown): CenterFilterValue[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const centers = values.map((item) => String(item ?? "").trim());

  if (centers.length === 0) {
    throw new Error("센터를 선택해야 합니다.");
  }

  const invalidCenter = centers.find(
    (center) => !centerFilterValues.has(center as CenterFilterValue),
  );

  if (invalidCenter) {
    throw new Error(`지원하지 않는 센터 값입니다: ${invalidCenter}`);
  }

  if (centers.includes("all")) {
    return ["all"];
  }

  return Array.from(new Set(centers)) as CenterValue[];
}

function authorNameFromUser(user: unknown) {
  if (!user || typeof user !== "object") {
    return undefined;
  }

  const name = (user as { name?: unknown }).name;
  const email = (user as { email?: unknown }).email;

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  if (typeof email === "string" && email.trim()) {
    return email.trim();
  }

  return undefined;
}

export function authorNameFromCenters(value: unknown) {
  const centers = normalizeCenterFilterValues(value);

  if (centers.length !== 1) {
    return centerAuthorNames.art;
  }

  if (centers[0] === "all") {
    return "배우앤배움 전체 센터";
  }

  return centerAuthorNames[centers[0]];
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
  defaultValue: ({ user }) => {
    const center = userCenterValue(user);

    return center ? [center] : undefined;
  },
  hasMany: true,
  options: centerFilterOptions,
  required: true,
  admin: {
    components: {
      Field: "@/components/payload/CentersField#CentersField",
    },
  },
};

export const authorNameField: Field = {
  name: "authorName",
  type: "text",
  label: "작성자명",
  admin: {
    readOnly: true,
  },
};

export const centerScopedBeforeValidate: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) {
    return data;
  }

  const user = req.user;
  const userCenter = userCenterValue(user);
  const nextData = { ...data };
  const originalCenters =
    originalDoc && typeof originalDoc === "object"
      ? (originalDoc as { centers?: unknown }).centers
      : undefined;

  if (user && !isGlobalAdminUser(user)) {
    if (!userCenter) {
      throw new Error("관리자 계정에 유효한 센터가 없습니다.");
    }

    if (originalCenters) {
      const normalizedOriginalCenters = normalizeCenterFilterValues(originalCenters);

      if (normalizedOriginalCenters.includes("all")) {
        throw new Error("ALL 센터 콘텐츠는 센터매니저가 수정할 수 없습니다.");
      }

      nextData.centers = normalizedOriginalCenters;
    } else {
      nextData.centers = [userCenter];
    }
  } else {
    nextData.centers = normalizeCenterFilterValues(nextData.centers ?? originalCenters);
  }

  nextData.authorName =
    authorNameFromUser(user) ??
    nextData.authorName ??
    authorNameFromCenters(nextData.centers);

  return nextData;
};

export const allCentersBeforeValidate: CollectionBeforeValidateHook = ({
  data,
  req,
}) => {
  if (!data) {
    return data;
  }

  const nextData: Record<string, unknown> = {
    ...data,
    centers: ["all"],
  };

  nextData.authorName =
    authorNameFromUser(req.user) ??
    nextData.authorName ??
    authorNameFromCenters(nextData.centers);

  return nextData;
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

export const publishedAtField: Field = {
  name: "publishedAt",
  type: "date",
  label: "발행일",
  defaultValue: () => new Date().toISOString(),
  admin: adminDateConfig,
};

export const displayStatusField: Field = {
  name: "displayStatus",
  type: "select",
  label: "노출 상태",
  defaultValue: "published",
  options: displayStatusOptions,
  required: true,
};

export const publishingFields: Field[] = [publishedAtField, displayStatusField];

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
