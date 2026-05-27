import type { Access, CollectionBeforeValidateHook, CollectionConfig, Field } from "payload";

import {
  curriculumClassOptions,
  curriculumClassOptionsByCenter,
  type CurriculumCenter,
} from "../lib/curriculumOptions";
import {
  adminDateConfig,
  adminRow,
  adminTabs,
  authorNameField,
  authorNameFromCenters,
  centerOptions,
  isGlobalAdminUser,
  sidebarFields,
  slugField,
  userCenterValue,
} from "./shared";
import { createUniqueSlugBeforeValidate } from "./slugUtils";

const curriculumCenterOptions = centerOptions.filter((option) => option.value !== "kids");
const curriculumCenterValues = new Set(curriculumCenterOptions.map((option) => option.value));

const educationDayFieldNames = [
  "educationDayMonday",
  "educationDayTuesday",
  "educationDayWednesday",
  "educationDayThursday",
  "educationDayFriday",
  "educationDaySaturday",
  "educationDaySunday",
] as const;

const requiredMessage = "이 입력란은 필수입니다.";
const educationDayListAdmin = {
  disableListColumn: true,
  disableListFilter: true,
  hidden: true,
} as const;

function isEmptyValue(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

const validateRequired = (value: unknown) => {
  return isEmptyValue(value) ? requiredMessage : true;
};

function normalizeCurriculumCenter(value: unknown): CurriculumCenter | undefined {
  const center = Array.isArray(value) ? value[0] : value;

  return typeof center === "string" && curriculumCenterValues.has(center)
    ? (center as CurriculumCenter)
    : undefined;
}

function validateCurriculumCenter(value: unknown) {
  return normalizeCurriculumCenter(value) ? true : "센터를 선택해야 합니다.";
}

const validateCurriculumClass = (
  value: unknown,
  { siblingData }: { siblingData?: Record<string, unknown> },
) => {
  const center = normalizeCurriculumCenter(siblingData?.centers);

  if (!center) {
    return "센터를 먼저 선택해야 합니다.";
  }

  const options = curriculumClassOptionsByCenter[center];
  const className = typeof value === "string" ? value.trim() : "";

  return options.some((option) => option.value === className)
    ? true
    : "선택한 센터에서 사용할 수 없는 클래스입니다.";
};

const validateEducationDays = (_value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
  const hasEducationDay = educationDayFieldNames.some(
    (fieldName) => siblingData?.[fieldName] === true,
  );

  return hasEducationDay ? true : "수업요일을 하나 이상 선택해야 합니다.";
};

const setCurriculumSlug = createUniqueSlugBeforeValidate({
  collection: "curriculums",
  fallbackPrefix: "curriculum",
  getSlugParts: ({ data, originalDoc }) => [data.title ?? originalDoc?.title],
});

const curriculumCenterField: Field = {
  name: "centers",
  type: "select",
  label: "센터",
  defaultValue: ({ user }) => {
    const center = userCenterValue(user);

    return center && curriculumCenterValues.has(center) ? center : undefined;
  },
  options: curriculumCenterOptions,
  validate: validateCurriculumCenter,
  admin: {
    className: "bnb-admin-required-field",
    width: "50%",
    components: {
      Field: "@/components/payload/CurriculumCenterField#CurriculumCenterField",
    },
  },
};

const curriculumAccess: Access = ({ req }) => {
  if (!req.user) {
    return false;
  }

  if (isGlobalAdminUser(req.user)) {
    return true;
  }

  const center = userCenterValue(req.user);

  if (!center || !curriculumCenterValues.has(center)) {
    return false;
  }

  return {
    centers: {
      equals: center,
    },
  };
};

const curriculumCreateAccess: Access = ({ req }) => {
  if (!req.user) {
    return false;
  }

  return isGlobalAdminUser(req.user) || curriculumCenterValues.has(userCenterValue(req.user) ?? "");
};

const curriculumReadAccess: Access = ({ req }) => {
  if (!req.user || isGlobalAdminUser(req.user)) {
    return true;
  }

  return curriculumAccess({ req });
};

const curriculumBeforeValidate: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!data) {
    return data;
  }

  const userCenter = userCenterValue(req.user);
  const originalCenter = normalizeCurriculumCenter(originalDoc?.centers);
  const nextData = { ...data };

  if (req.user && !isGlobalAdminUser(req.user)) {
    if (!userCenter || !curriculumCenterValues.has(userCenter)) {
      throw new Error("커리큘럼을 관리할 수 있는 센터가 아닙니다.");
    }

    nextData.centers = originalCenter ?? userCenter;
  } else {
    nextData.centers = normalizeCurriculumCenter(nextData.centers ?? originalCenter);
  }

  if (!nextData.centers) {
    throw new Error("센터를 선택해야 합니다.");
  }

  nextData.authorName =
    nextData.authorName ??
    authorNameFromCenters(nextData.centers);

  return nextData;
};

export const Curriculums: CollectionConfig = {
  slug: "curriculums",
  labels: {
    plural: "커리큘럼",
    singular: "커리큘럼",
  },
  access: {
    create: curriculumCreateAccess,
    delete: curriculumAccess,
    read: curriculumReadAccess,
    update: curriculumAccess,
  },
  admin: {
    defaultColumns: [
      "title",
      "slug",
      "centers",
      "className",
      "teacher",
      "educationDays",
      "educationStartDate",
      "capacity",
      "updatedAt",
    ],
    group: "교육",
    useAsTitle: "title",
  },
  hooks: {
    beforeValidate: [curriculumBeforeValidate, setCurriculumSlug],
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "커리큘럼 명",
      validate: validateRequired,
      admin: {
        className: "bnb-admin-required-field",
      },
    },
    ...adminTabs([
      {
        label: "강의 정보",
        fields: [
          adminRow([
            curriculumCenterField,
            {
              name: "className",
              type: "select",
              label: "클래스",
              options: curriculumClassOptions,
              validate: validateCurriculumClass,
              admin: {
                className: "bnb-admin-required-field",
                width: "50%",
                components: {
                  Field: "@/components/payload/CurriculumClassField#CurriculumClassField",
                },
              },
            },
          ]),
          adminRow([
            {
              name: "teacher",
              type: "relationship",
              label: "강사",
              relationTo: "teachers",
              validate: validateRequired,
              admin: {
                className: "bnb-admin-required-field",
                width: "50%",
              },
            },
            {
              name: "capacity",
              type: "number",
              label: "정원",
              defaultValue: 8,
              min: 0,
              validate: validateRequired,
              admin: {
                className: "bnb-admin-required-field",
                width: "50%",
              },
            },
          ]),
          {
            name: "educationDays",
            type: "text",
            label: "수업요일",
            validate: validateEducationDays,
            virtual: true,
            admin: {
              className: "bnb-admin-required-field",
              components: {
                Cell:
                  "@/components/payload/CurriculumEducationDaysField#CurriculumEducationDaysCell",
                Field:
                  "@/components/payload/CurriculumEducationDaysField#CurriculumEducationDaysField",
              },
            },
          },
          {
            name: "educationDayMonday",
            type: "checkbox",
            label: "월",
            defaultValue: false,
            admin: educationDayListAdmin,
          },
          {
            name: "educationDayTuesday",
            type: "checkbox",
            label: "화",
            defaultValue: false,
            admin: educationDayListAdmin,
          },
          {
            name: "educationDayWednesday",
            type: "checkbox",
            label: "수",
            defaultValue: false,
            admin: educationDayListAdmin,
          },
          {
            name: "educationDayThursday",
            type: "checkbox",
            label: "목",
            defaultValue: false,
            admin: educationDayListAdmin,
          },
          {
            name: "educationDayFriday",
            type: "checkbox",
            label: "금",
            defaultValue: false,
            admin: educationDayListAdmin,
          },
          {
            name: "educationDaySaturday",
            type: "checkbox",
            label: "토",
            defaultValue: false,
            admin: educationDayListAdmin,
          },
          {
            name: "educationDaySunday",
            type: "checkbox",
            label: "일",
            defaultValue: false,
            admin: educationDayListAdmin,
          },
          adminRow([
            {
              name: "educationStartTime",
              type: "text",
              label: "교육 시작 시간",
              validate: validateRequired,
              admin: {
                className: "bnb-admin-required-field",
                placeholder: "10:00",
                width: "50%",
              },
            },
            {
              name: "educationEndTime",
              type: "text",
              label: "교육 종료 시간",
              validate: validateRequired,
              admin: {
                className: "bnb-admin-required-field",
                placeholder: "14:00",
                width: "50%",
              },
            },
          ]),
          adminRow([
            {
              name: "educationStartDate",
              type: "date",
              label: "교육 시작일",
              validate: validateRequired,
              admin: {
                ...adminDateConfig,
                className: "bnb-admin-required-field",
                width: "50%",
              },
            },
          ]),
        ],
      },
      {
        label: "커리큘럼",
        fields: [
          {
            name: "curriculumLessons",
            type: "array",
            label: "주차별 강의",
            labels: {
              plural: "주차별 강의",
              singular: "주차별 강의",
            },
            admin: {
              components: {
                RowLabel:
                  "@/components/payload/CurriculumLessonRowLabel#CurriculumLessonRowLabel",
              },
              initCollapsed: false,
            },
            fields: [
              {
                name: "topic",
                type: "text",
                label: "강의주제",
              },
              {
                name: "content",
                type: "textarea",
                label: "강의내용",
              },
            ],
          },
        ],
      },
    ]),
    ...sidebarFields([authorNameField]),
    slugField(),
  ],
};
