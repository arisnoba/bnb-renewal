import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

import { Agencies } from './src/collections/Agencies'
import { Castings } from './src/collections/Castings'
import { News } from './src/collections/News'
import { Profiles } from './src/collections/Profiles'
import { Teachers } from './src/collections/Teachers'
import { Users } from './src/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseURL =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  'postgres://postgres:postgres@127.0.0.1:5432/bnb_renewal'

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, './src'),
      importMapFile: path.resolve(
        dirname,
        './src/app/(payload)/admin/importMap.js',
      ),
    },
    user: Users.slug,
  },
  collections: [Users, Teachers, News, Profiles, Castings, Agencies],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, './src/migrations'),
    pool: {
      connectionString: databaseURL,
    },
  }),
  routes: {
    admin: '/admin',
  },
  secret: process.env.PAYLOAD_SECRET ?? 'bnb-renewal-dev-secret',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  typescript: {
    outputFile: path.resolve(dirname, './src/payload-types.ts'),
  },
})
