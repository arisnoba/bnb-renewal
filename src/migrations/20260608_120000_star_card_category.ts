import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_star_cards_category" AS ENUM(
        'health',
        'profile',
        'medical',
        'hairMakeup',
        'beauty',
        'cafe'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "star_cards"
      ADD COLUMN IF NOT EXISTS "category" "enum_star_cards_category";

    UPDATE "star_cards"
    SET "category" = CASE
      WHEN "slug" IN ('humake-fitness-nonhyeon') THEN 'health'::"enum_star_cards_category"
      WHEN "slug" IN ('baewoohwa') THEN 'profile'::"enum_star_cards_category"
      WHEN "slug" IN (
        'ck-st-mary-eye-clinic',
        'gangnam-miline-dental',
        'gangnam-gentle-dental',
        'claire-dental-clinic',
        'jerim-plastic-surgery',
        'chloen-plastic-surgery',
        'rejuel-clinic-gangnam',
        'motential-clinic',
        'the-areumdaun-clinic',
        'vlif-plastic-surgery',
        'sipjangsaeng-korean-medicine',
        'oda-korean-medicine-gangnam'
      ) THEN 'medical'::"enum_star_cards_category"
      WHEN "slug" IN (
        'soonsoo',
        'muah',
        'yoning',
        'jungsaemmool-inspiration',
        'maven-by-bumho',
        'de-black-mens-hair'
      ) THEN 'hairMakeup'::"enum_star_cards_category"
      WHEN "slug" IN ('rhinoceros-optical', 'glow-beauty') THEN 'beauty'::"enum_star_cards_category"
      WHEN "slug" IN ('dearmeal', 'the-venti', 'dank-coffee', 'addictive', 're-and') THEN 'cafe'::"enum_star_cards_category"
      ELSE "category"
    END
    WHERE "category" IS NULL;

    CREATE INDEX IF NOT EXISTS "star_cards_category_idx"
      ON "star_cards" USING btree ("category");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "star_cards_category_idx";

    ALTER TABLE "star_cards"
      DROP COLUMN IF EXISTS "category";

    DROP TYPE IF EXISTS "public"."enum_star_cards_category";
  `)
}
