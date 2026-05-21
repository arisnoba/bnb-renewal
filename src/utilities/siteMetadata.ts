export const defaultSiteTitle = '배우앤배움'

export function getSiteTitle() {
  return process.env.NEXT_PUBLIC_SITE_TITLE?.trim() || defaultSiteTitle
}

export function withSiteTitle(title?: string | null) {
  const siteTitle = getSiteTitle()
  const trimmedTitle = title?.trim()

  return trimmedTitle ? `${trimmedTitle} | ${siteTitle}` : siteTitle
}
