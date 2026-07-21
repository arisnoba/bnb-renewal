import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { buildConfig } from 'payload'
import { ko } from 'payload/i18n/ko'
import sharp from 'sharp'

import { Agencies } from './src/collections/Agencies'
import { ArtistPress } from './src/collections/ArtistPress'
import { ArtistPressAgencies } from './src/collections/ArtistPressAgencies'
import { AuditionSchedules } from './src/collections/AuditionSchedules'
import { BroadcastStations } from './src/collections/BroadcastStations'
import { CastingAppearances } from './src/collections/CastingAppearances'
import { CastingDirectors } from './src/collections/CastingDirectors'
import { Classrooms } from './src/collections/Classrooms'
import { Curriculums } from './src/collections/Curriculums'
import { DirectCastings } from './src/collections/DirectCastings'
import { ExamPassedReviews } from './src/collections/ExamPassedReviews'
import { ExamPassedVideos } from './src/collections/ExamPassedVideos'
import { ExamResults } from './src/collections/ExamResults'
import { ExamSchoolLogos } from './src/collections/ExamSchoolLogos'
import { Faqs } from './src/collections/Faqs'
import { Histories } from './src/collections/Histories'
import { MainBanners } from './src/collections/MainBanners'
import { Media } from './src/collections/Media'
import { News } from './src/collections/News'
import { Profiles } from './src/collections/Profiles'
import { ScreenAppearances } from './src/collections/ScreenAppearances'
import { SocialLinks } from './src/collections/SocialLinks'
import { StarCards } from './src/collections/StarCards'
import { Teachers } from './src/collections/Teachers'
import { Terms } from './src/collections/Terms'
import { Users } from './src/collections/Users'
import {
  applyGlobalMasterAdminAPITab,
  applyMasterAdminAPITab,
} from './src/collections/adminAPITab'
import { applyAdminCenterListFilter } from './src/collections/adminCenterListFilter'
import { applyFriendlyAdminErrorMessages } from './src/collections/adminErrorMessages'
import { applyAdminListSelectOptimization } from './src/collections/adminListSelectOptimization'
import {
  applyAdminSaveLoadingOverlay,
  applyGlobalAdminSaveLoadingOverlay,
} from './src/collections/adminSaveLoadingOverlay'
import { applyAdminTimestampFields } from './src/collections/adminTimestampFields'
import { applyReliableBulkEndpoints } from './src/collections/reliableBulkEndpoints'
import { Footer } from './src/Footer/config'
import { Main } from './src/Main/config'
import { MainStatistics } from './src/Main/Statistics'
import { SiteSettings } from './src/SiteSettings/config'
import { defaultLexical } from './src/fields/defaultLexical'
import { plugins } from './src/plugins'
import { HighteenSpecialClasses } from './src/collections/HighteenSpecialClasses'
import { Inquiries } from './src/collections/Inquiries'
import {
  resolvePayloadDatabaseIdleTimeoutMillis,
  resolvePayloadDatabasePoolMax,
  resolvePayloadDatabaseURL,
} from './src/lib/payloadDatabaseURL'
import { payloadPostgres } from './src/lib/payloadPostgres'
import { resolvePayloadSecret } from './src/lib/payloadSecret'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseURL = resolvePayloadDatabaseURL()
const databasePoolMax = resolvePayloadDatabasePoolMax()
const databaseIdleTimeoutMillis = resolvePayloadDatabaseIdleTimeoutMillis()

export default buildConfig({
  admin: {
    components: {
      afterNavLinks: ['@/components/payload/AdminGuideNavLink#AdminGuideNavLink'],
      afterLogin: ['@/components/payload/AdminPasswordHelp#AdminLoginPasswordHelp'],
      graphics: {
        Logo: '@/components/payload/AdminLoginLogo#AdminLoginLogo',
      },
      views: {
        guide: {
          Component: '@/components/payload/AdminGuideView#AdminGuideView',
          exact: true,
          meta: {
            description: '배우앤배움 통합 사이트 관리자 사용 가이드',
            title: '관리자 사용 가이드',
          },
          path: '/guide',
        },
      },
    },
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
        error: {
          followingFieldsInvalid_one: '입력한 내용을 확인해 주세요:',
          followingFieldsInvalid_other: '입력한 내용을 확인해 주세요:',
          noFilesUploaded: '업로드할 파일을 선택해 주세요.',
          valueMustBeUnique: '이미 등록된 값입니다.',
        },
        'plugin-seo': {
          charactersLeftOver: '{{characters}} 자 남음',
        },
      },
    },
  },
  collections: applyMasterAdminAPITab(
    applyReliableBulkEndpoints(
      applyAdminCenterListFilter(
        applyAdminListSelectOptimization(
          applyAdminTimestampFields(
            applyAdminSaveLoadingOverlay([
              MainBanners,
              SocialLinks,
              Histories,
              Terms,
              Teachers,
              Curriculums,
              Classrooms,
              HighteenSpecialClasses,
              Agencies,
              AuditionSchedules,
              CastingDirectors,
              DirectCastings,
              CastingAppearances,
              ScreenAppearances,
              BroadcastStations,
              Profiles,
              ArtistPress,
              ArtistPressAgencies,
              ExamPassedReviews,
              ExamPassedVideos,
              ExamResults,
              ExamSchoolLogos,
              News,
              Faqs,
              StarCards,
              Inquiries,
              Users,
              Media,
            ]),
          ),
        ),
      ),
    ),
  ),
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, './src/migrations'),
    pg: payloadPostgres,
    pool: {
      connectionString: databaseURL,
      idleTimeoutMillis: databaseIdleTimeoutMillis,
      max: databasePoolMax,
    },
  }),
  editor: defaultLexical,
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY ?? '',
    defaultFromAddress: 'no-reply@baewooenm.com',
    defaultFromName: '배우앤배움',
  }),
  hooks: {
    afterError: [applyFriendlyAdminErrorMessages],
  },
  globals: applyGlobalMasterAdminAPITab(
    applyGlobalAdminSaveLoadingOverlay([Main, MainStatistics, Footer, SiteSettings]),
  ),
  maxDepth: 3,
  plugins,
  routes: {
    admin: '/admin',
  },
  secret: resolvePayloadSecret(),
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, './src/payload-types.ts'),
  },
})
