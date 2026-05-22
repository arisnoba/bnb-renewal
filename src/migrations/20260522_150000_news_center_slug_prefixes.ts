import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "news"
    SET "slug" = CASE
      WHEN "slug" LIKE 'news-bnbhighteen-%' THEN regexp_replace("slug", '^news-bnbhighteen-', 'news-highteen-')
      WHEN "slug" LIKE 'news-kidscenter-%' THEN regexp_replace("slug", '^news-kidscenter-', 'news-kids-')
      WHEN "slug" LIKE 'news-bnbuniv-%' THEN regexp_replace("slug", '^news-bnbuniv-', 'news-exam-')
      WHEN "slug" LIKE 'news-baewoo-%' THEN regexp_replace("slug", '^news-baewoo-', 'news-art-')
      ELSE "slug"
    END
    WHERE "slug" LIKE 'news-bnbhighteen-%'
      OR "slug" LIKE 'news-kidscenter-%'
      OR "slug" LIKE 'news-bnbuniv-%'
      OR "slug" LIKE 'news-baewoo-%';

    UPDATE "_news_v"
    SET "version_slug" = CASE
      WHEN "version_slug" LIKE 'news-bnbhighteen-%' THEN regexp_replace("version_slug", '^news-bnbhighteen-', 'news-highteen-')
      WHEN "version_slug" LIKE 'news-kidscenter-%' THEN regexp_replace("version_slug", '^news-kidscenter-', 'news-kids-')
      WHEN "version_slug" LIKE 'news-bnbuniv-%' THEN regexp_replace("version_slug", '^news-bnbuniv-', 'news-exam-')
      WHEN "version_slug" LIKE 'news-baewoo-%' THEN regexp_replace("version_slug", '^news-baewoo-', 'news-art-')
      ELSE "version_slug"
    END
    WHERE "version_slug" LIKE 'news-bnbhighteen-%'
      OR "version_slug" LIKE 'news-kidscenter-%'
      OR "version_slug" LIKE 'news-bnbuniv-%'
      OR "version_slug" LIKE 'news-baewoo-%';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "news"
    SET "slug" = CASE
      WHEN "slug" LIKE 'news-highteen-%' THEN regexp_replace("slug", '^news-highteen-', 'news-bnbhighteen-')
      WHEN "slug" LIKE 'news-kids-%' THEN regexp_replace("slug", '^news-kids-', 'news-kidscenter-')
      WHEN "slug" LIKE 'news-exam-%' THEN regexp_replace("slug", '^news-exam-', 'news-bnbuniv-')
      WHEN "slug" LIKE 'news-art-%' THEN regexp_replace("slug", '^news-art-', 'news-baewoo-')
      ELSE "slug"
    END
    WHERE "slug" LIKE 'news-highteen-%'
      OR "slug" LIKE 'news-kids-%'
      OR "slug" LIKE 'news-exam-%'
      OR "slug" LIKE 'news-art-%';

    UPDATE "_news_v"
    SET "version_slug" = CASE
      WHEN "version_slug" LIKE 'news-highteen-%' THEN regexp_replace("version_slug", '^news-highteen-', 'news-bnbhighteen-')
      WHEN "version_slug" LIKE 'news-kids-%' THEN regexp_replace("version_slug", '^news-kids-', 'news-kidscenter-')
      WHEN "version_slug" LIKE 'news-exam-%' THEN regexp_replace("version_slug", '^news-exam-', 'news-bnbuniv-')
      WHEN "version_slug" LIKE 'news-art-%' THEN regexp_replace("version_slug", '^news-art-', 'news-baewoo-')
      ELSE "version_slug"
    END
    WHERE "version_slug" LIKE 'news-highteen-%'
      OR "version_slug" LIKE 'news-kids-%'
      OR "version_slug" LIKE 'news-exam-%'
      OR "version_slug" LIKE 'news-art-%';
  `)
}
