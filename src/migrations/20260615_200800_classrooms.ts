import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "classrooms" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "classrooms_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'classrooms_rels_parent_fk'
      ) THEN
        ALTER TABLE "classrooms_rels"
          ADD CONSTRAINT "classrooms_rels_parent_fk"
          FOREIGN KEY ("parent_id")
          REFERENCES "public"."classrooms"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'classrooms_rels_media_fk'
      ) THEN
        ALTER TABLE "classrooms_rels"
          ADD CONSTRAINT "classrooms_rels_media_fk"
          FOREIGN KEY ("media_id")
          REFERENCES "public"."media"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "classrooms_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_classrooms_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_classrooms_fk"
          FOREIGN KEY ("classrooms_id")
          REFERENCES "public"."classrooms"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "classrooms_created_at_idx"
      ON "classrooms" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "classrooms_updated_at_idx"
      ON "classrooms" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "classrooms_rels_order_idx"
      ON "classrooms_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "classrooms_rels_parent_idx"
      ON "classrooms_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "classrooms_rels_path_idx"
      ON "classrooms_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "classrooms_rels_media_id_idx"
      ON "classrooms_rels" USING btree ("media_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_classrooms_id_idx"
      ON "payload_locked_documents_rels" USING btree ("classrooms_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_classrooms_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_classrooms_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "classrooms_id";

    DROP TABLE IF EXISTS "classrooms_rels" CASCADE;
    DROP TABLE IF EXISTS "classrooms" CASCADE;
  `)
}
