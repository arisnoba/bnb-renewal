import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_screen_appearances_actor_input_mode" AS ENUM (
        'profile',
        'manual'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "screen_appearances"
      ADD COLUMN IF NOT EXISTS "actor_input_mode" varchar;

    ALTER TABLE "screen_appearances"
      ALTER COLUMN "actor_input_mode" DROP DEFAULT,
      ALTER COLUMN "actor_input_mode" DROP NOT NULL,
      ALTER COLUMN "actor_input_mode" TYPE varchar
        USING "actor_input_mode"::varchar;

    UPDATE "screen_appearances"
    SET "actor_input_mode" = CASE
      WHEN EXISTS (
        SELECT 1
        FROM "screen_appearances_rels"
        WHERE "screen_appearances_rels"."parent_id" = "screen_appearances"."id"
          AND "screen_appearances_rels"."path" = 'linkedProfiles'
          AND "screen_appearances_rels"."profiles_id" IS NOT NULL
      ) THEN 'profile'
      ELSE 'manual'
    END;

    ALTER TABLE "screen_appearances"
      ALTER COLUMN "actor_input_mode" DROP DEFAULT,
      ALTER COLUMN "actor_input_mode" TYPE "public"."enum_screen_appearances_actor_input_mode"
        USING "actor_input_mode"::"public"."enum_screen_appearances_actor_input_mode",
      ALTER COLUMN "actor_input_mode" SET DEFAULT 'profile',
      ALTER COLUMN "actor_input_mode" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "screen_appearances"
      ALTER COLUMN "actor_input_mode" DROP DEFAULT,
      ALTER COLUMN "actor_input_mode" DROP NOT NULL,
      ALTER COLUMN "actor_input_mode" TYPE varchar
        USING "actor_input_mode"::varchar,
      DROP COLUMN IF EXISTS "actor_input_mode";

    DROP TYPE IF EXISTS "public"."enum_screen_appearances_actor_input_mode";
  `)
}
