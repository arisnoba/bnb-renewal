import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  ADMIN_IMAGE_UPLOAD_LIMIT_BYTES,
  ADMIN_IMAGE_UPLOAD_LIMIT_MESSAGE,
} from "@/lib/mediaUploadPolicy";
import { resolveAdminImageDeletionTarget } from "@/lib/adminImageDeletionTarget";
import { getPayloadClient } from "@/lib/payload";
import { deleteR2Object, getR2PublicUrl, uploadR2Object } from "@/lib/r2";
import {
  IMAGE_UPLOAD_TYPES,
  uploadValidationMessage,
  validateUploadedFile,
} from "@/lib/uploadFileValidation";

export const runtime = "nodejs";

async function requireAdmin(request: Request) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: request.headers });

  if (!user) {
    return false;
  }

  return true;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function logStorageError(message: string, error: unknown) {
  console.error(message, error);

  return jsonError(`${message} R2 키 권한과 버킷 설정을 확인하세요.`, 500);
}

function getStorageDateParts() {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return { month, year };
}

function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const basename = path.basename(fileName, extension);
  const safeBasename =
    basename
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "image";

  return `${safeBasename}${extension}`;
}

function previewObjectKey(value: unknown) {
  const key = typeof value === "string" ? value.trim().replace(/^\/+/, "") : "";

  if (
    (!key.startsWith("media/") && !key.startsWith("legacy/")) ||
    key.includes("..") ||
    key.includes("\\")
  ) {
    return "";
  }

  return key
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const objectKey = previewObjectKey(url.searchParams.get("key"));

  if (!objectKey) {
    return jsonError("미리보기 이미지 경로가 올바르지 않습니다.", 400);
  }

  return NextResponse.redirect(getR2PublicUrl(objectKey), 302);
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return jsonError("로그인이 필요합니다.", 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("업로드할 이미지 파일이 없습니다.", 400);
  }

  if (file.size > ADMIN_IMAGE_UPLOAD_LIMIT_BYTES) {
    return jsonError(ADMIN_IMAGE_UPLOAD_LIMIT_MESSAGE, 400);
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const validation = validateUploadedFile({
    allowedTypes: IMAGE_UPLOAD_TYPES,
    bytes: fileBuffer,
    fileName: file.name,
    mimeType: file.type,
  });

  if (!validation.valid) {
    return jsonError(uploadValidationMessage(validation), 400);
  }

  const { month, year } = getStorageDateParts();
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeFileName(
    file.name,
  )}`;
  const storagePath = `admin-images/${year}/${month}/${fileName}`;
  let uploaded: Awaited<ReturnType<typeof uploadR2Object>>;

  try {
    uploaded = await uploadR2Object({
      body: fileBuffer,
      cacheControl: "public, max-age=31536000, immutable",
      contentType: validation.mimeType,
      key: storagePath,
    });
  } catch (error) {
    return logStorageError("R2 이미지 업로드에 실패했습니다.", error);
  }

  return NextResponse.json({
    fileName,
    objectKey: uploaded.objectKey,
    path: uploaded.publicUrl,
    storage: "r2",
  });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) {
    return jsonError("로그인이 필요합니다.", 401);
  }

  const body = (await request.json().catch(() => null)) as {
    path?: unknown;
  } | null;
  const imagePath = typeof body?.path === "string" ? body.path.trim() : "";

  if (!imagePath) {
    return jsonError("삭제할 이미지 경로가 없습니다.", 400);
  }

  const deletionTarget = resolveAdminImageDeletionTarget(imagePath);

  if (!deletionTarget) {
    return jsonError("관리자 이미지 경로만 삭제할 수 있습니다.", 400);
  }

  if (deletionTarget.kind === "r2") {
    try {
      await deleteR2Object(deletionTarget.key);
    } catch (error) {
      return logStorageError("R2 이미지 삭제에 실패했습니다.", error);
    }
  } else {
    await unlink(deletionTarget.path).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
  }

  return NextResponse.json({ success: true });
}
