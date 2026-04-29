import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

type R2Config = {
  bucket: string;
  publicBaseUrl: string;
};

type UploadR2ObjectInput = {
  body: Buffer | Uint8Array;
  cacheControl?: string;
  contentType: string;
  key: string;
};

let r2Client: S3Client | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`);
  }

  return value;
}

export function getR2Config(): R2Config {
  return {
    bucket: getRequiredEnv("R2_BUCKET"),
    publicBaseUrl: getRequiredEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, ""),
  };
}

function getR2Client() {
  if (!r2Client) {
    r2Client = new S3Client({
      credentials: {
        accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
      },
      endpoint: getRequiredEnv("R2_ENDPOINT").replace(/\/+$/, ""),
      forcePathStyle: true,
      region: "auto",
    });
  }

  return r2Client;
}

export function getR2PublicUrl(objectKey: string, config = getR2Config()) {
  return `${config.publicBaseUrl}/${objectKey}`;
}

export function getR2ObjectKey(value: string, config = getR2Config()) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("admin-images/")) {
    return trimmed;
  }

  try {
    const publicBaseUrl = new URL(config.publicBaseUrl);
    const imageUrl = new URL(trimmed);
    const basePath = publicBaseUrl.pathname.replace(/\/+$/, "");

    if (imageUrl.origin !== publicBaseUrl.origin) {
      return null;
    }

    if (
      basePath &&
      imageUrl.pathname !== basePath &&
      !imageUrl.pathname.startsWith(`${basePath}/`)
    ) {
      return null;
    }

    const objectPath = basePath
      ? imageUrl.pathname.slice(basePath.length + 1)
      : imageUrl.pathname.replace(/^\/+/, "");

    return objectPath ? decodeURIComponent(objectPath) : null;
  } catch {
    return null;
  }
}

export async function uploadR2Object(input: UploadR2ObjectInput) {
  const config = getR2Config();

  await getR2Client().send(
    new PutObjectCommand({
      Body: input.body,
      Bucket: config.bucket,
      CacheControl: input.cacheControl,
      ContentType: input.contentType,
      Key: input.key,
    }),
  );

  return {
    objectKey: input.key,
    publicUrl: getR2PublicUrl(input.key, config),
  };
}

export async function deleteR2Object(objectKey: string) {
  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
    }),
  );
}
