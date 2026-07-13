import { HeaderClient } from './Component.client'
import React from 'react'

import { getFooterData } from '@/Footer/data'
import { familySitesFromFooter } from '@/Footer/familySites'

export async function Header() {
  const footer = await getFooterData()

  return <HeaderClient familySites={familySitesFromFooter(footer)} />
}
