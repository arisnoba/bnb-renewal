import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

type UploadPrivateR2ObjectInput = {
  body: Buffer | Uint8Array
  cacheControl?: string
  contentDisposition?: string
  contentType: string
  key: string
}

let privateR2Client: S3Client | null = null

const PRIVATE_R2_ENV_NAMES = [
  'R2_PRIVATE_ACCESS_KEY_ID',
  'R2_PRIVATE_BUCKET',
  'R2_PRIVATE_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
] as const

function getRequiredEnv(name: (typeof PRIVATE_R2_ENV_NAMES)[number]) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`)
  }

  return value
}

function getPrivateR2Client() {
  if (!privateR2Client) {
    privateR2Client = new S3Client({
      credentials: {
        accessKeyId: getRequiredEnv('R2_PRIVATE_ACCESS_KEY_ID'),
        secretAccessKey: getRequiredEnv('R2_PRIVATE_SECRET_ACCESS_KEY'),
      },
      endpoint: getRequiredEnv('R2_ENDPOINT').replace(/\/+$/, ''),
      forcePathStyle: true,
      region: 'auto',
    })
  }

  return privateR2Client
}

function getPrivateR2Bucket() {
  return getRequiredEnv('R2_PRIVATE_BUCKET')
}

export function hasPrivateR2Config() {
  return PRIVATE_R2_ENV_NAMES.every((name) => Boolean(process.env[name]?.trim()))
}

export async function uploadPrivateR2Object(input: UploadPrivateR2ObjectInput) {
  await getPrivateR2Client().send(
    new PutObjectCommand({
      Body: input.body,
      Bucket: getPrivateR2Bucket(),
      CacheControl: input.cacheControl,
      ContentDisposition: input.contentDisposition,
      ContentType: input.contentType,
      Key: input.key,
    }),
  )

  return {
    objectKey: input.key,
  }
}

export async function getPrivateR2Object(objectKey: string) {
  const response = await getPrivateR2Client().send(
    new GetObjectCommand({
      Bucket: getPrivateR2Bucket(),
      Key: objectKey,
    }),
  )
  const body = await response.Body?.transformToByteArray()

  if (!body) {
    throw new Error('비공개 R2 첨부파일 본문이 없습니다.')
  }

  return {
    body,
    contentLength: response.ContentLength,
    contentType: response.ContentType,
  }
}

export async function deletePrivateR2Object(objectKey: string) {
  await getPrivateR2Client().send(
    new DeleteObjectCommand({
      Bucket: getPrivateR2Bucket(),
      Key: objectKey,
    }),
  )
}

export function destroyPrivateR2Client() {
  privateR2Client?.destroy()
  privateR2Client = null
}
