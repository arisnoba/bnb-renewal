import type { CollectionConfig, Validate } from "payload";

import {
  MetaDescriptionField,
  MetaImageField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields";
import {
  BlockquoteFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

import { centerScopedPublishedCollectionAccess } from "./access";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from "./revalidateFrontend";
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  isGlobalAdminUser,
  publishedAtField,
  publishingStatusSelectAdmin,
  sidebarFields,
  userCenterValue,
} from "./shared";
import { seoTitleField, syncSeoMetaImageFromUpload } from "./seoFields";
import {
  createFinalizeIdSlugAfterCreate,
  createIdSlugBeforeValidate,
  idSlugField,
} from "./slugUtils";

const revalidateArtistPressAfterChange = createCenterRevalidationAfterChange({
  cacheTagPrefixes: ["frontend_artist_press"],
  reason: "artist press",
  suffixes: ["", "artist-press"],
});
const revalidateArtistPressAfterDelete = createCenterRevalidationAfterDelete({
  cacheTagPrefixes: ["frontend_artist_press"],
  reason: "artist press",
  suffixes: ["", "artist-press"],
});

const validateArtistPressAgency: Validate<unknown> = (value) => {
  return value ? true : "소속사를 선택해야 합니다.";
};

const isArtistPressAdminMenuHidden = ({ user }: { user?: unknown }) => {
  return !isGlobalAdminUser(user) && userCenterValue(user) !== "art";
};

const artistPressBodyEditor = lexicalEditor({
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

const setArtistPressSlug = createIdSlugBeforeValidate();
const finalizeArtistPressSlugAfterCreate = createFinalizeIdSlugAfterCreate("artist-press");

export const ArtistPress: CollectionConfig = {
  slug: "artist-press",
  labels: {
    plural: "출신 아티스트",
    singular: "출신 아티스트",
  },
  access: centerScopedPublishedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "centers",
      "authorName",
      "actorName",
      "generation",
      "publishedAt",
      "updatedAt",
    ],
    group: "아티스트",
    hidden: isArtistPressAdminMenuHidden,
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterChange: [
      finalizeArtistPressSlugAfterCreate,
      revalidateArtistPressAfterChange,
      normalizeUploadedMediaPrefixes([
        { path: "thumbnailMedia", role: "artist-press.thumbnail" },
        { path: "agencyLogoMedia", role: "artist-press.agency-logo" },
        { path: "body", role: "artist-press.body-image", type: "richText" },
      ]),
    ],
    afterDelete: [revalidateArtistPressAfterDelete],
    beforeValidate: [
      syncSeoMetaImageFromUpload("thumbnailMedia"),
      centerScopedBeforeValidate,
      setArtistPressSlug,
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "제목",
      required: true,
    },
    ...adminTabs([
      {
        label: "콘텐츠",
        fields: [
          adminRow([
            {
              name: "actorName",
              type: "text",
              label: "배우명",
              required: true,
              admin: {
                width: "33.333%",
              },
            },
            {
              name: "agency",
              type: "relationship",
              label: "소속사",
              relationTo: "artist-press-agencies",
              validate: validateArtistPressAgency,
              admin: {
                className: "bnb-admin-required-field",
                description:
                  "소속사가 검색되지 않으면 먼저 소속사 로고 설정에 등록하세요.",
                width: "33.333%",
              },
            },
            {
              name: "generation",
              type: "text",
              label: "기수",
              required: true,
              admin: {
                width: "33.333%",
              },
            },
          ]),
          {
            name: "thumbnailMedia",
            type: "upload",
            label: "대표 이미지",
            relationTo: "media",
            admin: {
              description: "600×450px 이상의 이미지를 권장합니다.",
            },
          },
          {
            name: "agencyLogoMedia",
            type: "upload",
            label: "소속사 로고 이미지",
            relationTo: "media",
            admin: {
              hidden: true,
            },
          },
          {
            name: "body",
            type: "richText",
            editor: artistPressBodyEditor,
            label: "본문",
          },
        ],
      },
      {
        name: "meta",
        label: "SEO",
        fields: [
          OverviewField({
            titlePath: "meta.title",
            descriptionPath: "meta.description",
            imagePath: "meta.image",
          }),
          seoTitleField(),
          MetaImageField({
            relationTo: "media",
          }),
          MetaDescriptionField({}),
          PreviewField({
            hasGenerateFn: true,
            titlePath: "meta.title",
            descriptionPath: "meta.description",
          }),
        ],
      },
    ]),
    ...sidebarFields([
      centersField,
      {
        name: "displayStatus",
        type: "select",
        label: "상태",
        defaultValue: "archived",
        options: displayStatusOptions,
        admin: publishingStatusSelectAdmin(),
      },
      publishedAtField,
      authorNameField,
    ]),
    idSlugField,
  ],
  versions: {
    maxPerDoc: 15,
  },
};
