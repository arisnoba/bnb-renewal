import { RootPage } from '@payloadcms/next/views'

import config from '../../../../../payload.config'
import { importMap } from '../importMap.js'

export default function PayloadAdminPage({
  params,
  searchParams,
}: {
  params?: Promise<{ segments?: string[] }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const normalizedParams = Promise.resolve(params).then((value) => ({
    segments: value?.segments ?? [],
  }))
  const normalizedSearchParams = Promise.resolve(searchParams ?? {}).then((value) =>
    Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
    ) as { [key: string]: string | string[] },
  )

  return RootPage({
    config,
    importMap,
    params: normalizedParams,
    searchParams: normalizedSearchParams,
  })
}
