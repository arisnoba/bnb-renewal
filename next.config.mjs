import { withPayload } from '@payloadcms/next/withPayload'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { redirects } from './redirects.mjs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const r2PublicBaseURL = process.env.R2_PUBLIC_BASE_URL || ''

function remotePatternFromURL(value) {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)

    return {
      hostname: url.hostname,
      pathname: url.pathname === '/' ? undefined : `${url.pathname.replace(/\/+$/, '')}/**`,
      protocol: url.protocol.replace(':', ''),
    }
  } catch {
    return null
  }
}

const remotePatterns = [
  remotePatternFromURL(serverURL),
  remotePatternFromURL(r2PublicBaseURL),
  {
    hostname: 'img.youtube.com',
    pathname: '/vi/**',
    protocol: 'https',
  },
].filter(Boolean)

function localNetworkDevOrigins() {
  if (process.env.NODE_ENV === 'production') {
    return []
  }

  const configuredOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const networkOrigins = Object.values(networkInterfaces())
    .flatMap((interfaces) => interfaces ?? [])
    .filter((networkInterface) => networkInterface.family === 'IPv4' && !networkInterface.internal)
    .map((networkInterface) => networkInterface.address)

  return [...new Set([...configuredOrigins, ...networkOrigins])]
}

const allowedDevOrigins = localNetworkDevOrigins()

const limitVercelStaticGenerationConcurrency = process.env.VERCEL === '1'
const experimentalConfig = {
  staleTimes: {
    dynamic: 0,
    static: 30,
  },
  ...(limitVercelStaticGenerationConcurrency
    ? {
        cpus: 1,
        staticGenerationMaxConcurrency: 1,
        staticGenerationMinPagesPerWorker: 1000,
      }
    : {}),
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  experimental: experimentalConfig,
  images: {
    localPatterns: [
      {
        pathname: '/assets/footer/**',
      },
      {
        pathname: '/assets/common/**',
      },
      {
        pathname: '/assets/hero/**',
      },
      {
        pathname: '/assets/gate/**',
      },
      {
        pathname: '/assets/map/**',
      },
      {
        pathname: '/assets/casting-system/**',
      },
      {
        pathname: '/assets/casting/**',
      },
      {
        pathname: '/assets/artist-care/**',
      },
      {
        pathname: '/assets/center-about/**',
      },
      {
        pathname: '/assets/company/**',
      },
      {
        pathname: '/assets/profile-production/**',
      },
      {
        pathname: '/assets/exam-management/**',
      },
      {
        pathname: '/assets/exam-results/**',
      },
      {
        pathname: '/assets/special-system/**',
      },
      {
        pathname: '/assets/facilities/**',
      },
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/media/**',
      },
      {
        pathname: '/legacy/**',
      },
    ],
    qualities: [100],
    remotePatterns,
  },
  reactStrictMode: true,
  redirects,
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
