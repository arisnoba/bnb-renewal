import type { CollectionConfig } from "payload";

import { allowAll, centerScopedCollectionAccess } from "./access";
import {
  adminCollapsible,
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  legacyCollapsible,
  sidebarFields,
} from "./shared";

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
    defaultColumns: ["name", "centers", "authorName", "displayOrder", "updatedAt"],
    group: "교육",
    useAsTitle: "name",
  },
  defaultSort: "displayOrder",
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    ...adminTabs([
      {
        label: "기본 정보",
        fields: [
          adminRow([
            {
              name: "name",
              type: "text",
              label: "이름",
              required: true,
            },
            {
              name: "role",
              type: "text",
              label: "직함",
            },
          ]),
          imagePathField("profileImagePath", "프로필 이미지"),
          adminCollapsible("추가 사진", [
            adminRow([imagePathField("photoImage1", "사진 1")]),
            adminRow([imagePathField("photoImage2", "사진 2")]),
            adminRow([imagePathField("photoImage3", "사진 3")]),
            adminRow([imagePathField("photoImage4", "사진 4")]),
            adminRow([imagePathField("photoImage5", "사진 5")]),
            adminRow([imagePathField("photoImage6", "사진 6")]),
          ]),
          {
            name: "gallery",
            type: "array",
            label: "갤러리",
            fields: [
              {
                ...imagePathField("path", "이미지", true),
              },
              {
                name: "title",
                type: "text",
                label: "제목",
              },
              {
                name: "description",
                type: "text",
                label: "설명",
              },
            ],
          },
          {
            name: "summary",
            type: "textarea",
            label: "요약",
          },
          {
            name: "bioHtml",
            type: "textarea",
            label: "소개",
            defaultValue: "-",
            required: true,
            admin: {
              hidden: true,
            },
          },
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
      {
        label: "대표작",
        fields: [
          {
            name: "representativeWorks",
            type: "array",
            label: "대표작",
            fields: [
              adminRow([
                {
                  name: "title",
                  type: "text",
                  label: "제목",
                },
                {
                  name: "displayOrder",
                  type: "number",
                  label: "정렬순서",
                  defaultValue: 0,
                },
              ]),
              {
                ...imagePathField("posterPath", "포스터 이미지"),
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
      {
        name: "displayOrder",
        type: "number",
        label: "정렬순서",
        defaultValue: 0,
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
      },
    ]),
    legacyCollapsible(),
  ],
};
