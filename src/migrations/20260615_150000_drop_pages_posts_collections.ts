import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "pages_id",
      DROP COLUMN IF EXISTS "posts_id";

    DROP TABLE IF EXISTS "_pages_v_rels" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_version_hero_links" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_archive" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_content_columns" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_content" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_cta_links" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_cta" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_media_block" CASCADE;
    DROP TABLE IF EXISTS "_pages_v" CASCADE;

    DROP TABLE IF EXISTS "_posts_v_rels" CASCADE;
    DROP TABLE IF EXISTS "_posts_v_version_populated_authors" CASCADE;
    DROP TABLE IF EXISTS "_posts_v" CASCADE;

    DROP TABLE IF EXISTS "pages_rels" CASCADE;
    DROP TABLE IF EXISTS "pages_hero_links" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_archive" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_content_columns" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_content" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_cta_links" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_cta" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_media_block" CASCADE;
    DROP TABLE IF EXISTS "pages" CASCADE;

    DROP TABLE IF EXISTS "posts_rels" CASCADE;
    DROP TABLE IF EXISTS "posts_populated_authors" CASCADE;
    DROP TABLE IF EXISTS "posts" CASCADE;

    DROP TYPE IF EXISTS "enum__pages_v_blocks_archive_populate_by" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_blocks_archive_relation_to" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_blocks_content_columns_link_appearance" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_blocks_content_columns_link_type" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_blocks_content_columns_size" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_blocks_cta_links_link_appearance" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_blocks_cta_links_link_type" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_version_hero_links_link_appearance" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_version_hero_links_link_type" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_version_hero_type" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_version_status" CASCADE;
    DROP TYPE IF EXISTS "enum__posts_v_version_status" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_blocks_archive_populate_by" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_blocks_archive_relation_to" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_blocks_content_columns_link_appearance" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_blocks_content_columns_link_type" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_blocks_content_columns_size" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_blocks_cta_links_link_appearance" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_blocks_cta_links_link_type" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_hero_links_link_appearance" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_hero_links_link_type" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_hero_type" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_status" CASCADE;
    DROP TYPE IF EXISTS "enum_posts_status" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql``)
}
