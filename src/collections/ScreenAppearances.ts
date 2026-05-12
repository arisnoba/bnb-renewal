import type { CollectionConfig } from "payload";

import {
  BlockquoteFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

import { centerScopedCollectionAccess } from "./access";
import {
  adminRow,
  adminTabs,
  adminDateConfig,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  imagePathField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

const screenAppearanceBodyEditor = lexicalEditor({
  admin: {
    placeholder: "본문을 입력하세요.",
  },
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
});

const screenAppearanceTypeOptions = [
  { label: "드라마", value: "drama" },
  { label: "광고", value: "commercial" },
];

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
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    ...adminTabs([
      {
        label: "출연장면",
        fields: [
          {
            name: "appearanceType",
            type: "select",
            label: "출연 유형",
            options: screenAppearanceTypeOptions,
            required: true,
          },
          adminRow([
            {
              name: "performerName",
              type: "text",
              label: "출연자",
              required: true,
            },
            { name: "className", type: "text", label: "반/클래스" },
          ]),
          {
            name: "linkedProfiles",
            type: "relationship",
            label: "연결된 프로필",
            relationTo: "profiles",
            hasMany: true,
            admin: {
              description:
                "프로필과 연결만 저장합니다. 프로필의 경력관리에는 자동으로 등록되지 않습니다.",
            },
          },
          adminRow([
            { name: "projectTitle", type: "text", label: "작품명" },
            { name: "roleName", type: "text", label: "역할" },
          ]),
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
            label: "필모",
            labels: {
              plural: "필모",
              singular: "필모",
            },
            admin: {
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
          {
            name: "body",
            type: "richText",
            editor: screenAppearanceBodyEditor,
            label: "기존 본문",
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
              components: {
                RowLabel:
                  "@/components/payload/ScreenAppearanceBodyImageRowLabel#ScreenAppearanceBodyImageRowLabel",
              },
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
    ...sidebarFields([centersField, ...publishingFields, authorNameField]),
    legacyCollapsible(),
  ],
};
