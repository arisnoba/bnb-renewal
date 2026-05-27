import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
  SelectField,
  Validate,
} from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminDateConfig,
  adminRow,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  publishingFields,
  sidebarFields,
} from "./shared";

const auditionEventTypeOptions = [
  { label: "촬영", value: "shooting" },
  { label: "일정", value: "schedule" },
  { label: "오디션", value: "audition" },
];

type AuditionScheduleData = {
  scheduleEndDate?: unknown;
  scheduleStartDate?: unknown;
};

function dateValue(value: unknown) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value as string | Date);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

const validateScheduleStartDate: Validate<
  Date,
  unknown,
  AuditionScheduleData
> = (value) => {
  return dateValue(value) ? true : "시작일을 선택해야 합니다.";
};

const validateScheduleEndDate: Validate<
  Date,
  unknown,
  AuditionScheduleData
> = (value, { siblingData }) => {
  if (!value) {
    return true;
  }

  const startDate = dateValue(siblingData?.scheduleStartDate);
  const endDate = dateValue(value);

  if (startDate && endDate && endDate < startDate) {
    return "종료일은 시작일보다 빠를 수 없습니다.";
  }

  return true;
};

const validateAuditionEventType: Validate<string, unknown, AuditionScheduleData> = (
  value,
) => {
  if (!String(value ?? "").trim()) {
    return "일정 유형을 선택해야 합니다.";
  }

  return true;
};

const normalizeAuditionScheduleDates: CollectionBeforeValidateHook = ({
  data,
}) => {
  if (!data) {
    return data;
  }

  const nextData = { ...data };

  if (nextData.scheduleStartDate && !nextData.scheduleEndDate) {
    nextData.scheduleEndDate = nextData.scheduleStartDate;
  }

  return nextData;
};

export const AuditionSchedules: CollectionConfig = {
  slug: "audition-schedules",
  labels: {
    plural: "오디션 일정",
    singular: "오디션 일정",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "centers",
      "authorName",
      "eventType",
      "scheduleStartDate",
      "updatedAt",
    ],
    group: "캐스팅/오디션",
    useAsTitle: "title",
  },
  defaultSort: "-scheduleStartDate",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate, normalizeAuditionScheduleDates],
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "제목",
      required: true,
    },
    {
      name: "eventType",
      type: "select",
      label: "일정 유형",
      options: auditionEventTypeOptions,
      validate: validateAuditionEventType,
      admin: {
        className: "bnb-admin-required-field",
        placeholder: "선택해 주세요",
      },
    } as SelectField,
    adminRow([
      {
        name: "scheduleStartDate",
        type: "date",
        label: "시작일",
        admin: {
          ...adminDateConfig,
          components: {
            Field:
              "@/components/payload/AuditionScheduleStartDateField#AuditionScheduleStartDateField",
          },
        },
        required: true,
        validate: validateScheduleStartDate,
      },
      {
        name: "scheduleEndDate",
        type: "date",
        label: "종료일",
        admin: adminDateConfig,
        validate: validateScheduleEndDate,
      },
    ]),
    {
      name: "bodyHtml",
      type: "textarea",
      label: "본문",
    },
    ...sidebarFields([
      centersField,
      ...publishingFields,
      authorNameField,
    ]),
  ],
};
