import type { CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  legacyCollapsible,
  sidebarFields,
} from "./shared";

export const Curriculums: CollectionConfig = {
  slug: "curriculums",
  labels: {
    plural: "커리큘럼",
    singular: "커리큘럼",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["subject", "centers", "authorName", "teacher", "category", "updatedAt"],
    group: "교육",
    useAsTitle: "subject",
  },
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    ...adminTabs([
      {
        label: "커리큘럼",
        fields: [
          adminRow([
            {
              name: "category",
              type: "text",
              label: "분류",
            },
            {
              name: "teacher",
              type: "relationship",
              label: "강사명",
              relationTo: "teachers",
            },
          ]),
          {
            name: "subject",
            type: "text",
            label: "제목",
          },
          {
            name: "weeklyLessons",
            type: "array",
            label: "주차별 강의",
            labels: {
              plural: "주차별 강의",
              singular: "주차별 강의",
            },
            admin: {
              initCollapsed: false,
            },
            fields: [
              adminRow([
                {
                  name: "lessonSubject",
                  type: "text",
                  label: "강의 주제",
                },
                {
                  name: "lessonContent",
                  type: "textarea",
                  label: "강의 내용",
                },
              ]),
            ],
          },
        ],
      },
      {
        label: "연결 정보",
        fields: [
          {
            name: "teacherName",
            type: "text",
            label: "원본 강사명",
          },
          adminRow([
            {
              name: "resolvedTeacherId",
              type: "number",
              label: "연결된 강사 ID",
            },
            {
              name: "resolvedTeacherSlug",
              type: "text",
              label: "연결된 강사 슬러그",
            },
          ]),
          {
            name: "titleRaw",
            type: "textarea",
            label: "원본 주차별 강의 주제",
          },
          {
            name: "contentRaw",
            type: "textarea",
            label: "원본 주차별 강의 내용",
          },
        ],
      },
    ]),
    ...sidebarFields([centersField, authorNameField]),
    legacyCollapsible(),
  ],
};
