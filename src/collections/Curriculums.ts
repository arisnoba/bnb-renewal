import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminDateConfig,
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  sidebarFields,
} from "./shared";

export const curriculumClassOptions = [
  { label: "초급 I Class", value: "초급 I Class" },
  { label: "중급 R Class", value: "중급 R Class" },
  { label: "고급 U Class", value: "고급 U Class" },
  { label: "전문 D Class", value: "전문 D Class" },
  { label: "배우 A Class", value: "배우 A Class" },
  { label: "애비뉴 S Class", value: "애비뉴 S Class" },
  { label: "특강반", value: "특강반" },
];

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

const validateEducationDays = (_value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
  const hasEducationDay = educationDayFieldNames.some(
    (fieldName) => siblingData?.[fieldName] === true,
  );

  return hasEducationDay ? true : "교육횟수를 하나 이상 선택해야 합니다.";
};

export const Curriculums: CollectionConfig = {
  slug: "curriculums",
  labels: {
    plural: "커리큘럼",
    singular: "커리큘럼",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "className",
      "teacher",
      "educationStartDate",
      "capacity",
      "updatedAt",
    ],
    group: "교육",
    useAsTitle: "title",
  },
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
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
            {
              name: "className",
              type: "select",
              label: "클래스",
              options: curriculumClassOptions,
              validate: validateRequired,
              admin: {
                className: "bnb-admin-required-field",
                width: "50%",
              },
            },
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
          ]),
          {
            name: "educationDays",
            type: "text",
            label: "교육횟수",
            validate: validateEducationDays,
            virtual: true,
            admin: {
              className: "bnb-admin-required-field",
              components: {
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
            admin: {
              hidden: true,
            },
          },
          {
            name: "educationDayTuesday",
            type: "checkbox",
            label: "화",
            defaultValue: false,
            admin: {
              hidden: true,
            },
          },
          {
            name: "educationDayWednesday",
            type: "checkbox",
            label: "수",
            defaultValue: false,
            admin: {
              hidden: true,
            },
          },
          {
            name: "educationDayThursday",
            type: "checkbox",
            label: "목",
            defaultValue: false,
            admin: {
              hidden: true,
            },
          },
          {
            name: "educationDayFriday",
            type: "checkbox",
            label: "금",
            defaultValue: false,
            admin: {
              hidden: true,
            },
          },
          {
            name: "educationDaySaturday",
            type: "checkbox",
            label: "토",
            defaultValue: false,
            admin: {
              hidden: true,
            },
          },
          {
            name: "educationDaySunday",
            type: "checkbox",
            label: "일",
            defaultValue: false,
            admin: {
              hidden: true,
            },
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
    ...sidebarFields([centersField, authorNameField]),
  ],
};
