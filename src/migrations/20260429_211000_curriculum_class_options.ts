import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "curriculums"
    SET "class_name" = CASE "class_name"
      WHEN '1' THEN '초급 I Class'
      WHEN '2' THEN '중급 R Class'
      WHEN '3' THEN '고급 U Class'
      WHEN '4' THEN '전문 D Class'
      WHEN '5' THEN '배우 A Class'
      WHEN '6' THEN '애비뉴 S Class'
      WHEN '7' THEN '특강반'
      ELSE "class_name"
    END
    WHERE "class_name" IN ('1', '2', '3', '4', '5', '6', '7');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql``)
}
