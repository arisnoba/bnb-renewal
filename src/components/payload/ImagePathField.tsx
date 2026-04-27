"use client";

import type { TextFieldClientComponent } from "payload";

import { useField } from "@payloadcms/ui";

const imageExtensions = new Set([
  "avif",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
]);

function getImageSrc(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

function getFileName(src: string) {
  const pathname = src.split("?")[0] ?? "";
  const fileName = pathname.split("/").filter(Boolean).pop();

  if (!fileName) {
    return src;
  }

  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function isProbablyImage(src: string) {
  const pathname = src.split("?")[0] ?? "";
  const extension = pathname.split(".").pop()?.toLowerCase();

  return extension ? imageExtensions.has(extension) : true;
}

export const ImagePathField: TextFieldClientComponent = ({
  field,
  path: pathFromProps,
}) => {
  const { value } = useField<string>({
    potentiallyStalePath: pathFromProps,
  });
  const imageSrc = getImageSrc(value);
  const canPreview = imageSrc && isProbablyImage(imageSrc);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {canPreview ? (
        <div
          style={{
            alignItems: "stretch",
            background: "var(--theme-elevation-50)",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: 6,
            display: "grid",
            gridTemplateColumns: "minmax(120px, 220px) minmax(0, 1fr)",
            overflow: "hidden",
          }}
        >
          <a
            href={imageSrc}
            rel="noreferrer"
            style={{
              aspectRatio: "4 / 3",
              background: "var(--theme-elevation-100)",
              display: "block",
              minHeight: 140,
            }}
            target="_blank"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              loading="lazy"
              src={imageSrc}
              style={{
                display: "block",
                height: "100%",
                objectFit: "cover",
                width: "100%",
              }}
            />
          </a>
          <div
            style={{
              display: "grid",
              gap: 8,
              minWidth: 0,
              padding: 16,
            }}
          >
            <div
              style={{
                color: "var(--theme-text)",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={getFileName(imageSrc)}
            >
              {getFileName(imageSrc)}
            </div>
            <div
              style={{
                color: "var(--theme-elevation-600)",
                fontSize: 13,
                overflowWrap: "anywhere",
              }}
            >
              {value}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--theme-elevation-50)",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: 6,
            color: "var(--theme-elevation-600)",
            padding: 16,
          }}
        >
          {field.label ? `${field.label}: ` : null}이미지 없음
        </div>
      )}
    </div>
  );
};
