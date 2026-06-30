import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { centerOptions } from '@/collections/shared'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    revalidateTag('global_footer', 'max')

    for (const option of centerOptions) {
      const path = `/${option.value}`

      payload.logger.info(`Revalidating footer path ${path}`)
      revalidatePath(path, 'page')
    }
  }

  return doc
}
