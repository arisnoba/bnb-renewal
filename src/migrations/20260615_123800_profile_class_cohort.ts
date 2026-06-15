import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles"
      ADD COLUMN IF NOT EXISTS "class_name" varchar,
      ADD COLUMN IF NOT EXISTS "cohort" varchar;

    ALTER TABLE "_profiles_v"
      ADD COLUMN IF NOT EXISTS "version_class_name" varchar,
      ADD COLUMN IF NOT EXISTS "version_cohort" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_profiles_v"
      DROP COLUMN IF EXISTS "version_class_name",
      DROP COLUMN IF EXISTS "version_cohort";

    ALTER TABLE "profiles"
      DROP COLUMN IF EXISTS "class_name",
      DROP COLUMN IF EXISTS "cohort";
  `);
}
