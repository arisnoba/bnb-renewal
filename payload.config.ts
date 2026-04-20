import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

import { Appearances } from './src/collections/Appearances'
import { AppearancesExtra } from './src/collections/AppearancesExtra'
import { Agencies } from './src/collections/Agencies'
import { Banners } from './src/collections/Banners'
import { Castings } from './src/collections/Castings'
import { Lineups } from './src/collections/Lineups'
import { Movies } from './src/collections/Movies'
import { News } from './src/collections/News'
import { Profiles } from './src/collections/Profiles'
import { StarCards } from './src/collections/StarCards'
import { TeacherFiles } from './src/collections/TeacherFiles'
import { Teachers } from './src/collections/Teachers'
import { Users } from './src/collections/Users'
import { VideoCastings } from './src/collections/VideoCastings'

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
  collections: [
    Users,
    Teachers,
    News,
    Profiles,
    Castings,
    Agencies,
    VideoCastings,
    Banners,
    TeacherFiles,
    Lineups,
    Movies,
    Appearances,
    AppearancesExtra,
    StarCards,
  ],
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
