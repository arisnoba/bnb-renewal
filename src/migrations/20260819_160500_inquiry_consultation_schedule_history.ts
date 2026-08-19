import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp(3) with time zone;

    CREATE TABLE IF NOT EXISTS "inquiries_consultation_history" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "action" varchar NOT NULL,
      "from_scheduled_at" timestamp(3) with time zone,
      "to_scheduled_at" timestamp(3) with time zone,
      "from_status" varchar,
      "to_status" varchar,
      "changed_at" timestamp(3) with time zone NOT NULL,
      "changed_by" varchar NOT NULL,
      "changed_by_id" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'inquiries_consultation_history_parent_id_fk'
      ) THEN
        ALTER TABLE "inquiries_consultation_history"
          ADD CONSTRAINT "inquiries_consultation_history_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."inquiries"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "inquiries_scheduled_at_idx"
      ON "inquiries" USING btree ("scheduled_at");
    CREATE INDEX IF NOT EXISTS "inquiries_consultation_history_order_idx"
      ON "inquiries_consultation_history" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "inquiries_consultation_history_parent_id_idx"
      ON "inquiries_consultation_history" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "inquiries_consultation_history" CASCADE;
    DROP INDEX IF EXISTS "inquiries_scheduled_at_idx";
    ALTER TABLE "inquiries"
      DROP COLUMN IF EXISTS "scheduled_at";
  `)
}
