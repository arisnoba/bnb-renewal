import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION pg_temp.normalize_screen_appearance_image_path(
      image_path varchar,
      source_db varchar,
      source_id numeric,
      image_role varchar
    )
    RETURNS varchar AS $$
    DECLARE
      trimmed varchar;
      file_name varchar;
    BEGIN
      trimmed := btrim(coalesce(image_path, ''));

      IF trimmed = '' THEN
        RETURN image_path;
      END IF;

      IF trimmed ~ '^/legacy/screen-appearances/' THEN
        RETURN trimmed;
      END IF;

      IF trimmed ~ '^/(api|media|uploads|_next)/' THEN
        RETURN trimmed;
      END IF;

      IF source_id IS NULL THEN
        RETURN trimmed;
      END IF;

      IF trimmed ~ '^(https?:)?//' AND trimmed !~ '/web/data/file/new_drama/' THEN
        RETURN trimmed;
      END IF;

      file_name := regexp_replace(split_part(trimmed, '?', 1), '^.*/', '');

      IF file_name = '' THEN
        RETURN trimmed;
      END IF;

      RETURN '/legacy/screen-appearances/'
        || COALESCE(NULLIF(source_db, ''), 'baewoo')
        || '/new_drama/'
        || source_id
        || '/'
        || image_role
        || '/'
        || file_name;
    END
    $$ LANGUAGE plpgsql IMMUTABLE;

    CREATE OR REPLACE FUNCTION pg_temp.screen_appearance_lexical_body(
      body_html varchar
    )
    RETURNS jsonb AS $$
    DECLARE
      clean_text text;
      children jsonb;
      image_index integer := 0;
      image_nodes jsonb := '[]'::jsonb;
      image_src text;
      normalized_image_src text;
      text_nodes jsonb;
    BEGIN
      clean_text := regexp_replace(coalesce(body_html, ''), '<script[^>]*>.*?</script>', ' ', 'gis');
      clean_text := regexp_replace(clean_text, '<style[^>]*>.*?</style>', ' ', 'gis');
      clean_text := regexp_replace(clean_text, '<br\\s*/?>', E'\\n', 'gi');
      clean_text := regexp_replace(clean_text, '</p\\s*>', E'\\n', 'gi');
      clean_text := regexp_replace(clean_text, '<[^>]+>', ' ', 'g');
      clean_text := replace(clean_text, '&nbsp;', ' ');
      clean_text := replace(clean_text, '&amp;', '&');
      clean_text := replace(clean_text, '&lt;', '<');
      clean_text := replace(clean_text, '&gt;', '>');
      clean_text := replace(clean_text, '&quot;', '"');
      clean_text := replace(clean_text, '&#39;', '''');
      clean_text := regexp_replace(clean_text, E'[\\r\\t]+', ' ', 'g');
      clean_text := regexp_replace(clean_text, E' *\\n+ *', E'\\n', 'g');
      clean_text := regexp_replace(clean_text, E'[ ]{2,}', ' ', 'g');
      clean_text := btrim(clean_text);

      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'type',
            'paragraph',
            'format',
            '',
            'indent',
            0,
            'version',
            1,
            'direction',
            'ltr',
            'children',
            jsonb_build_array(
              jsonb_build_object(
                'type',
                'text',
                'version',
                1,
                'text',
                line,
                'format',
                0,
                'style',
                '',
                'mode',
                'normal',
                'detail',
                0
              )
            )
          )
        ),
        '[]'::jsonb
      )
      INTO text_nodes
      FROM regexp_split_to_table(clean_text, E'\\n+') AS line
      WHERE btrim(line) <> '';

      FOR image_src IN
        SELECT match[1]
        FROM regexp_matches(coalesce(body_html, ''), '<img[^>]+src=["'']?([^"'' >]+)', 'gi') AS match
      LOOP
        image_index := image_index + 1;
        normalized_image_src := btrim(image_src);

        IF normalized_image_src ~ '^//' THEN
          normalized_image_src := 'https:' || normalized_image_src;
        ELSIF normalized_image_src ~ '^/' THEN
          normalized_image_src := 'https://www.baewoo.co.kr' || normalized_image_src;
        ELSIF normalized_image_src !~ '^https?://' THEN
          normalized_image_src := 'https://www.baewoo.co.kr/' || regexp_replace(normalized_image_src, '^\\.?/', '');
        ELSIF normalized_image_src ~ '^http://' THEN
          normalized_image_src := regexp_replace(normalized_image_src, '^http://', 'https://');
        END IF;

        image_nodes := image_nodes || jsonb_build_array(
          jsonb_build_object(
            'type',
            'paragraph',
            'format',
            '',
            'indent',
            0,
            'version',
            1,
            'direction',
            'ltr',
            'children',
            jsonb_build_array(
              jsonb_build_object(
                'type',
                'upload',
                'version',
                3,
                'format',
                '',
                'id',
                'screen-appearance-body-image-' || image_index,
                'pending',
                jsonb_build_object(
                  'formID',
                  'screen-appearance-body-image-' || image_index,
                  'src',
                  normalized_image_src
                )
              )
            )
          )
        );
      END LOOP;

      children := text_nodes || image_nodes;

      IF children = '[]'::jsonb THEN
        RETURN NULL;
      END IF;

      RETURN jsonb_build_object(
        'root',
        jsonb_build_object(
          'type',
          'root',
          'format',
          '',
          'indent',
          0,
          'version',
          1,
          'children',
          children,
          'direction',
          'ltr'
        )
      );
    END
    $$ LANGUAGE plpgsql IMMUTABLE;

    DO $$
    DECLARE
      body_type text;
      has_body_html boolean;
    BEGIN
      SELECT data_type INTO body_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'screen_appearances'
        AND column_name = 'body';

      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'screen_appearances'
          AND column_name = 'body_html'
      ) INTO has_body_html;

      IF body_type IS NULL THEN
        ALTER TABLE "screen_appearances"
          ADD COLUMN "body" jsonb;
      ELSIF body_type <> 'jsonb' THEN
        ALTER TABLE "screen_appearances"
          ALTER COLUMN "body" TYPE jsonb
          USING pg_temp.screen_appearance_lexical_body("body"::varchar);
      END IF;

      IF has_body_html THEN
        EXECUTE '
          UPDATE "screen_appearances"
          SET "body" = COALESCE(
            "body",
            pg_temp.screen_appearance_lexical_body("body_html")
          )
        ';
      END IF;
    END $$;

    UPDATE "screen_appearances"
    SET
      "profile_image_path" = pg_temp.normalize_screen_appearance_image_path(
        "profile_image_path",
        "source_db",
        "source_id",
        'profile'
      ),
      "thumbnail_path" = pg_temp.normalize_screen_appearance_image_path(
        "thumbnail_path",
        "source_db",
        "source_id",
        'thumbnail'
      );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "screen_appearances"
    SET
      "profile_image_path" = CASE
        WHEN "profile_image_path" LIKE '/legacy/screen-appearances/%'
          THEN concat(
            '/web/data/file/new_drama/',
            regexp_replace(split_part("profile_image_path", '?', 1), '^.*/', '')
          )
        ELSE "profile_image_path"
      END,
      "thumbnail_path" = CASE
        WHEN "thumbnail_path" LIKE '/legacy/screen-appearances/%'
          THEN concat(
            '/web/data/file/new_drama/',
            regexp_replace(split_part("thumbnail_path", '?', 1), '^.*/', '')
          )
        ELSE "thumbnail_path"
      END;

    ALTER TABLE "screen_appearances"
      DROP COLUMN IF EXISTS "body";
  `)
}
