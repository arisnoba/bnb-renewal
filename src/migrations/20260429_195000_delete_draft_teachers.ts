import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "teachers"
    WHERE "status" = 'draft';
  `)
}

export async function down(): Promise<void> {
  // Deleted draft teacher records are not reconstructable from schema alone.
}
