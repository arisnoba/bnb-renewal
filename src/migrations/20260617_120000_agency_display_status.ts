import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const publishedAgencySubjects = [
  'SM C&C',
  'YG',
  '하이브',
  '미스틱 엔터테인먼트',
  '사람 엔터테인먼트',
  '매니지먼트 숲',
  '판타지오 엔터테인먼트',
  '씨제스 엔터테인먼트',
  '제이와이드컴퍼니',
  '에스팀 엔터테인먼트',
  'FN 엔터테인먼트',
  '에이스 팩토리',
  '매니지먼트 구',
  '레인컴퍼니',
  '울림 엔터테인먼트',
  '51K 엔터테인먼트',
  'SWMP',
  '레드라인 엔터테인먼트',
  '비스터스 엔터테인먼트',
  '럭키 컴퍼니',
  '디원스 엔터테인먼트',
  '케이스타 엔터테인먼트',
  '오리진 엔터테인먼트',
  '지트리 크리에이티브',
  '마루기획',
  '서브라임 아티스트 에이전시',
  '아디아 엔터테인먼트',
  '스타잇 엔터테인먼트',
  '위 엔터테인먼트',
  '아이오케이 엔터테인먼트',
  '젠스타즈',
  '신 엔터테인먼트',
  '래몽래인 엔터테인먼트',
  '한아름컴퍼니',
  '에이픽 엔터테인먼트',
  '에프엘이엔티',
  '엘줄라이엔터테인먼트',
  '에이투지엔터테인먼트',
  '엘리펀이엔티',
  '디에이와이엔터테인먼트',
  '포스타컴퍼니',
  '메이저나인',
  '엔터세븐 엔터테인먼트',
  '글로벌이앤비',
  '와이블룸엔터테인먼트',
  '셀트리온 엔터테인먼트',
  '해피페이스 엔터테인먼트',
  '디어이엔티',
  '토탈셋',
  'AIMC',
  '스튜디오252',
  '어라운드어스',
  '동이컴퍼니',
  '주피터엔터테인먼트',
  '마지끄',
  '앨컴퍼니',
]

function publishedAgencySubjectValues() {
  return sql.raw(
    publishedAgencySubjects
      .map((subject) => `('${subject.replace(/'/g, "''")}')`)
      .join(',\n        '),
  )
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'enum_agencies_display_status'
      ) THEN
        CREATE TYPE "public"."enum_agencies_display_status"
          AS ENUM('draft', 'published', 'archived');
      END IF;
    END $$;

    ALTER TABLE "agencies"
      ADD COLUMN IF NOT EXISTS "display_status" "public"."enum_agencies_display_status"
      DEFAULT 'archived';

    UPDATE "agencies"
    SET "display_status" = 'archived';
  `)

  await db.execute(sql`
    UPDATE "agencies"
    SET "display_status" = 'published'
    FROM (
      VALUES
        ${publishedAgencySubjectValues()}
    ) AS "published_agencies"("subject")
    WHERE "agencies"."subject" = "published_agencies"."subject";
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "agencies_display_status_idx"
      ON "agencies" USING btree ("display_status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "agencies_display_status_idx";

    ALTER TABLE "agencies"
      DROP COLUMN IF EXISTS "display_status";

    DROP TYPE IF EXISTS "public"."enum_agencies_display_status";
  `)
}
