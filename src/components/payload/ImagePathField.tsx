"use client";

import type { TextFieldClientComponent } from "payload";
import type { ChangeEvent } from "react";

import { useRef, useState } from "react";
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

async function readErrorMessage(response: Response) {
  const fallback = "이미지 처리 중 오류가 발생했습니다.";

  try {
    const body = (await response.json()) as { error?: unknown };

    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export const ImagePathField: TextFieldClientComponent = ({
  field,
  path: pathFromProps,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info">("info");
  const { disabled, errorMessage, setValue, showError, value } =
    useField<string>({
      potentiallyStalePath: pathFromProps,
    });
  const fieldValue = typeof value === "string" ? value : "";
  const label =
    typeof field.label === "string" ? field.label : pathFromProps ?? field.name;
  const imageSrc = getImageSrc(value);
  const canPreview = imageSrc && isProbablyImage(imageSrc);
  const controlsDisabled = disabled || isProcessing;

  async function uploadFile(file: File) {
    setIsProcessing(true);
    setMessage("");
    setMessageType("info");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin-images", {
        body: formData,
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const body = (await response.json()) as { path?: unknown };
      const nextPath = typeof body.path === "string" ? body.path : "";

      if (!nextPath) {
        throw new Error("업로드 응답에 이미지 경로가 없습니다.");
      }

      setValue(nextPath);
      setMessage("업로드되었습니다. 저장 버튼을 눌러 변경사항을 반영하세요.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    event.currentTarget.value = "";

    if (file) {
      await uploadFile(file);
    }
  }

  async function handleDelete() {
    if (!fieldValue) {
      return;
    }

    setIsProcessing(true);
    setMessage("");
    setMessageType("info");

    try {
      const response = await fetch("/api/admin-images", {
        body: JSON.stringify({ path: fieldValue }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setValue("");
      setMessage("이미지 값이 삭제되었습니다. 저장 버튼을 눌러 변경사항을 반영하세요.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label
        style={{
          color: "var(--theme-text)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {label}
        {field.required ? (
          <span style={{ color: "var(--theme-error-500)" }}> *</span>
        ) : null}
      </label>
      <input
        accept="image/avif,image/gif,image/jpeg,image/png,image/svg+xml,image/webp"
        disabled={controlsDisabled}
        onChange={handleFileChange}
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
      />
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
          <button
            disabled={controlsDisabled}
            onClick={() => inputRef.current?.click()}
            style={{
              appearance: "none",
              aspectRatio: "4 / 3",
              background: "var(--theme-elevation-100)",
              border: 0,
              cursor: controlsDisabled ? "not-allowed" : "pointer",
              display: "block",
              minHeight: 140,
              padding: 0,
            }}
            type="button"
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
          </button>
          <div
            style={{
              display: "grid",
              gap: 10,
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
            <input
              disabled={controlsDisabled}
              onChange={(event) => setValue(event.currentTarget.value)}
              style={{
                background:
                  "var(--theme-input-bg, var(--theme-elevation-0))",
                border: "1px solid var(--theme-elevation-150)",
                borderRadius: 4,
                color: "var(--theme-elevation-600)",
                fontSize: 13,
                minWidth: 0,
                overflowWrap: "anywhere",
                padding: "8px 10px",
              }}
              type="text"
              value={fieldValue}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                disabled={controlsDisabled}
                onClick={() => inputRef.current?.click()}
                style={{
                  background: "var(--theme-elevation-100)",
                  border: "1px solid var(--theme-elevation-200)",
                  borderRadius: 4,
                  color: "var(--theme-text)",
                  cursor: controlsDisabled ? "not-allowed" : "pointer",
                  fontSize: 13,
                  padding: "7px 10px",
                }}
                type="button"
              >
                교체
              </button>
              <a
                href={imageSrc}
                rel="noreferrer"
                style={{
                  alignItems: "center",
                  background: "var(--theme-elevation-100)",
                  border: "1px solid var(--theme-elevation-200)",
                  borderRadius: 4,
                  color: "var(--theme-text)",
                  display: "inline-flex",
                  fontSize: 13,
                  padding: "7px 10px",
                  textDecoration: "none",
                }}
                target="_blank"
              >
                보기
              </a>
              <button
                disabled={controlsDisabled}
                onClick={handleDelete}
                style={{
                  background: "var(--theme-error-50)",
                  border: "1px solid var(--theme-error-150)",
                  borderRadius: 4,
                  color: "var(--theme-error-700)",
                  cursor: controlsDisabled ? "not-allowed" : "pointer",
                  fontSize: 13,
                  padding: "7px 10px",
                }}
                type="button"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          disabled={controlsDisabled}
          onClick={() => inputRef.current?.click()}
          style={{
            background: "var(--theme-elevation-50)",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: 6,
            color: "var(--theme-elevation-600)",
            cursor: controlsDisabled ? "not-allowed" : "pointer",
            padding: 16,
            textAlign: "left",
          }}
          type="button"
        >
          {isProcessing ? "업로드 중..." : "이미지 없음. 클릭해서 업로드하세요."}
        </button>
      )}
      {!canPreview ? (
        <input
          disabled={controlsDisabled}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder="이미지 경로 또는 URL"
          style={{
            background: "var(--theme-input-bg, var(--theme-elevation-0))",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: 4,
            color: "var(--theme-text)",
            fontSize: 13,
            minWidth: 0,
            padding: "8px 10px",
          }}
          type="text"
          value={fieldValue}
        />
      ) : null}
      {message ? (
        <div
          style={{
            color: messageType === "error"
              ? "var(--theme-error-700)"
              : "var(--theme-elevation-600)",
            fontSize: 12,
          }}
        >
          {message}
        </div>
      ) : null}
      {showError && errorMessage ? (
        <div style={{ color: "var(--theme-error-700)", fontSize: 12 }}>
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
};
