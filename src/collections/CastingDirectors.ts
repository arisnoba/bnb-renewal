import type { CollectionConfig } from "payload";

import { centerScopedPublishedCollectionAccess } from "./access";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from "./revalidateFrontend";
import {
  adminRow,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  publishingStatusSelectAdmin,
  sidebarFields,
} from "./shared";

const castingDirectorCompanyOptions = [
  { label: "BNB Casting", value: "BNB Casting" },
  { label: "CNA Agency", value: "CNA Agency" },
  { label: "ARKO LAB", value: "ARKO LAB" },
  { label: "IMGround", value: "IMGround" },
  { label: "BX Model Agency", value: "BX Model Agency" },
];

const revalidateCastingDirectorAfterChange = createCenterRevalidationAfterChange({
  reason: "casting director",
  suffixes: ["casting"],
});

const revalidateCastingDirectorAfterDelete = createCenterRevalidationAfterDelete({
  reason: "casting director",
  suffixes: ["casting"],
});

export const CastingDirectors: CollectionConfig = {
  slug: "casting-directors",
  labels: {
    plural: "캐스팅 디렉터",
    singular: "캐스팅 디렉터",
  },
  access: centerScopedPublishedCollectionAccess,
  admin: {
    defaultColumns: [
      "personName",
      "company",
      "centers",
      "authorName",
      "publishedAt",
      "updatedAt",
    ],
    group: "캐스팅/오디션",
    useAsTitle: "personName",
  },
  defaultSort: "personName",
  hooks: {
    afterChange: [
      revalidateCastingDirectorAfterChange,
      normalizeUploadedMediaPrefixes([
        { path: "profileImageMedia", role: "casting-directors.profile-image" },
      ]),
    ],
    afterDelete: [revalidateCastingDirectorAfterDelete],
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    adminRow([
      {
        name: "personName",
        type: "text",
        label: "이름",
        required: true,
        unique: true,
      },
      {
        name: "company",
        type: "select",
        label: "회사",
        required: true,
        options: castingDirectorCompanyOptions,
        admin: {
          components: {
            Field:
              "@/components/payload/CastingDirectorCompanySelectField#CastingDirectorCompanySelectField",
          },
        },
      },
    ]),
    {
      name: "profileImageMedia",
      type: "upload",
      label: "프로필 이미지",
      relationTo: "media",
      required: false,
    },
    {
      name: "careerItems",
      type: "array",
      label: "경력",
      labels: {
        plural: "경력",
        singular: "경력",
      },
      admin: {
        components: {
          RowLabel:
            "@/components/payload/CastingDirectorCareerRowLabel#CastingDirectorCareerRowLabel",
        },
      },
      fields: [
        adminRow([
          {
            name: "title",
            type: "text",
            label: "년도",
            required: true,
            admin: {
              width: "33.333%",
            },
          },
          {
            name: "content",
            type: "textarea",
            label: "내용",
            admin: {
              width: "66.667%",
            },
          },
        ]),
      ],
    },
    {
      name: "category",
      type: "text",
      label: "분류",
      admin: {
        hidden: true,
      },
    },
    ...sidebarFields([
      centersField,
      publishedAtField,
      {
        name: "displayStatus",
        type: "select",
        label: "상태",
        defaultValue: "archived",
        options: displayStatusOptions,
        admin: publishingStatusSelectAdmin(),
      },
      authorNameField,
    ]),
  ],
};
