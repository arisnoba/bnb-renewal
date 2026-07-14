function contentSecurityPolicy() {
  const developmentScriptSources = process.env.NODE_ENV === 'production'
    ? []
    : ["'unsafe-eval'", 'http://oapi.map.naver.com', 'http://*.map.naver.net']
  const developmentConnectSources = process.env.NODE_ENV === 'production' ? [] : ['ws:', 'wss:']
  const developmentImageSources = process.env.NODE_ENV === 'production'
    ? []
    : ['http://static.naver.net', 'http://*.map.naver.net']

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline' ${developmentScriptSources.join(' ')} https://challenges.cloudflare.com https://oapi.map.naver.com https://*.map.naver.net https://cdn.vercel-insights.com https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https: ${developmentImageSources.join(' ')}`,
    "font-src 'self' data:",
    `connect-src 'self' ${developmentConnectSources.join(' ')} https://challenges.cloudflare.com https://oapi.map.naver.com https://*.naver.com https://*.pstatic.net https://*.navercorp.com https://vitals.vercel-insights.com`,
    "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ]
    .map((directive) => directive.replace(/\s+/g, ' ').trim())
    .join('; ')
}

export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy(),
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=()',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
]
