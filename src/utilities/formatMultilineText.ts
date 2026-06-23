export function formatMultilineText(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}
