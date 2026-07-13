import type { Footer as FooterData } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'

export async function getFooterData(): Promise<FooterData | null> {
  try {
    return await getCachedGlobal('footer', 0)()
  } catch {
    return null
  }
}
