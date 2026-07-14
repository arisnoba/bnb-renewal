import path from 'node:path'

import { getR2ObjectKey, type R2Config } from './r2'

const ADMIN_IMAGE_OBJECT_PREFIX = 'admin-images/'
const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), 'public/uploads/admin-images')
const PUBLIC_UPLOAD_PREFIX = '/uploads/admin-images'

export type AdminImageDeletionTarget =
  | {
      kind: 'local'
      path: string
    }
  | {
      key: string
      kind: 'r2'
    }

export function isAdminImageObjectKey(value: string) {
  if (!value.startsWith(ADMIN_IMAGE_OBJECT_PREFIX) || value.includes('\\')) {
    return false
  }

  return value
    .split('/')
    .every((segment) => Boolean(segment) && segment !== '.' && segment !== '..')
}

export function resolveAdminImageDeletionTarget(
  value: string,
  r2Config?: R2Config,
): AdminImageDeletionTarget | null {
  const objectKey = getR2ObjectKey(value, r2Config)

  if (objectKey) {
    return isAdminImageObjectKey(objectKey)
      ? {
          key: objectKey,
          kind: 'r2',
        }
      : null
  }

  if (!value.startsWith(`${PUBLIC_UPLOAD_PREFIX}/`)) {
    return null
  }

  const relativePath = value
    .slice(PUBLIC_UPLOAD_PREFIX.length + 1)
    .split('/')
    .filter(Boolean)
    .join(path.sep)
  const filePath = path.resolve(LOCAL_UPLOAD_ROOT, relativePath)

  if (!filePath.startsWith(`${LOCAL_UPLOAD_ROOT}${path.sep}`)) {
    return null
  }

  return {
    kind: 'local',
    path: filePath,
  }
}
