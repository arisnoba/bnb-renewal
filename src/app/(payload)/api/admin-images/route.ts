import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getPayloadClient } from "@/lib/payload";

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

function isVercelBlobUrl(value: string) {
  try {
    return new URL(value).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(storagePath, file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: file.type,
    });

    return NextResponse.json({
      fileName,
      path: blob.url,
      storage: "blob",
    });
  }

  const localDir = path.join(LOCAL_UPLOAD_ROOT, year, month);
  const localPath = path.join(localDir, fileName);
  const publicPath = `${PUBLIC_UPLOAD_PREFIX}/${year}/${month}/${fileName}`;

  await mkdir(localDir, { recursive: true });
  await writeFile(localPath, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    fileName,
    path: publicPath,
    storage: "local",
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

  if (process.env.BLOB_READ_WRITE_TOKEN && isVercelBlobUrl(imagePath)) {
    await del(imagePath);
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
