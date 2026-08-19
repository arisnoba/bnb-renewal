import type { CenterSlug } from './centers'
import { centerPublicHref } from './centerDomains'

const legacyFaqPaths = [
  {
    pattern: /(?:https?:\/\/[^\s)]+)?\/web\/html\/manage_list\.php\?mid=entertain/gi,
    target: '/entertainment',
  },
  {
    pattern: /(?:https?:\/\/[^\s)]+)?\/web\/html\/teacher_list\.php\?mid=teacher/gi,
    target: '/teachers',
  },
  {
    pattern: /(?:https?:\/\/[^\s)]+)?\/web\/html\/class_curriculum\.php/gi,
    target: '/curriculum',
  },
] as const

export function normalizeFaqAnswer(answer: string, center: CenterSlug) {
  return legacyFaqPaths.reduce(
    (normalized, item) => normalized.replace(item.pattern, centerPublicHref(center, item.target)),
    answer.replace(/\b02-1577-9929\b/g, '1577-9929')
  )
}
