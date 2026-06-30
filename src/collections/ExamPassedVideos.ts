import type { CollectionBeforeValidateHook, CollectionConfig, Field } from "payload";

import { centerScopedCollectionAccess } from "./access";
import { extractYouTubeVideoId, youtubeWatchUrl } from "@/lib/youtube";
import { createKoreanSlugifyWithFallback } from "../utilities/koreanSlugify";
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from "./revalidateFrontend";
import {
  authorNameField,
  authorNameFromCenters,
  centersField,
  isExamAdminMenuHidden,
  publishingFields,
  sidebarFields,
  slugField,
} from "./shared";

const examPassedVideoSlugify = createKoreanSlugifyWithFallback("passedvideo");
const revalidateExamPassedVideoAfterChange = createCenterRevalidationAfterChange({
  reason: "exam passed video",
  suffixes: ["", "passed-videos", "exam-passed-videos"],
});
const revalidateExamPassedVideoAfterDelete = createCenterRevalidationAfterDelete({
  reason: "exam passed video",
  suffixes: ["", "passed-videos", "exam-passed-videos"],
});

const syncYouTubeFields: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) {
    return data;
  }

  const nextData = { ...data };
  const youtubeUrl =
    typeof nextData.youtubeUrl === "string"
      ? nextData.youtubeUrl.trim()
      : typeof originalDoc?.youtubeUrl === "string"
        ? originalDoc.youtubeUrl.trim()
        : "";
  const youtubeCode = extractYouTubeVideoId(youtubeUrl);

  if (youtubeCode) {
    nextData.youtubeCode = youtubeCode;
    nextData.youtubeUrl = youtubeWatchUrl(youtubeCode);
  }

  return nextData;
};

const syncCreatedAtToPublishedAt: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) {
    return data;
  }

  const publishedAt =
    typeof data.publishedAt === "string"
      ? data.publishedAt
      : typeof originalDoc?.publishedAt === "string"
        ? originalDoc.publishedAt
        : new Date().toISOString();

  return {
    ...data,
    createdAt: publishedAt,
  };
};

function userDisplayName(user: unknown) {
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

const setExamPassedVideoCenterBeforeValidate: CollectionBeforeValidateHook = ({ data, req }) => {
  if (!data) {
    return data;
  }

  return {
    ...data,
    authorName: userDisplayName(req.user) ?? data.authorName ?? authorNameFromCenters(["exam"]),
    centers: ["exam"],
  };
};

const examCentersField = {
  ...centersField,
  defaultValue: ["exam"],
  admin: {
    ...(centersField.admin ?? {}),
    hidden: true,
    readOnly: true,
  },
} as Field;

export const ExamPassedVideos: CollectionConfig = {
  slug: "exam-passed-videos",
  labels: {
    plural: "합격영상",
    singular: "합격영상",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["title", "slug", "centers", "authorName", "youtubeUrl", "publishedAt", "updatedAt"],
    group: "입시센터 후기/합격",
    hidden: ({ user }) => isExamAdminMenuHidden(user),
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    afterChange: [revalidateExamPassedVideoAfterChange],
    afterDelete: [revalidateExamPassedVideoAfterDelete],
    beforeValidate: [
      syncYouTubeFields,
      syncCreatedAtToPublishedAt,
      setExamPassedVideoCenterBeforeValidate,
    ],
  },
  fields: [
    { name: "title", type: "text", label: "제목", required: true },
    {
      name: "youtubeCode",
      type: "text",
      label: "유튜브 코드",
      required: true,
      unique: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: "youtubeUrl",
      type: "text",
      label: "유튜브 URL",
      required: true,
      validate: (value: unknown) => {
        if (!value) {
          return "유튜브 URL을 입력해 주세요.";
        }

        return extractYouTubeVideoId(value)
          ? true
          : "유효한 유튜브 URL을 입력해 주세요.";
      },
    },
    {
      name: "youtubePreview",
      type: "ui",
      admin: {
        components: {
          Field:
            "@/components/payload/YouTubePreviewField#YouTubePreviewField",
        },
      },
    },
    ...sidebarFields([
      examCentersField,
      ...publishingFields,
      authorNameField,
      slugField({
        slugify: examPassedVideoSlugify,
      }),
    ]),
  ],
};
