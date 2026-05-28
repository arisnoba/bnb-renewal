import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ADD COLUMN IF NOT EXISTS "attachment_file_name" varchar,
      ADD COLUMN IF NOT EXISTS "attachment_url" varchar,
      ADD COLUMN IF NOT EXISTS "attachment_object_key" varchar;

    DROP INDEX IF EXISTS "inquiries_attachment_media_idx";
    ALTER TABLE "inquiries"
      DROP CONSTRAINT IF EXISTS "inquiries_attachment_media_id_media_id_fk";
    ALTER TABLE "inquiries"
      DROP COLUMN IF EXISTS "attachment_media_id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ADD COLUMN IF NOT EXISTS "attachment_media_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inquiries_attachment_media_id_media_id_fk'
      ) THEN
        ALTER TABLE "inquiries"
          ADD CONSTRAINT "inquiries_attachment_media_id_media_id_fk"
          FOREIGN KEY ("attachment_media_id")
          REFERENCES "public"."media"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "inquiries_attachment_media_idx"
      ON "inquiries" USING btree ("attachment_media_id");

    ALTER TABLE "inquiries"
      DROP COLUMN IF EXISTS "attachment_file_name",
      DROP COLUMN IF EXISTS "attachment_url",
      DROP COLUMN IF EXISTS "attachment_object_key";
  `)
}
