import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  PayloadRequest,
  SelectField,
  TypeWithID,
  Validate,
} from "payload";

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
import { revalidateTag } from "next/cache";
import { createKoreanSlugifyWithFallback } from "../utilities/koreanSlugify";
import {
  getNewsCategoriesForCenters,
  getNewsCategoryOptions,
  newsCategoryOptions,
  normalizeNewsCategory,
} from "../lib/newsCategories";

import { centerScopedCollectionAccess } from "./access";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";
import {
  centerFrontendPaths,
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
  revalidateFrontendPaths,
  selectedFrontendCenters,
} from "./revalidateFrontend";
import {
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  publishingStatusSelectAdmin,
  sidebarFields,
  slugField,
} from "./shared";
import { seoTitleField, syncSeoMetaImageFromUpload } from "./seoFields";

const newsSlugify = createKoreanSlugifyWithFallback("news");
const revalidateNewsAfterChange = createCenterRevalidationAfterChange({
  reason: "news",
  suffixes: ["", "news"],
});
const revalidateNewsAfterDelete = createCenterRevalidationAfterDelete({
  reason: "news",
  suffixes: ["", "news"],
});

type NewsRevalidationDoc = TypeWithID & {
  centers?: unknown;
  slug?: unknown;
};

export function newsDetailFrontendPaths({
  centers,
  previousCenters,
  slugs,
}: {
  centers: unknown;
  previousCenters?: unknown;
  slugs: unknown[];
}) {
  const suffixes = Array.from(
    new Set(
      slugs
        .map((slug) => String(slug ?? "").trim())
        .filter(Boolean)
        .map((slug) => `news/${encodeURIComponent(slug)}`),
    ),
  );

  if (suffixes.length === 0) {
    return [];
  }

  return centerFrontendPaths({
    centers,
    previousCenters,
    suffixes,
  });
}

function newsDetailFrontendPathsForDocs(
  doc?: NewsRevalidationDoc | null,
  previousDoc?: NewsRevalidationDoc | null,
) {
  return newsDetailFrontendPaths({
    centers: doc?.centers,
    previousCenters: previousDoc?.centers,
    slugs: [doc?.slug, previousDoc?.slug],
  });
}

function newsArchiveCacheTagsForDocs(
  doc?: NewsRevalidationDoc | null,
  previousDoc?: NewsRevalidationDoc | null,
) {
  const centers = [
    ...selectedFrontendCenters(doc?.centers),
    ...selectedFrontendCenters(previousDoc?.centers),
  ];

  return Array.from(new Set(centers.map((center) => `frontend_news_${center}`)));
}

function revalidateNewsArchiveCacheTags({
  doc,
  previousDoc,
  req,
}: {
  doc?: NewsRevalidationDoc | null;
  previousDoc?: NewsRevalidationDoc | null;
  req: PayloadRequest;
}) {
  if (req.context.disableRevalidate) {
    return;
  }

  for (const tag of newsArchiveCacheTagsForDocs(doc, previousDoc)) {
    req.payload.logger.info(`Revalidating news cache tag ${tag}`);
    revalidateTag(tag, "max");
  }
}

const revalidateNewsCacheTagsAfterChange: CollectionAfterChangeHook<NewsRevalidationDoc> = ({
  doc,
  previousDoc,
  req,
}) => {
  revalidateNewsArchiveCacheTags({ doc, previousDoc, req });

  return doc;
};

const revalidateNewsCacheTagsAfterDelete: CollectionAfterDeleteHook<NewsRevalidationDoc> = ({
  doc,
  req,
}) => {
  revalidateNewsArchiveCacheTags({ doc, req });

  return doc;
};

const revalidateNewsDetailAfterChange: CollectionAfterChangeHook<NewsRevalidationDoc> = ({
  doc,
  previousDoc,
  req,
}) => {
  revalidateFrontendPaths({
    paths: newsDetailFrontendPathsForDocs(doc, previousDoc),
    reason: "news detail",
    req,
  });

  return doc;
};

const revalidateNewsDetailAfterDelete: CollectionAfterDeleteHook<NewsRevalidationDoc> = ({
  doc,
  req,
}) => {
  revalidateFrontendPaths({
    paths: newsDetailFrontendPathsForDocs(doc),
    reason: "news detail",
    req,
  });

  return doc;
};

export const newsBodyEditor = lexicalEditor({
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

function selectedNewsCenters(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function newsCategoryValuesForCenters(value: unknown) {
  return new Set(
    getNewsCategoryOptions(getNewsCategoriesForCenters(selectedNewsCenters(value))).map(
      (option) => option.value,
    ),
  );
}

function optionValue(option: SelectField["options"][number]) {
  return typeof option === "string" ? option : option.value;
}

function valuesEqual(left: unknown, right: unknown) {
  if (Object.is(left, right)) {
    return true;
  }

  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function isNewsBulkUpdateRequest({
  operation,
  req,
}: {
  operation?: unknown;
  req?: { url?: string };
}) {
  if (operation !== "update") {
    return false;
  }

  const url = req?.url;

  if (typeof url !== "string") {
    return false;
  }

  try {
    return Array.from(new URL(url, "http://payload.local").searchParams.keys()).some(
      (key) => key === "where" || key.startsWith("where["),
    );
  } catch {
    return url.includes("where=") || url.includes("where[") || url.includes("where%5B");
  }
}

function isUnchangedNewsBulkUpdateValue({
  operation,
  previousValue,
  req,
  value,
}: {
  operation?: unknown;
  previousValue?: unknown;
  req?: { url?: string };
  value: unknown;
}) {
  return isNewsBulkUpdateRequest({ operation, req }) && valuesEqual(value, previousValue);
}

const filterNewsCategoryOptions: NonNullable<SelectField["filterOptions"]> = ({
  data,
  options,
  siblingData,
}) => {
  const selectedValues = newsCategoryValuesForCenters(siblingData?.centers ?? data?.centers);

  return options.filter((option) => selectedValues.has(optionValue(option)));
};

const validateNewsCategory: Validate<unknown> = (
  value,
  { operation, previousValue, req, siblingData },
) => {
  if (isUnchangedNewsBulkUpdateValue({ operation, previousValue, req, value })) {
    return true;
  }

  const category = String(value ?? "").trim();

  if (!category) {
    return "분류를 선택해야 합니다.";
  }

  const selectedCategories = getNewsCategoriesForCenters(
    selectedNewsCenters(siblingData?.centers),
  );

  return normalizeNewsCategory(category, selectedCategories)
    ? true
    : "선택한 센터에서 사용할 수 없는 분류입니다.";
};

export const News: CollectionConfig = {
  slug: "news",
  labels: {
    plural: "뉴스",
    singular: "뉴스",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      "title",
      "slug",
      "centers",
      "authorName",
      "category",
      "publishedAt",
      "updatedAt",
    ],
    group: "운영/소식",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterChange: [
      revalidateNewsAfterChange,
      revalidateNewsCacheTagsAfterChange,
      revalidateNewsDetailAfterChange,
      normalizeUploadedMediaPrefixes([
        { path: "thumbnailMedia", role: "news.thumbnail" },
        { path: "body", role: "news.body-image", type: "richText" },
      ]),
    ],
    afterDelete: [
      revalidateNewsAfterDelete,
      revalidateNewsCacheTagsAfterDelete,
      revalidateNewsDetailAfterDelete,
    ],
    beforeValidate: [syncSeoMetaImageFromUpload("thumbnailMedia"), centerScopedBeforeValidate],
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
          {
            name: "category",
            type: "select",
            label: "분류",
            filterOptions: filterNewsCategoryOptions,
            options: newsCategoryOptions,
            validate: validateNewsCategory,
            admin: {
              className: "bnb-admin-required-field",
              isClearable: false,
              placeholder: "선택해 주세요",
            },
          },
          {
            name: "thumbnailMedia",
            type: "upload",
            label: "대표 이미지",
            relationTo: "media",
          },
          {
            name: "body",
            type: "richText",
            editor: newsBodyEditor,
            label: "본문",
          },
          {
            name: "excerpt",
            type: "textarea",
            label: "요약",
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
    {
      name: "viewCount",
      type: "number",
      label: "조회수",
      defaultValue: 0,
      admin: {
        hidden: true,
      },
    },
    slugField({
      slugify: newsSlugify,
    }),
  ],
  versions: {
    maxPerDoc: 15,
  },
};
