import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";

import { centerScopedCollectionAccess } from "./access";
import { extractYouTubeVideoId, youtubeWatchUrl } from "@/lib/youtube";
import {
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  isExamAdminMenuHidden,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

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

export const ExamPassedVideos: CollectionConfig = {
  slug: "exam-passed-videos",
  labels: {
    plural: "합격영상",
    singular: "합격영상",
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: ["title", "centers", "authorName", "youtubeUrl", "publishedAt", "updatedAt"],
    group: "입시센터 후기/합격",
    hidden: ({ user }) => isExamAdminMenuHidden(user),
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  hooks: {
    beforeValidate: [syncYouTubeFields, centerScopedBeforeValidate],
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
    ...sidebarFields([centersField, ...publishingFields, authorNameField]),
    legacyCollapsible(),
  ],
};
