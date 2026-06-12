import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "screen_appearances"
      ALTER COLUMN "appearance_type" TYPE varchar
        USING "appearance_type"::varchar;

    DROP TYPE IF EXISTS "public"."enum_screen_appearances_appearance_type";

    CREATE TYPE "public"."enum_screen_appearances_appearance_type" AS ENUM (
      'drama',
      'movie',
      'commercial'
    );

    UPDATE "screen_appearances"
    SET "appearance_type" = 'movie'
    WHERE coalesce("project_title", "title", '') ~* '(단편영화|영화)';

    UPDATE "screen_appearances"
    SET "appearance_type" = 'drama'
    WHERE "appearance_type" IS NULL
      OR "appearance_type" NOT IN ('drama', 'movie', 'commercial');

    UPDATE "screen_appearances"
    SET "project_title" = btrim(coalesce(
      nullif(substring("project_title" from '\\[([^][]+)\\]\\s*$'), ''),
      nullif(substring("project_title" from '''([^'']+)''\\s*$'), ''),
      CASE
        WHEN "project_title" ~ '^\\s*\\[(광고|공익광고|지면광고)\\]\\s*.+'
          THEN nullif(btrim(regexp_replace("project_title", '^\\s*\\[[^][]+\\]\\s*', '')), '')
        WHEN "project_title" ~ '^\\s*\\[[^][]+\\]'
          THEN nullif(substring("project_title" from '^\\s*\\[([^][]+)\\]'), '')
        ELSE NULL
      END,
      "project_title"
    ))
    WHERE "project_title" ~ '\\[[^][]+\\]\\s*$'
       OR "project_title" ~ '''[^'']+''\\s*$'
       OR "project_title" ~ '^\\s*\\[[^][]+\\]';

    ALTER TABLE "screen_appearances"
      ALTER COLUMN "appearance_type" TYPE "public"."enum_screen_appearances_appearance_type"
        USING "appearance_type"::"public"."enum_screen_appearances_appearance_type";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "screen_appearances"
      ALTER COLUMN "appearance_type" TYPE varchar
        USING "appearance_type"::varchar;

    UPDATE "screen_appearances"
    SET "appearance_type" = 'drama'
    WHERE "appearance_type" = 'movie'
       OR "appearance_type" IS NULL
       OR "appearance_type" NOT IN ('drama', 'commercial');

    DROP TYPE IF EXISTS "public"."enum_screen_appearances_appearance_type";

    CREATE TYPE "public"."enum_screen_appearances_appearance_type" AS ENUM (
      'drama',
      'commercial'
    );

    ALTER TABLE "screen_appearances"
      ALTER COLUMN "appearance_type" TYPE "public"."enum_screen_appearances_appearance_type"
        USING "appearance_type"::"public"."enum_screen_appearances_appearance_type";
  `)
}
