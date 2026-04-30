import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { ko } from 'payload/i18n/ko'
import sharp from 'sharp'

import { Agencies } from './src/collections/Agencies'
import { ArtistPress } from './src/collections/ArtistPress'
import { AuditionSchedules } from './src/collections/AuditionSchedules'
import { CastingAppearances } from './src/collections/CastingAppearances'
import { CastingDirectors } from './src/collections/CastingDirectors'
import { Curriculums } from './src/collections/Curriculums'
import { ExamPassedReviews } from './src/collections/ExamPassedReviews'
import { ExamPassedVideos } from './src/collections/ExamPassedVideos'
import { ExamResults } from './src/collections/ExamResults'
import { ExamSchoolLogos } from './src/collections/ExamSchoolLogos'
import { Media } from './src/collections/Media'
import { News } from './src/collections/News'
import { Pages } from './src/collections/Pages'
import { Posts } from './src/collections/Posts'
import { Profiles } from './src/collections/Profiles'
import { ScreenAppearances } from './src/collections/ScreenAppearances'
import { Teachers } from './src/collections/Teachers'
import { Users } from './src/collections/Users'
import { applyAdminTimestampFields } from './src/collections/adminTimestampFields'
import { Footer } from './src/Footer/config'
import { Header } from './src/Header/config'
import { defaultLexical } from './src/fields/defaultLexical'
import { plugins } from './src/plugins'

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
    dateFormat: 'yyyy-MM-dd HH:mm',
    importMap: {
      baseDir: path.resolve(dirname, './src'),
      importMapFile: path.resolve(
        dirname,
        './src/app/(payload)/admin/importMap.js',
      ),
    },
    user: Users.slug,
  },
  i18n: {
    fallbackLanguage: 'ko',
    supportedLanguages: {
      ko,
    },
    translations: {
      ko: {
        general: {
          createdAt: '등록일',
          updatedAt: '수정일',
        },
      },
    },
  },
  collections: applyAdminTimestampFields([
    Users,
    Pages,
    Posts,
    Media,
    Teachers,
    Curriculums,
    News,
    Profiles,
    Agencies,
    ArtistPress,
    AuditionSchedules,
    CastingDirectors,
    CastingAppearances,
    ScreenAppearances,
    ExamPassedReviews,
    ExamPassedVideos,
    ExamResults,
    ExamSchoolLogos,
  ]),
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, './src/migrations'),
    pool: {
      connectionString: databaseURL,
    },
  }),
  editor: defaultLexical,
  globals: [Header, Footer],
  plugins,
  routes: {
    admin: '/admin',
  },
  secret: process.env.PAYLOAD_SECRET ?? 'bnb-renewal-dev-secret',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, './src/payload-types.ts'),
  },
})
