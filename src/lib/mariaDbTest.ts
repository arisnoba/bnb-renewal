import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type MariaDbTestCollection = {
	description: string;
	href: string;
	label: string;
	slug: string;
	sql: string;
	table: string;
};

export type MariaDbTestRow = {
	id: string;
	imagePath: string;
	meta1: string;
	meta2: string;
	meta3: string;
	slug: string;
	sourceDb: string;
	sourceId: string;
	sourceTable: string;
	title: string;
	relatedFiles: MariaDbRelatedFile[];
};

export type MariaDbRelatedFile = {
	displayOrder: string;
	imagePath: string;
	sourceDb: string;
	sourceId: string;
	sourceTable: string;
	title: string;
};

export type MariaDbRowsOptions = {
	center?: 'all' | 'art' | 'exam' | 'highteen' | 'kids';
};

const baseColumns = `
  CAST(id AS CHAR) AS id,
  COALESCE(slug, '') AS slug,
  COALESCE(source_db, '') AS source_db,
  COALESCE(source_table, '') AS source_table,
  CAST(COALESCE(source_id, '') AS CHAR) AS source_id
`;

function localLegacyAssetPath({
	boTable,
	collection,
	path,
	role,
	sourceDb = 'source_db',
	sourceId = 'source_id',
}: {
	boTable: string;
	collection: string;
	path: string;
	role: string;
	sourceDb?: string;
	sourceId?: string;
}) {
	return `
      CASE
        WHEN NULLIF(TRIM(COALESCE(${path}, '')), '') IS NULL THEN ''
        ELSE CONCAT(
          '/legacy/${collection}/',
          ${sourceDb},
          '/',
          ${boTable},
          '/',
          ${sourceId},
          '/${role}/',
          SUBSTRING_INDEX(COALESCE(${path}, ''), '/', -1)
        )
      END
    `;
}

export const mariaDbTestCollections = [
	{
		description: '통합 강사 목록과 대표 이미지 원본 경로',
		href: '/test/mariadb/teachers',
		label: 'Teachers',
		slug: 'teachers',
		table: 'teachers',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(name, '') AS title,
        COALESCE(centers, '') AS meta1,
        COALESCE(status, '') AS meta2,
        CAST(display_order AS CHAR) AS meta3,
        COALESCE(profile_image_path, photo_image1, '') AS image_path
      FROM bnb_legacy_work.teachers
      ORDER BY IF(status = 'published', 0, 1), display_order ASC, id ASC
      LIMIT 100
    `,
	},
	//   {
	//     description: '강사 대표작/첨부파일 연결 상태',
	//     href: '/test/mariadb/teacher-files',
	//     label: 'Teacher Files',
	//     slug: 'teacher-files',
	//     table: 'teacher_files',
	//     sql: `
	//       SELECT
	//         ${baseColumns},
	//         COALESCE(title, '') AS title,
	//         COALESCE(resolved_teacher_name, '') AS meta1,
	//         CAST(COALESCE(teacher_source_id, '') AS CHAR) AS meta2,
	//         CAST(display_order AS CHAR) AS meta3,
	//         CASE
	//           WHEN COALESCE(file_path, '') = '' THEN ''
	//           ELSE CONCAT('/legacy/teacher-files/', source_db, '/', source_table, '/', file_path)
	//         END AS image_path
	//       FROM bnb_legacy_work.teacher_files
	//       ORDER BY display_order ASC, id ASC
	//       LIMIT 100
	//     `,
	//   },
	{
		description: '강사 레슨 연결 상태',
		href: '/test/mariadb/teacher-lessons',
		label: 'Teacher Lessons',
		slug: 'teacher-lessons',
		table: 'teacher_lessons',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(teacher_name, subject, title_raw, '') AS title,
        COALESCE(category, '') AS meta1,
        COALESCE(resolved_teacher_slug, '') AS meta2,
        CAST(COALESCE(resolved_teacher_id, '') AS CHAR) AS meta3,
        '' AS image_path
      FROM bnb_legacy_work.teacher_lessons
      ORDER BY id ASC
      LIMIT 100
    `,
	},
	{
		description: '에이전시 통합 결과',
		href: '/test/mariadb/agencies',
		label: 'Agencies',
		slug: 'agencies',
		table: 'agencies',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(subject, name, '') AS title,
        COALESCE(name, '') AS meta1,
        CAST(display_order AS CHAR) AS meta2,
        '' AS meta3,
        ${localLegacyAssetPath({
			boTable: "'g5_agency'",
			collection: 'agencies',
			path: 'profile_image_path',
			role: 'profile',
		})} AS image_path
      FROM bnb_legacy_work.agencies
      ORDER BY display_order ASC, id ASC
      LIMIT 100
    `,
	},
	{
		description: '아트센터 출신아티스트 활동/기사 목록',
		href: '/test/mariadb/artist-press',
		label: 'Artist Press',
		slug: 'artist-press',
		table: 'artist_press',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(title, '') AS title,
        COALESCE(actor_name, '') AS meta1,
        COALESCE(generation, '') AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        CASE
          WHEN NULLIF(TRIM(COALESCE(thumbnail_url, '')), '') IS NOT NULL THEN ${localLegacyAssetPath({
			boTable: "'new_shoot'",
			collection: 'artist-press',
			path: 'thumbnail_url',
			role: 'thumbnail',
		})}
          ELSE ${localLegacyAssetPath({
			boTable: "'new_shoot'",
			collection: 'artist-press',
			path: 'agency_logo_path',
			role: 'agency-logo',
		})}
        END AS image_path
      FROM bnb_legacy_work.artist_press
      ORDER BY published_at DESC, id DESC
      LIMIT 100
    `,
	},
	{
		description: '프로필 1차 통합 결과',
		href: '/test/mariadb/profiles',
		label: 'Profiles',
		slug: 'profiles',
		table: 'profiles',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(name, '') AS title,
        COALESCE(center, '') AS meta1,
        COALESCE(filter, '') AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        '' AS image_path
      FROM bnb_legacy_work.profiles
      ORDER BY published_at DESC, id DESC
      LIMIT 100
    `,
	},
	{
		description: '오디션/촬영 일정 통합 결과',
		href: '/test/mariadb/audition-schedules',
		label: 'Audition Schedules',
		slug: 'audition-schedules',
		table: 'audition_schedules',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(title, '') AS title,
        COALESCE(centers, '') AS meta1,
        COALESCE(event_type, '') AS meta2,
        CONCAT(COALESCE(schedule_start_date, ''), ' ~ ', COALESCE(schedule_end_date, '')) AS meta3,
        '' AS image_path
      FROM bnb_legacy_work.audition_schedules
      ORDER BY schedule_start_date DESC, id DESC
      LIMIT 100
    `,
	},
	{
		description: '드라마/광고 출연장면 통합 결과',
		href: '/test/mariadb/screen-appearances',
		label: 'Screen Appearances',
		slug: 'screen-appearances',
		table: 'screen_appearances',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(title, '') AS title,
        COALESCE(performer_name, '') AS meta1,
        CONCAT(COALESCE(project_title, ''), ' / ', COALESCE(role_name, '')) AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        CASE
          WHEN NULLIF(TRIM(COALESCE(thumbnail_path, '')), '') IS NOT NULL THEN ${localLegacyAssetPath({
			boTable: "'new_drama'",
			collection: 'screen-appearances',
			path: 'thumbnail_path',
			role: 'thumbnail',
		})}
          ELSE ${localLegacyAssetPath({
			boTable: "'new_drama'",
			collection: 'screen-appearances',
			path: 'profile_image_path',
			role: 'profile',
		})}
        END AS image_path
      FROM bnb_legacy_work.screen_appearances
      ORDER BY published_at DESC, id DESC
      LIMIT 100
    `,
	},
	{
		description: '진행중인 캐스팅 출연현황 통합 결과',
		href: '/test/mariadb/casting-appearances',
		label: 'Casting Appearances',
		slug: 'casting-appearances',
		table: 'casting_appearances',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(title, '') AS title,
        COALESCE(center, '') AS meta1,
        CONCAT(COALESCE(broadcaster, ''), ' / ', COALESCE(casting_status, '')) AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        ${localLegacyAssetPath({
			boTable: "'new_appear'",
			collection: 'casting-appearances',
			path: 'thumbnail_path',
			role: 'thumbnail',
		})} AS image_path
      FROM bnb_legacy_work.casting_appearances
      ORDER BY published_at DESC, id DESC
      LIMIT 100
    `,
	},
	{
		description: '캐스팅 담당자 통합 결과와 public 이미지',
		href: '/test/mariadb/castings',
		label: 'Castings',
		slug: 'castings',
		table: 'castings',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(person_name, '') AS title,
        COALESCE(company, '') AS meta1,
        COALESCE(centers, '') AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        COALESCE((
          SELECT CONCAT('/legacy/castings/', castings.source_db, '/', file_sources.bo_table, '/', castings.source_id, '/', file_sources.bf_file)
          FROM (
            SELECT 'baewoo' AS source_db, bo_table, wr_id, bf_no, bf_file FROM baewoo.g5_board_file
            UNION ALL
            SELECT 'bnbuniv', bo_table, wr_id, bf_no, bf_file FROM bnbuniv.g5_board_file
            UNION ALL
            SELECT 'kidscenter', bo_table, wr_id, bf_no, bf_file FROM kidscenter.g5_board_file
            UNION ALL
            SELECT 'bnbhighteen', bo_table, wr_id, bf_no, bf_file FROM bnbhighteen.g5_board_file
          ) AS file_sources
          WHERE file_sources.source_db = castings.source_db
            AND file_sources.bo_table = REPLACE(castings.source_table, 'g5_write_', '')
            AND file_sources.wr_id = castings.source_id
          ORDER BY file_sources.bf_no ASC
          LIMIT 1
        ), '') AS image_path
      FROM bnb_legacy_work.castings
      ORDER BY company ASC, person_name ASC
      LIMIT 100
    `,
	},
	{
		description: '입시 합격영상 통합 결과',
		href: '/test/mariadb/exam-passed-videos',
		label: 'Exam Passed Videos',
		slug: 'exam-passed-videos',
		table: 'exam_passed_videos',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(title, '') AS title,
        COALESCE(youtube_code, '') AS meta1,
        COALESCE(youtube_url, '') AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        COALESCE((
          SELECT CONCAT('/legacy/exam-passed-videos/', videos.source_db, '/', file_sources.bo_table, '/', videos.source_id, '/', file_sources.bf_file)
          FROM (
            SELECT 'baewoo' AS source_db, bo_table, wr_id, bf_no, bf_file FROM baewoo.g5_board_file
            UNION ALL
            SELECT 'bnbuniv', bo_table, wr_id, bf_no, bf_file FROM bnbuniv.g5_board_file
            UNION ALL
            SELECT 'kidscenter', bo_table, wr_id, bf_no, bf_file FROM kidscenter.g5_board_file
            UNION ALL
            SELECT 'bnbhighteen', bo_table, wr_id, bf_no, bf_file FROM bnbhighteen.g5_board_file
          ) AS file_sources
          WHERE file_sources.source_db = videos.source_db
            AND file_sources.bo_table = REPLACE(videos.source_table, 'g5_write_', '')
            AND file_sources.wr_id = videos.source_id
            AND NULLIF(TRIM(file_sources.bf_file), '') IS NOT NULL
          ORDER BY file_sources.bf_no ASC
          LIMIT 1
        ), '') AS image_path
      FROM bnb_legacy_work.exam_passed_videos
      AS videos
      ORDER BY published_at DESC, id DESC
      LIMIT 100
    `,
	},
	{
		description: '입시 합격후기 통합 결과',
		href: '/test/mariadb/exam-passed-reviews',
		label: 'Exam Passed Reviews',
		slug: 'exam-passed-reviews',
		table: 'exam_passed_reviews',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(title, '') AS title,
        COALESCE(school_name, '') AS meta1,
        COALESCE(school_logo_slug, '') AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        CASE
          WHEN NULLIF(TRIM(COALESCE(student_image_path, '')), '') IS NOT NULL THEN ${localLegacyAssetPath({
			boTable: "'new_hoogi'",
			collection: 'exam-passed-reviews',
			path: 'student_image_path',
			role: 'student',
		})}
          ELSE ${localLegacyAssetPath({
			boTable: "'new_hoogi'",
			collection: 'exam-passed-reviews',
			path: 'school_logo_path',
			role: 'school-logo',
		})}
        END AS image_path
      FROM bnb_legacy_work.exam_passed_reviews
      ORDER BY published_at DESC, id DESC
      LIMIT 100
    `,
	},
	{
		description: '입시 학교 로고 마스터',
		href: '/test/mariadb/exam-school-logos',
		label: 'Exam School Logos',
		slug: 'exam-school-logos',
		table: 'exam_school_logos',
		sql: `
      SELECT
        CAST(id AS CHAR) AS id,
        COALESCE(school_slug, '') AS slug,
        '' AS source_db,
        'exam_school_logos' AS source_table,
        CAST(id AS CHAR) AS source_id,
        COALESCE(school_name, '') AS title,
        COALESCE(logo_original_name, '') AS meta1,
        CAST(review_count AS CHAR) AS meta2,
        CONCAT(COALESCE(logo_width, ''), 'x', COALESCE(logo_height, '')) AS meta3,
        ${localLegacyAssetPath({
			boTable: "'new_hoogi'",
			collection: 'exam-school-logos',
			path: 'logo_path',
			role: 'logo',
			sourceDb: "'bnbuniv'",
			sourceId: 'id',
		})} AS image_path
      FROM bnb_legacy_work.exam_school_logos
      ORDER BY school_name ASC, id ASC
      LIMIT 100
    `,
	},
	{
		description: '입시 합격현황 통합 결과',
		href: '/test/mariadb/exam-results',
		label: 'Exam Results',
		slug: 'exam-results',
		table: 'exam_results',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(title, '') AS title,
        COALESCE(result_type, '') AS meta1,
        COALESCE(center, '') AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        ${localLegacyAssetPath({
			boTable: `
            CASE
              WHEN source_table = 'g5_write_victory10' THEN 'victory10'
              WHEN source_table = 'g5_write_victory30' THEN 'victory30'
              ELSE REPLACE(source_table, 'g5_write_', '')
            END
          `,
			collection: 'exam-results',
			path: 'COALESCE(thumbnail_path, thumbnail_url, \'\')',
			role: 'thumbnail',
		})} AS image_path
      FROM bnb_legacy_work.exam_results
      ORDER BY published_at DESC, id DESC
      LIMIT 100
    `,
	},
	{
		description: '센터별 NEWS&NOTICE 통합 결과',
		href: '/test/mariadb/news',
		label: 'News',
		slug: 'news',
		table: 'news',
		sql: `
      SELECT
        ${baseColumns},
        COALESCE(title, '') AS title,
        COALESCE(center, '') AS meta1,
        COALESCE(category, '') AS meta2,
        CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
        COALESCE(thumbnail_local_path, '') AS image_path
      FROM bnb_legacy_work.news
      ORDER BY published_at DESC, id DESC
      LIMIT 100
    `,
	},
] satisfies MariaDbTestCollection[];

export function getMariaDbTestCollection(slug: string) {
	return mariaDbTestCollections.find(collection => collection.slug === slug);
}

export async function getMariaDbCounts() {
	const sql = mariaDbTestCollections.map(collection => `SELECT '${collection.slug}' AS slug, COUNT(*) AS total FROM bnb_legacy_work.${collection.table}`).join(' UNION ALL ');
	const lines = await runMariaDbQuery(sql);

	return Object.fromEntries(
		lines.map(line => {
			const [slug, total] = line.split('\t');
			return [slug, Number(total)];
		})
	) as Record<string, number>;
}

export async function getMariaDbRows(collection: MariaDbTestCollection, options: MariaDbRowsOptions = {}) {
	const sql =
		collection.slug === 'teachers'
			? buildTeacherSql(options.center ?? 'all')
			: collection.slug === 'profiles'
				? buildProfileSql(options.center ?? 'all')
					: collection.slug === 'news'
						? buildNewsSql(options.center ?? 'all')
						: collection.slug === 'screen-appearances'
							? buildScreenAppearanceSql(options.center ?? 'all')
							: collection.slug === 'casting-appearances'
								? buildCastingAppearanceSql(options.center ?? 'all')
								: collection.sql;
	const lines = await runMariaDbQuery(sql);
	const rows = lines.map(parseRow);

	if (collection.slug === 'teachers') {
		return attachTeacherFiles(rows);
	}

	return rows;
}

function buildTeacherSql(center: MariaDbRowsOptions['center']) {
	const centerFilter = center && center !== 'all' ? center : undefined;
	const whereSql = centerFilter ? `WHERE status = 'published' AND JSON_CONTAINS(centers, JSON_QUOTE('${centerFilter}'))` : `WHERE status = 'published'`;
	const orderSql = `ORDER BY IF(status = 'published', 0, 1), display_order ASC, id ASC`;

	return `
    SELECT
      ${baseColumns},
      COALESCE(name, '') AS title,
      COALESCE(centers, '') AS meta1,
      COALESCE(status, '') AS meta2,
      CAST(display_order AS CHAR) AS meta3,
      CASE
        WHEN COALESCE(profile_image_path, photo_image1, '') = '' THEN ''
        ELSE CONCAT(
          'legacy/teachers/',
          source_db,
          '/',
          source_table,
          '/',
          COALESCE(profile_image_path, photo_image1, '')
        )
      END AS image_path
    FROM bnb_legacy_work.teachers
    ${whereSql}
    ${orderSql}
    LIMIT 100
  `;
}

function buildProfileSql(center: MariaDbRowsOptions['center']) {
	const centerFilter = center && center !== 'all' ? center : undefined;
	const whereSql = centerFilter ? `WHERE profiles.center = '${centerFilter}'` : '';

	return `
    SELECT
      ${baseColumns},
      COALESCE(name, '') AS title,
      COALESCE(center, '') AS meta1,
      COALESCE(filter, '') AS meta2,
      CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
      COALESCE((
        SELECT CONCAT('/legacy/profiles/', profiles.source_db, '/', REPLACE(profiles.source_table, 'g5_write_', ''), '/', profiles.source_id, '/', file_sources.bf_file)
        FROM (
          SELECT 'baewoo' AS source_db, bo_table, wr_id, bf_no, bf_file FROM baewoo.g5_board_file
          UNION ALL
          SELECT 'bnbuniv', bo_table, wr_id, bf_no, bf_file FROM bnbuniv.g5_board_file
          UNION ALL
          SELECT 'kidscenter', bo_table, wr_id, bf_no, bf_file FROM kidscenter.g5_board_file
          UNION ALL
          SELECT 'bnbhighteen', bo_table, wr_id, bf_no, bf_file FROM bnbhighteen.g5_board_file
        ) AS file_sources
        WHERE file_sources.source_db = profiles.source_db
          AND file_sources.bo_table = REPLACE(profiles.source_table, 'g5_write_', '')
          AND file_sources.wr_id = profiles.source_id
          AND NULLIF(TRIM(file_sources.bf_file), '') IS NOT NULL
        ORDER BY file_sources.bf_no ASC
        LIMIT 1
      ), '') AS image_path
    FROM bnb_legacy_work.profiles
    ${whereSql}
    ORDER BY published_at DESC, id DESC
    LIMIT 100
  `;
}

function buildNewsSql(center: MariaDbRowsOptions['center']) {
	const centerFilter = center && center !== 'all' ? center : undefined;
	const whereSql = centerFilter ? `WHERE center = '${centerFilter}'` : '';

	return `
    SELECT
      ${baseColumns},
      COALESCE(title, '') AS title,
      COALESCE(center, '') AS meta1,
      COALESCE(category, '') AS meta2,
      CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
      COALESCE(thumbnail_local_path, '') AS image_path
    FROM bnb_legacy_work.news
    ${whereSql}
    ORDER BY published_at DESC, id DESC
    LIMIT 100
  `;
}

function buildScreenAppearanceSql(center: MariaDbRowsOptions['center']) {
	const centerFilter = center && center !== 'all' ? center : undefined;
	const whereSql = centerFilter ? `WHERE center = '${centerFilter}'` : '';

	return `
    SELECT
      ${baseColumns},
      COALESCE(title, '') AS title,
      COALESCE(performer_name, '') AS meta1,
      CONCAT(COALESCE(project_title, ''), ' / ', COALESCE(role_name, '')) AS meta2,
      CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
      CASE
        WHEN NULLIF(TRIM(COALESCE(thumbnail_path, '')), '') IS NOT NULL THEN ${localLegacyAssetPath({
			boTable: "'new_drama'",
			collection: 'screen-appearances',
			path: 'thumbnail_path',
			role: 'thumbnail',
		})}
        ELSE ${localLegacyAssetPath({
			boTable: "'new_drama'",
			collection: 'screen-appearances',
			path: 'profile_image_path',
			role: 'profile',
		})}
      END AS image_path
    FROM bnb_legacy_work.screen_appearances
    ${whereSql}
    ORDER BY published_at DESC, id DESC
    LIMIT 100
  `;
}

function buildCastingAppearanceSql(center: MariaDbRowsOptions['center']) {
	const centerFilter = center && center !== 'all' ? center : undefined;
	const whereSql = centerFilter ? `WHERE center = '${centerFilter}'` : '';

	return `
    SELECT
      ${baseColumns},
      COALESCE(title, '') AS title,
      COALESCE(center, '') AS meta1,
      CONCAT(COALESCE(broadcaster, ''), ' / ', COALESCE(casting_status, '')) AS meta2,
      CAST(COALESCE(published_at, '') AS CHAR) AS meta3,
      ${localLegacyAssetPath({
			boTable: "'new_appear'",
			collection: 'casting-appearances',
			path: 'thumbnail_path',
			role: 'thumbnail',
		})} AS image_path
    FROM bnb_legacy_work.casting_appearances
    ${whereSql}
    ORDER BY published_at DESC, id DESC
    LIMIT 100
  `;
}

async function runMariaDbQuery(sql: string) {
	const { stdout } = await execFileAsync('docker', ['compose', 'exec', '-T', 'legacy-mariadb', 'mariadb', '-uroot', '-proot', '--batch', '--raw', '--skip-column-names', '-e', sql], {
		maxBuffer: 1024 * 1024 * 10,
	});

	return stdout
		.split('\n')
		.map(line => line.trimEnd())
		.filter(Boolean);
}

async function attachTeacherFiles(rows: MariaDbTestRow[]) {
	const teacherIds = rows.map(row => Number(row.id)).filter(id => Number.isInteger(id) && id > 0);

	if (teacherIds.length === 0) {
		return rows;
	}

	const sql = `
    SELECT
      CAST(resolved_teacher_id AS CHAR) AS teacher_id,
      COALESCE(title, '') AS title,
      CASE
        WHEN COALESCE(file_path, '') = '' THEN ''
        ELSE CONCAT('/legacy/teacher-files/', source_db, '/', source_table, '/', file_path)
      END AS image_path,
      CAST(display_order AS CHAR) AS display_order,
      COALESCE(source_db, '') AS source_db,
      COALESCE(source_table, '') AS source_table,
      CAST(COALESCE(source_id, '') AS CHAR) AS source_id
    FROM bnb_legacy_work.teacher_files
    WHERE resolved_teacher_id IN (${teacherIds.join(',')})
      AND NULLIF(TRIM(file_path), '') IS NOT NULL
    ORDER BY resolved_teacher_id ASC, display_order ASC, id ASC
  `;
	const lines = await runMariaDbQuery(sql);
	const filesByTeacher = new Map<string, MariaDbRelatedFile[]>();

	for (const line of lines) {
		const [teacherId = '', title = '', imagePath = '', displayOrder = '', sourceDb = '', sourceTable = '', sourceId = ''] = line.split('\t');
		const files = filesByTeacher.get(teacherId) ?? [];
		files.push({
			displayOrder,
			imagePath,
			sourceDb,
			sourceId,
			sourceTable,
			title,
		});
		filesByTeacher.set(teacherId, files);
	}

	return rows.map(row => ({
		...row,
		relatedFiles: filesByTeacher.get(row.id) ?? [],
	}));
}

function parseRow(line: string): MariaDbTestRow {
	const [id = '', slug = '', sourceDb = '', sourceTable = '', sourceId = '', title = '', meta1 = '', meta2 = '', meta3 = '', imagePath = ''] = line.split('\t');

	return {
		id,
		imagePath,
		meta1,
		meta2,
		meta3,
		slug,
		sourceDb,
		sourceId,
		sourceTable,
		title,
		relatedFiles: [],
	};
}
