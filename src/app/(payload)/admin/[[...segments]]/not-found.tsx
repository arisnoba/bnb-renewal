import { NotFoundPage } from '@payloadcms/next/views'

import config from '../../../../../payload.config'
import { importMap } from '../importMap.js'

export default function PayloadAdminNotFound({
  params,
  searchParams,
}: {
  params:
    | Promise<{ segments: string[] }>
    | { segments: string[] }
    | undefined
  searchParams:
    | Promise<{ [key: string]: string | string[] | undefined }>
    | { [key: string]: string | string[] | undefined }
    | undefined
}) {
  const normalizedParams = Promise.resolve(params ?? { segments: [] })
  const normalizedSearchParams = Promise.resolve(searchParams ?? {}).then((value) =>
    Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
    ) as { [key: string]: string | string[] },
  )

  return NotFoundPage({
    config,
    importMap,
    params: normalizedParams,
    searchParams: normalizedSearchParams,
  })
}
