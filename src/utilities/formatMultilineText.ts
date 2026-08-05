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

export function formatCommaSeparatedText(value: string | null | undefined) {
  return formatMultilineText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n')
}
