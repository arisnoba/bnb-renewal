import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers_representative_works"
      ADD COLUMN IF NOT EXISTS "poster_media_id" integer;

    ALTER TABLE "_teachers_v_version_representative_works"
      ADD COLUMN IF NOT EXISTS "poster_media_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "teachers_representative_works"
        ADD CONSTRAINT "teachers_representative_works_poster_media_id_media_id_fk"
        FOREIGN KEY ("poster_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "_teachers_v_version_representative_works"
        ADD CONSTRAINT "_teachers_v_version_representative_works_poster_media_id_media_id_fk"
        FOREIGN KEY ("poster_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "teachers_representative_works_poster_media_idx"
      ON "teachers_representative_works" USING btree ("poster_media_id");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_representative_works_poster_media_idx"
      ON "_teachers_v_version_representative_works" USING btree ("poster_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_teachers_v_version_representative_works_poster_media_idx";
    DROP INDEX IF EXISTS "teachers_representative_works_poster_media_idx";

    ALTER TABLE "_teachers_v_version_representative_works"
      DROP CONSTRAINT IF EXISTS "_teachers_v_version_representative_works_poster_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "poster_media_id";

    ALTER TABLE "teachers_representative_works"
      DROP CONSTRAINT IF EXISTS "teachers_representative_works_poster_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "poster_media_id";
  `)
}
