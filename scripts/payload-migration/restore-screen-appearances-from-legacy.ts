import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { JSDOM } from 'jsdom'
import { Pool, type PoolClient } from 'pg'

const execFileAsync = promisify(execFile)

type WorkRow = Record<string, unknown>

const columns = [
  'id',
  'source_db',
  'source_id',
  'center',
  'appearance_type',
  'title',
  'body_html',
  'performer_name',
  'class_name',
  'project_title',
  'role_name',
  'air_date_label',
  'profile_image_path',
  'thumbnail_path',
  'published_at',
  'created_at',
  'is_public',
]

const authorNames: Record<string, string> = {
  art: '배우앤배움 아트센터',
  avenue: '배우앤배움 애비뉴센터',
  exam: '배우앤배움 입시센터',
  highteen: '배우앤배움 하이틴센터',
  kids: '배우앤배움 키즈센터',
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const rows = await readRows()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM screen_appearances')

    for (const row of rows) {
      await insertScreenAppearance(client, row)
    }

    await restoreBodyImageLinks(client)
    await restoreProfileLinks(client)
    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('screen_appearances', 'id'),
        (SELECT coalesce(max(id), 1) FROM screen_appearances),
        true
      )
    `)
    await client.query('COMMIT')

    console.log(JSON.stringify({ restoredRows: rows.length }, null, 2))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

async function insertScreenAppearance(client: PoolClient, row: WorkRow) {
  const id = number(row.restore_id)
  const structuredBody = structuredBodyFromHtml(row.body_html)
  const publishedAt = dateText(row.published_at)
  const createdAt = dateText(row.created_at) ?? publishedAt ?? new Date().toISOString()
  const center = requiredText(row.center, 'center')

  await client.query(
    `
      INSERT INTO screen_appearances (
        id,
        appearance_type,
        title,
        performer_name,
        class_name,
        project_title,
        role_name,
        air_date_label,
        profile_image_path,
        thumbnail_path,
        published_at,
        display_status,
        updated_at,
        created_at,
        author_name,
        intro_text,
        actor_input_mode,
        centers
      )
      VALUES (
        $1,
        $2::enum_screen_appearances_appearance_type,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12::enum_screen_appearances_display_status,
        now(),
        $13,
        $14,
        $15,
        'manual'::enum_screen_appearances_actor_input_mode,
        $16::enum_screen_appearances_centers
      )
    `,
    [
      id,
      requiredText(row.appearance_type, 'appearance_type'),
      requiredText(row.title, 'title'),
      text(row.performer_name),
      text(row.class_name),
      text(row.project_title),
      text(row.role_name),
      legacyScreenAppearanceAirDate(row.air_date_label) ?? publishedAt,
      screenAppearanceLocalImagePath(row, 'profile_image_path', 'profile'),
      screenAppearanceLocalImagePath(row, 'thumbnail_path', 'thumbnail'),
      publishedAt,
      displayStatusFromPublic(row.is_public),
      createdAt,
      authorNames[center] ?? authorNames.art,
      structuredBody.introText,
      center,
    ],
  )

  for (let index = 0; index < structuredBody.careerItems.length; index += 1) {
    const item = structuredBody.careerItems[index]

    await client.query(
      `
        INSERT INTO screen_appearances_career_items (
          _order,
          _parent_id,
          id,
          title,
          content
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        index,
        id,
        hashId(`${id}:career:${index}`),
        item.title,
        item.content,
      ],
    )
  }
}

async function restoreBodyImageLinks(client: PoolClient) {
  await client.query(`
    INSERT INTO screen_appearances_body_images (
      _order,
      _parent_id,
      id,
      image_id
    )
    SELECT
      refs.image_index - 1,
      refs.parent_id,
      md5(refs.parent_id::text || ':body-image:' || refs.image_index::text || ':' || refs.media_id::text),
      refs.media_id
    FROM (
      SELECT
        media.id AS media_id,
        (regexp_match(media.prefix, '/([0-9]+)$'))[1]::integer AS parent_id,
        (regexp_match(media.filename, '-([0-9]+)\\.[^.]+$'))[1]::integer AS image_index
      FROM media
      WHERE media.prefix LIKE 'media/screen-appearances/body-images/%'
        AND regexp_match(media.prefix, '/([0-9]+)$') IS NOT NULL
        AND regexp_match(media.filename, '-([0-9]+)\\.[^.]+$') IS NOT NULL
    ) AS refs
    JOIN screen_appearances
      ON screen_appearances.id = refs.parent_id
    ORDER BY refs.parent_id, refs.image_index, refs.media_id
  `)
}

async function restoreProfileLinks(client: PoolClient) {
  await client.query(`
    CREATE OR REPLACE FUNCTION public._screen_appearance_profile_link_name(raw_value text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT nullif(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    coalesce(raw_value, ''),
                    '\\([^)]*\\)',
                    '',
                    'g'
                  ),
                  '（[^）]*）',
                  '',
                  'g'
                ),
                '\\[[^]]*\\]',
                '',
                'g'
              ),
              '[[:space:]]+',
              '',
              'g'
            ),
            '배우$',
            ''
          ),
          '[군양님]$',
          ''
        ),
        ''
      )
    $$;

    WITH profile_candidates AS (
      SELECT
        profiles.id AS profile_id,
        public._screen_appearance_profile_link_name(profiles.name) AS profile_name,
        coalesce(array_agg(profiles_centers.value::text) FILTER (WHERE profiles_centers.value IS NOT NULL), ARRAY[]::text[]) AS profile_centers
      FROM profiles
      LEFT JOIN profiles_centers
        ON profiles_centers.parent_id = profiles.id
      GROUP BY profiles.id, profiles.name
    ),
    screen_tokens AS (
      SELECT
        screen_appearances.id AS screen_id,
        token_rows.ordinality::integer AS token_order,
        public._screen_appearance_profile_link_name(token_rows.token) AS screen_name,
        ARRAY[screen_appearances.centers::text] AS screen_centers
      FROM screen_appearances
      CROSS JOIN LATERAL regexp_split_to_table(
        regexp_replace(
          regexp_replace(coalesce(screen_appearances.performer_name, ''), '\\([^)]*\\)', '', 'g'),
          '（[^）]*）',
          '',
          'g'
        ),
        '[,，/&·ㆍ]|[[:space:]]+외[[:space:]]+|[[:space:]]+및[[:space:]]+'
      ) WITH ORDINALITY AS token_rows(token, ordinality)
    ),
    token_candidates AS (
      SELECT
        screen_tokens.screen_id,
        screen_tokens.token_order,
        profile_candidates.profile_id,
        EXISTS (
          SELECT 1
          FROM unnest(screen_tokens.screen_centers) AS screen_center(value)
          WHERE screen_center.value = 'all'
            OR screen_center.value = ANY (profile_candidates.profile_centers)
            OR 'all' = ANY (profile_candidates.profile_centers)
        ) AS center_matches
      FROM screen_tokens
      JOIN profile_candidates
        ON profile_candidates.profile_name = screen_tokens.screen_name
      WHERE screen_tokens.screen_name IS NOT NULL
    ),
    resolved_tokens AS (
      SELECT
        screen_tokens.screen_id,
        screen_tokens.token_order,
        CASE
          WHEN count(token_candidates.profile_id) FILTER (WHERE token_candidates.center_matches) = 1
            THEN max(token_candidates.profile_id) FILTER (WHERE token_candidates.center_matches)
          WHEN count(token_candidates.profile_id) FILTER (WHERE token_candidates.center_matches) = 0
            AND count(token_candidates.profile_id) = 1
            THEN max(token_candidates.profile_id)
          ELSE NULL
        END AS profile_id
      FROM screen_tokens
      LEFT JOIN token_candidates
        ON token_candidates.screen_id = screen_tokens.screen_id
        AND token_candidates.token_order = screen_tokens.token_order
      WHERE screen_tokens.screen_name IS NOT NULL
      GROUP BY screen_tokens.screen_id, screen_tokens.token_order
    ),
    fully_resolved_screens AS (
      SELECT screen_id
      FROM resolved_tokens
      GROUP BY screen_id
      HAVING count(*) = count(profile_id)
    )
    INSERT INTO screen_appearances_rels (
      "order",
      parent_id,
      path,
      profiles_id
    )
    SELECT
      row_number() OVER (
        PARTITION BY resolved_tokens.screen_id
        ORDER BY resolved_tokens.token_order
      ),
      resolved_tokens.screen_id,
      'linkedProfiles',
      resolved_tokens.profile_id
    FROM resolved_tokens
    JOIN fully_resolved_screens
      ON fully_resolved_screens.screen_id = resolved_tokens.screen_id
    WHERE resolved_tokens.profile_id IS NOT NULL;

    UPDATE screen_appearances
    SET actor_input_mode = CASE
      WHEN EXISTS (
        SELECT 1
        FROM screen_appearances_rels
        WHERE screen_appearances_rels.parent_id = screen_appearances.id
          AND screen_appearances_rels.path = 'linkedProfiles'
      )
        THEN 'profile'::enum_screen_appearances_actor_input_mode
      ELSE 'manual'::enum_screen_appearances_actor_input_mode
    END;

    DROP FUNCTION IF EXISTS public._screen_appearance_profile_link_name(text);
  `)
}

async function readRows(): Promise<WorkRow[]> {
  const jsonPairs = columns
    .flatMap((column) => [`'${column}'`, `\`${column}\``])
    .join(', ')
  const sortJsonPairs = columns
    .filter((column) => column !== 'id')
    .flatMap((column) => [`'${column}'`, `\`${column}\``])
    .join(', ')
  const query = `SELECT JSON_OBJECT(${jsonPairs}) FROM bnb_legacy_work.screen_appearances ORDER BY JSON_OBJECT(${sortJsonPairs})`
  const { stdout } = await execFileAsync(
    'docker',
    [...dockerHostArgs(), 'compose', 'exec', '-T', 'legacy-mariadb', 'mariadb', '-uroot', '-proot', '--batch', '--raw', '--skip-column-names', '--execute', query],
    { maxBuffer: 1024 * 1024 * 128 },
  )

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      ...(JSON.parse(line) as WorkRow),
      restore_id: index + 1,
    }))
}

function structuredBodyFromHtml(value: unknown) {
  const html = text(value)

  if (!html) {
    return {
      careerItems: [] as Array<{ content?: string; title: string }>,
      introText: undefined as string | undefined,
    }
  }

  const { document } = new JSDOM(html).window
  document.querySelectorAll('script, style').forEach((element) => element.remove())
  const lines = cleanLegacyText(document.body.textContent ?? html)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    careerItems: screenAppearanceCareerItemsFromLines(lines),
    introText: screenAppearanceIntroTextFromLines(lines),
  }
}

function screenAppearanceIntroTextFromLines(lines: string[]) {
  return lines.find((line) => /캐스팅\s*되어?\s*출연/.test(line) || /캐스팅되어\s*출연/.test(line))
}

function screenAppearanceCareerItemsFromLines(lines: string[]) {
  const startIndex = lines.findIndex((line) => line === '경력' || line.startsWith('경력'))

  if (startIndex === -1) {
    return []
  }

  const categoryValues = new Set([
    '드라마',
    '영화',
    '독립영화',
    '상업영화',
    '단편영화',
    '웹드라마',
    'CF',
    '광고',
    '방송',
    '예능',
    '연극',
    '뮤지컬',
    '뮤직비디오',
    'MV',
    '기타',
  ])
  const careerItems: Array<{ content?: string; title: string }> = []
  let currentTitle: string | undefined
  let currentLines: string[] = []

  function flushCurrentItem() {
    if (!currentTitle || currentLines.length === 0) {
      return
    }

    careerItems.push({
      title: currentTitle,
      content: currentLines.join('\n'),
    })
  }

  for (const line of lines.slice(startIndex + 1)) {
    if (/캐스팅\s*되어?\s*출연/.test(line) || /캐스팅되어\s*출연/.test(line)) {
      break
    }

    if (/^방영(기간|일자)?\s*:/.test(line) || /^외\s*다수$/.test(line)) {
      continue
    }

    if (categoryValues.has(line)) {
      flushCurrentItem()
      currentTitle = line
      currentLines = []
      continue
    }

    currentLines.push(line)
  }

  flushCurrentItem()

  return careerItems
}

function screenAppearanceLocalImagePath(row: WorkRow, fieldName: string, role: 'profile' | 'thumbnail') {
  const value = text(row[fieldName])

  if (!value) {
    return undefined
  }

  if (value.startsWith('/legacy/screen-appearances/')) {
    return value
  }

  if (
    value.startsWith('/api/') ||
    value.startsWith('/media/') ||
    value.startsWith('/uploads/') ||
    value.startsWith('/_next/')
  ) {
    return value
  }

  if (/^https?:\/\//.test(value) && !value.includes('/web/data/file/new_drama/')) {
    return value
  }

  const fileName = fileBasename(value)

  if (!fileName) {
    return value
  }

  return `/legacy/screen-appearances/${text(row.source_db) || 'baewoo'}/new_drama/${number(row.source_id)}/${role}/${fileName}`
}

function legacyScreenAppearanceAirDate(value: unknown) {
  const trimmed = text(value)

  if (!trimmed) {
    return undefined
  }

  const normalized = trimmed.replace(/^2202(?=[.-])/, '2022').replace(/\.\.+/g, '.')
  const fullYearMatch = normalized.match(/^(\d{4})\s*[.-]\s*(\d{1,2})\s*[.-]\s*(\d{1,2})/)
  const shortYearMatch = normalized.match(/^(\d{2})\s*[.]\s*(\d{1,2})\s*[.]\s*(\d{1,2})/)
  const match = fullYearMatch ?? shortYearMatch

  if (!match) {
    return undefined
  }

  const year = fullYearMatch ? Number(match[1]) : 2000 + Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return undefined
  }

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined
  }

  const date = new Date(Date.UTC(year, month - 1, day))

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return undefined
  }

  return date.toISOString()
}

function cleanLegacyText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

function fileBasename(value: unknown) {
  const current = text(value)

  if (!current) {
    return undefined
  }

  return current.split('/').filter(Boolean).pop()
}

function dateText(value: unknown) {
  return text(value)
}

function displayStatusFromPublic(value: unknown) {
  return value === false || value === 0 || value === '0' || value === 'false'
    ? 'archived'
    : 'published'
}

function hashId(value: string) {
  return createHash('md5').update(value).digest('hex')
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)

  return Number.isFinite(parsed) ? parsed : fallback
}

function requiredText(value: unknown, fieldName: string) {
  const trimmed = text(value)

  if (!trimmed) {
    throw new Error(`${fieldName} 값이 비어 있습니다.`)
  }

  return trimmed
}

function text(value: unknown) {
  const trimmed = String(value ?? '').trim()

  return trimmed || undefined
}

function dockerHostArgs() {
  const configured = process.env.DOCKER_HOST?.trim()

  if (configured) {
    return ['--host', configured]
  }

  const colimaSocket = path.join(os.homedir(), '.colima/default/docker.sock')

  if (existsSync(colimaSocket)) {
    return ['--host', `unix://${colimaSocket}`]
  }

  return []
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
