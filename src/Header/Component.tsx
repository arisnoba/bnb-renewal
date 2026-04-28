import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import type { Header as HeaderType } from '@/payload-types'

export async function Header() {
  const headerData = await getCachedGlobal('header', 1)().catch(
    () => ({ navItems: [] }) as unknown as HeaderType,
  )

  return <HeaderClient data={headerData} />
}
