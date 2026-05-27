import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'inquiries'
          AND column_name = 'birth_date'
          AND udt_name <> 'varchar'
      ) THEN
        ALTER TABLE "inquiries"
          ALTER COLUMN "birth_date" TYPE varchar
          USING to_char("birth_date", 'YYYYMMDD');
      END IF;
    END $$;

    ALTER TABLE "inquiries"
      ALTER COLUMN "preferred_date" SET DEFAULT now();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ALTER COLUMN "preferred_date" DROP DEFAULT,
      ALTER COLUMN "birth_date" TYPE timestamp(3) with time zone
      USING CASE
        WHEN "birth_date" ~ '^[0-9]{8}$'
          THEN to_date("birth_date", 'YYYYMMDD')::timestamp(3) with time zone
        ELSE null
      END;
  `)
}
