import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      status_column record;
    BEGIN
      FOR status_column IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND column_name = 'display_status'
      LOOP
        EXECUTE format(
          'ALTER TABLE %I ALTER COLUMN display_status DROP NOT NULL',
          status_column.table_name
        );
        EXECUTE format(
          'ALTER TABLE %I ALTER COLUMN display_status SET DEFAULT ''archived''',
          status_column.table_name
        );
      END LOOP;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'teachers'
          AND column_name = 'status'
      ) THEN
        ALTER TABLE "teachers"
          ALTER COLUMN "status" DROP NOT NULL,
          ALTER COLUMN "status" SET DEFAULT 'archived';
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      status_column record;
    BEGIN
      FOR status_column IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND column_name = 'display_status'
      LOOP
        EXECUTE format(
          'UPDATE %I SET display_status = ''published'' WHERE display_status IS NULL',
          status_column.table_name
        );
        EXECUTE format(
          'ALTER TABLE %I ALTER COLUMN display_status SET DEFAULT ''published''',
          status_column.table_name
        );
        EXECUTE format(
          'ALTER TABLE %I ALTER COLUMN display_status SET NOT NULL',
          status_column.table_name
        );
      END LOOP;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'teachers'
          AND column_name = 'status'
      ) THEN
        UPDATE "teachers"
        SET "status" = 'published'
        WHERE "status" IS NULL;

        ALTER TABLE "teachers"
          ALTER COLUMN "status" SET DEFAULT 'published',
          ALTER COLUMN "status" SET NOT NULL;
      END IF;
    END $$;
  `)
}
