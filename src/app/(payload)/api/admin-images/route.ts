import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { NextResponse } from "next/server";

import { getPayloadClient } from "@/lib/payload";
import { deleteR2Object, getR2ObjectKey, uploadR2Object } from "@/lib/r2";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const LOCAL_UPLOAD_ROOT = path.resolve(
  process.cwd(),
  "public/uploads/admin-images",
);
const PUBLIC_UPLOAD_PREFIX = "/uploads/admin-images";
const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

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

function isAllowedImage(file: File) {
  const extension = path.extname(file.name).toLowerCase();

  return file.type.startsWith("image/") && IMAGE_EXTENSIONS.has(extension);
}

function getLocalFilePath(publicPath: string) {
  if (!publicPath.startsWith(`${PUBLIC_UPLOAD_PREFIX}/`)) {
    return null;
  }

  const relativePath = publicPath
    .slice(PUBLIC_UPLOAD_PREFIX.length + 1)
    .split("/")
    .filter(Boolean)
    .join(path.sep);
  const filePath = path.resolve(LOCAL_UPLOAD_ROOT, relativePath);

  if (!filePath.startsWith(`${LOCAL_UPLOAD_ROOT}${path.sep}`)) {
    return null;
  }

  return filePath;
}

function canUseLocalUploadFallback() {
  return process.env.NODE_ENV !== "production";
}

async function saveLocalUploadedFile({
  body,
  contentType,
  fileName,
  storagePath,
}: {
  body: Buffer;
  contentType: string;
  fileName: string;
  storagePath: string;
}) {
  const relativePath = storagePath
    .replace(/^admin-images\//, "")
    .split("/")
    .filter(Boolean);
  const filePath = path.resolve(LOCAL_UPLOAD_ROOT, ...relativePath);

  if (!filePath.startsWith(`${LOCAL_UPLOAD_ROOT}${path.sep}`)) {
    throw new Error("로컬 이미지 저장 경로가 올바르지 않습니다.");
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);

  return {
    contentType,
    fileName,
    path: `${PUBLIC_UPLOAD_PREFIX}/${relativePath.join("/")}`,
    storage: "local",
  };
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

  if (!isAllowedImage(file)) {
    return jsonError("지원하지 않는 이미지 형식입니다.", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonError("이미지는 10MB 이하만 업로드할 수 있습니다.", 400);
  }

  const { month, year } = getStorageDateParts();
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeFileName(
    file.name,
  )}`;
  const storagePath = `admin-images/${year}/${month}/${fileName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  let uploaded: Awaited<ReturnType<typeof uploadR2Object>>;

  try {
    uploaded = await uploadR2Object({
      body: fileBuffer,
      cacheControl: "public, max-age=31536000, immutable",
      contentType: file.type,
      key: storagePath,
    });
  } catch (error) {
    if (canUseLocalUploadFallback()) {
      console.warn(
        "R2 이미지 업로드에 실패해 로컬 저장소로 대체합니다.",
        error,
      );

      return NextResponse.json(
        await saveLocalUploadedFile({
          body: fileBuffer,
          contentType: file.type,
          fileName,
          storagePath,
        }),
      );
    }

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

  const objectKey = getR2ObjectKey(imagePath);

  if (objectKey) {
    try {
      await deleteR2Object(objectKey);
    } catch (error) {
      return logStorageError("R2 이미지 삭제에 실패했습니다.", error);
    }
  } else {
    const localPath = getLocalFilePath(imagePath);

    if (localPath) {
      await unlink(localPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
          throw error;
        }
      });
    }
  }

  return NextResponse.json({ success: true });
}
