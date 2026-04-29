type SlugifyArgs = {
  valueToSlugify?: unknown
}

export function koreanSlugify({ valueToSlugify }: SlugifyArgs) {
  return String(valueToSlugify ?? '')
    .trim()
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createKoreanSlugifyWithFallback(prefix: string) {
  return (args: SlugifyArgs) => {
    const slug = koreanSlugify(args)

    if (slug) {
      return slug
    }

    const now = new Date()
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('')
    const suffix = Math.random().toString(36).slice(2, 6)

    return `${prefix}-${date}-${suffix}`
  }
}
