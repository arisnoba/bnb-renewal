import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "news"
      ADD COLUMN IF NOT EXISTS "show_thumbnail_on_detail" boolean DEFAULT true;

    ALTER TABLE "_news_v"
      ADD COLUMN IF NOT EXISTS "version_show_thumbnail_on_detail" boolean DEFAULT true;

    UPDATE "news" AS "target_news"
    SET "show_thumbnail_on_detail" = EXISTS (
      SELECT 1
      FROM "news_centers"
      WHERE "news_centers"."parent_id" = "target_news"."id"
        AND "news_centers"."value"::text = 'highteen'
    );

    UPDATE "_news_v" AS "target_version"
    SET "version_show_thumbnail_on_detail" = EXISTS (
      SELECT 1
      FROM "_news_v_version_centers"
      WHERE "_news_v_version_centers"."parent_id" = "target_version"."id"
        AND "_news_v_version_centers"."value"::text = 'highteen'
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_news_v"
      DROP COLUMN IF EXISTS "version_show_thumbnail_on_detail";

    ALTER TABLE "news"
      DROP COLUMN IF EXISTS "show_thumbnail_on_detail";
  `)
}
