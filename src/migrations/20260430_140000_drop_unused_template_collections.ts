import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "categories_rels" CASCADE;
    DROP TABLE IF EXISTS "categories_breadcrumbs" CASCADE;
    DROP TABLE IF EXISTS "categories" CASCADE;
    DROP TABLE IF EXISTS "redirects_rels" CASCADE;
    DROP TABLE IF EXISTS "redirects" CASCADE;
    DROP TABLE IF EXISTS "search_categories" CASCADE;
    DROP TABLE IF EXISTS "search_rels" CASCADE;
    DROP TABLE IF EXISTS "search" CASCADE;

    ALTER TABLE "pages_rels"
      DROP COLUMN IF EXISTS "categories_id";

    ALTER TABLE "_pages_v_rels"
      DROP COLUMN IF EXISTS "categories_id";

    ALTER TABLE "posts_rels"
      DROP COLUMN IF EXISTS "categories_id";

    ALTER TABLE "_posts_v_rels"
      DROP COLUMN IF EXISTS "categories_id";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "categories_id",
      DROP COLUMN IF EXISTS "redirects_id",
      DROP COLUMN IF EXISTS "search_id";

    DROP TYPE IF EXISTS "enum_redirects_to_type";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql``)
}
