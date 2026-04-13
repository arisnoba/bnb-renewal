import { RootPage } from '@payloadcms/next/views'

import config from '../../../../../payload.config'
import { importMap } from '../importMap.js'

export default function PayloadAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const normalizedSearchParams = searchParams.then((value) =>
    Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
    ) as { [key: string]: string | string[] },
  )

  return RootPage({
    config,
    importMap,
    params,
    searchParams: normalizedSearchParams,
  })
}
