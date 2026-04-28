"use client";

import type { UIFieldClientComponent } from "payload";

import { useFormFields } from "@payloadcms/ui";

import { extractYouTubeVideoId, youtubeEmbedUrl } from "@/lib/youtube";

type FieldState = {
  value?: unknown;
};

export const YouTubePreviewField: UIFieldClientComponent = () => {
  const youtubeUrl = useFormFields(([fields]) => {
    const field = fields.youtubeUrl as FieldState | undefined;
    return typeof field?.value === "string" ? field.value : "";
  });
  const videoId = extractYouTubeVideoId(youtubeUrl);

  return (
    <div style={{ display: "grid", gap: "calc(var(--base) / 4)" }}>
      <div
        style={{
          color: "var(--theme-text)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        유튜브 미리보기
      </div>
      <div
        style={{
          background: "var(--theme-elevation-50)",
          border: "1px solid var(--theme-border-color)",
          borderRadius: "var(--style-radius-s)",
          overflow: "hidden",
        }}
      >
        {videoId ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            src={youtubeEmbedUrl(videoId)}
            style={{
              aspectRatio: "16 / 9",
              border: 0,
              display: "block",
              width: "100%",
            }}
            title="유튜브 영상 미리보기"
          />
        ) : (
          <div
            style={{
              alignItems: "center",
              aspectRatio: "16 / 9",
              color: "var(--theme-elevation-600)",
              display: "flex",
              fontSize: 13,
              justifyContent: "center",
              padding: "calc(var(--base) * 0.5)",
              textAlign: "center",
            }}
          >
            유튜브 URL을 입력하면 영상이 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
};
