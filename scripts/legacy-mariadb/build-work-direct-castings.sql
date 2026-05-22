SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`direct_castings`;

CREATE TABLE `bnb_legacy_work`.`direct_castings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `source_center` varchar(32) NOT NULL,
  `centers` longtext NOT NULL CHECK (JSON_VALID(`centers`)),
  `company` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `year_label` varchar(64) DEFAULT NULL,
  `project_info` text DEFAULT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `thumbnail_url` varchar(512) DEFAULT NULL,
  `thumbnail_path` varchar(512) DEFAULT NULL,
  `thumbnail_original_name` varchar(255) DEFAULT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `direct_castings_slug_idx` (`slug`),
  UNIQUE KEY `direct_castings_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `direct_castings_company_idx` (`company`),
  KEY `direct_castings_source_center_idx` (`source_center`),
  KEY `direct_castings_published_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_direct_castings_all`;

CREATE TEMPORARY TABLE `tmp_direct_castings_all` AS
SELECT
  'baewoo' AS `source_db`,
  'art' AS `source_center`,
  'g5_write_new_direct2' AS `source_table`,
  'ucasting' AS `company`,
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public` AS `public_value`
FROM `baewoo`.`g5_write_new_direct2`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'baewoo',
  'art',
  'g5_write_new_direct_bx',
  'bx-model-agency',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, NULL
FROM `baewoo`.`g5_write_new_direct_bx`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen',
  'highteen',
  'g5_write_new_direct2',
  'ucasting',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_direct2`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen',
  'highteen',
  'g5_write_new_direct_img',
  'imground',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_direct_img`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen',
  'highteen',
  'g5_write_new_direct_enm',
  'bnb-casting',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_direct_enm`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen',
  'highteen',
  'g5_write_new_direct_bx',
  'bx-model-agency',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_direct_bx`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter',
  'kids',
  'g5_write_new_direct2',
  'ucasting',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_direct2`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter',
  'kids',
  'g5_write_new_direct_img',
  'imground',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_direct_img`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter',
  'kids',
  'g5_write_new_direct_enm',
  'bnb-casting',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_direct_enm`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter',
  'kids',
  'g5_write_new_direct_bx',
  'bx-model-agency',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_direct_bx`
WHERE `wr_is_comment` = 0;

DROP TEMPORARY TABLE IF EXISTS `tmp_direct_castings_enriched`;

CREATE TEMPORARY TABLE `tmp_direct_castings_enriched` AS
SELECT
  `direct`.`source_db`,
  `direct`.`source_table`,
  `direct`.`wr_id` AS `source_id`,
  `direct`.`source_center`,
  `direct`.`company`,
  NULLIF(TRIM(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    CASE NULLIF(TRIM(`direct`.`wr_subject`), '')
                      WHEN 'JTBC 서른,아홉' THEN 'JTBC 서른, 아홉'
                      ELSE COALESCE(NULLIF(TRIM(`direct`.`wr_subject`), ''), '')
                    END,
                    '넷플릭스',
                    'Netflix'
                  ),
                  'NETFLIX',
                  'Netflix'
                ),
                'Netfilx',
                'Netflix'
              ),
              '채널 A',
              '채널A'
            ),
            'COUPANG PLAY',
            'Coupang Play'
          ),
          'coupang play',
          'Coupang Play'
        ),
        '쿠팡플레이',
        'Coupang Play'
      ),
      '카카오 TV',
      'KakaoTV'
    )
  ), '') AS `title`,
  NULLIF(TRIM(`direct`.`ca_name`), '') AS `year_label`,
  NULLIF(TRIM(`direct`.`wr_2`), '') AS `project_info`,
  NULLIF(`direct`.`wr_content`, '') AS `body_html`,
  CASE
    WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT(`host`.`base_url`, '/web/data/file/', REPLACE(`direct`.`source_table`, 'g5_write_', ''), '/', `thumbnail`.`bf_file`)
    ELSE NULL
  END AS `thumbnail_url`,
  CASE
    WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('/legacy/direct-castings/', `direct`.`source_db`, '/', REPLACE(`direct`.`source_table`, 'g5_write_', ''), '/', `direct`.`wr_id`, '/thumbnail/', `thumbnail`.`bf_file`)
    ELSE NULL
  END AS `thumbnail_path`,
  NULLIF(TRIM(`thumbnail`.`bf_source`), '') AS `thumbnail_original_name`,
  `thumbnail`.`bf_file` AS `thumbnail_file`,
  `thumbnail`.`bf_filesize` AS `thumbnail_filesize`,
  COALESCE(NULLIF(`direct`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `published_at`,
  IF(COALESCE(TRIM(`direct`.`public_value`), '') = '0' OR UPPER(COALESCE(TRIM(`direct`.`public_value`), '')) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`direct`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  CAST(
    (
      CHAR_LENGTH(LOWER(COALESCE(`direct`.`wr_content`, ''))) -
      CHAR_LENGTH(REPLACE(LOWER(COALESCE(`direct`.`wr_content`, '')), '<img', ''))
    ) / 4 AS UNSIGNED
  ) AS `body_image_count`,
  `direct`.`ca_name`,
  `direct`.`wr_hit`,
  `direct`.`wr_file`,
  `direct`.`wr_parent`,
  `direct`.`wr_num`,
  `direct`.`wr_option`,
  `direct`.`public_value`,
  `direct`.`wr_1`,
  `direct`.`wr_2`,
  `direct`.`wr_3`,
  `direct`.`wr_4`,
  `direct`.`wr_5`,
  `direct`.`wr_6`,
  `direct`.`wr_7`,
  `direct`.`wr_8`,
  `direct`.`wr_9`,
  `direct`.`wr_10`,
  `direct`.`wr_link1`,
  `direct`.`wr_link2`,
  `direct`.`wr_link1_hit`,
  `direct`.`wr_link2_hit`
FROM `tmp_direct_castings_all` AS `direct`
JOIN (
  SELECT 'baewoo' AS `source_db`, 'https://www.baewoo.co.kr' AS `base_url`
  UNION ALL SELECT 'bnbhighteen', 'https://www.baewoo.me'
  UNION ALL SELECT 'kidscenter', 'https://www.baewoo.net'
) AS `host`
  ON `host`.`source_db` = `direct`.`source_db`
LEFT JOIN (
  SELECT 'baewoo' AS `source_db`, `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `baewoo`.`g5_board_file`
  UNION ALL
  SELECT 'bnbhighteen', `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `bnbhighteen`.`g5_board_file`
  UNION ALL
  SELECT 'kidscenter', `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `kidscenter`.`g5_board_file`
) AS `thumbnail`
  ON `thumbnail`.`source_db` = `direct`.`source_db`
  AND `thumbnail`.`bo_table` = REPLACE(`direct`.`source_table`, 'g5_write_', '')
  AND `thumbnail`.`wr_id` = `direct`.`wr_id`
  AND `thumbnail`.`bf_no` = 0
  AND NULLIF(TRIM(`thumbnail`.`bf_file`), '') IS NOT NULL
WHERE NULLIF(TRIM(`direct`.`wr_subject`), '') IS NOT NULL;

DROP TEMPORARY TABLE IF EXISTS `tmp_direct_castings_ranked`;

CREATE TEMPORARY TABLE `tmp_direct_castings_ranked` AS
SELECT
  `enriched`.*,
  ROW_NUMBER() OVER (
    PARTITION BY `enriched`.`company`, `enriched`.`title`
    ORDER BY
      `enriched`.`body_image_count` DESC,
      CHAR_LENGTH(COALESCE(`enriched`.`body_html`, '')) DESC,
      FIELD(`enriched`.`source_center`, 'highteen', 'kids', 'art') ASC,
      `enriched`.`published_at` DESC,
      `enriched`.`source_id` DESC
  ) AS `row_rank`
FROM `tmp_direct_castings_enriched` AS `enriched`;

DROP TEMPORARY TABLE IF EXISTS `tmp_direct_castings_title_counts`;

CREATE TEMPORARY TABLE `tmp_direct_castings_title_counts` AS
SELECT
  `title`,
  COUNT(*) AS `title_count`
FROM `tmp_direct_castings_ranked`
WHERE `row_rank` = 1
GROUP BY `title`;

DROP TEMPORARY TABLE IF EXISTS `tmp_direct_castings_slugged`;

CREATE TEMPORARY TABLE `tmp_direct_castings_slugged` AS
SELECT
  `slug_source`.*,
  CASE
    WHEN `slug_source`.`title_count` > 1 THEN CONCAT(`slug_source`.`title_slug`, '-', `slug_source`.`company_slug`)
    ELSE `slug_source`.`title_slug`
  END AS `generated_slug`
FROM (
  SELECT
    `canonical`.*,
    `title_counts`.`title_count`,
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(LOWER(COALESCE(`canonical`.`title`, '')), '[^[:alnum:]]+', '-'), '-+', '-')), ''),
      CONCAT('direct-casting-', `canonical`.`source_id`)
    ) AS `title_slug`,
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(LOWER(COALESCE(`canonical`.`company`, '')), '[^[:alnum:]]+', '-'), '-+', '-')), ''),
      `canonical`.`company`
    ) AS `company_slug`
  FROM `tmp_direct_castings_ranked` AS `canonical`
  JOIN `tmp_direct_castings_title_counts` AS `title_counts`
    ON `title_counts`.`title` = `canonical`.`title`
  WHERE `canonical`.`row_rank` = 1
) AS `slug_source`;

INSERT INTO `bnb_legacy_work`.`direct_castings` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `source_center`,
  `centers`,
  `company`,
  `title`,
  `year_label`,
  `project_info`,
  `body_html`,
  `thumbnail_url`,
  `thumbnail_path`,
  `thumbnail_original_name`,
  `published_at`,
  `is_public`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  `canonical`.`source_db`,
  `canonical`.`source_table`,
  `canonical`.`source_id`,
  `canonical`.`generated_slug` AS `slug`,
  `canonical`.`source_center`,
  `groups`.`centers`,
  `canonical`.`company`,
  `canonical`.`title`,
  `canonical`.`year_label`,
  `canonical`.`project_info`,
  `canonical`.`body_html`,
  `canonical`.`thumbnail_url`,
  `canonical`.`thumbnail_path`,
  `canonical`.`thumbnail_original_name`,
  `canonical`.`published_at`,
  `groups`.`is_public`,
  `canonical`.`created_at`,
  CURRENT_TIMESTAMP,
  JSON_OBJECT(
    'sourceDb', `canonical`.`source_db`,
    'sourceTable', `canonical`.`source_table`,
    'sourceId', `canonical`.`source_id`,
    'sourceCenter', `canonical`.`source_center`,
    'centers', JSON_EXTRACT(`groups`.`centers`, '$'),
    'sourceRecords', JSON_EXTRACT(`groups`.`source_records`, '$'),
    'company', `canonical`.`company`,
    'rawCategory', NULLIF(TRIM(`canonical`.`ca_name`), ''),
    'wrHit', `canonical`.`wr_hit`,
    'wrFile', `canonical`.`wr_file`,
    'wrParent', `canonical`.`wr_parent`,
    'wrNum', `canonical`.`wr_num`,
    'wrOption', NULLIF(TRIM(`canonical`.`wr_option`), ''),
    'public', NULLIF(TRIM(`canonical`.`public_value`), ''),
    'rawFields', JSON_OBJECT(
      'wr1', `canonical`.`wr_1`,
      'wr2', `canonical`.`wr_2`,
      'wr3', `canonical`.`wr_3`,
      'wr4', `canonical`.`wr_4`,
      'wr5', `canonical`.`wr_5`,
      'wr6', `canonical`.`wr_6`,
      'wr7', `canonical`.`wr_7`,
      'wr8', `canonical`.`wr_8`,
      'wr9', `canonical`.`wr_9`,
      'wr10', `canonical`.`wr_10`
    ),
    'thumbnail', JSON_OBJECT(
      'url', `canonical`.`thumbnail_url`,
      'path', `canonical`.`thumbnail_path`,
      'originalName', `canonical`.`thumbnail_original_name`,
      'fileName', `canonical`.`thumbnail_file`,
      'filesize', `canonical`.`thumbnail_filesize`
    ),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`canonical`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`canonical`.`wr_link2`), ''),
      'link1Hit', `canonical`.`wr_link1_hit`,
      'link2Hit', `canonical`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `tmp_direct_castings_slugged` AS `canonical`
JOIN (
  SELECT
    `company`,
    `title`,
    CONCAT(
      '[',
      GROUP_CONCAT(DISTINCT JSON_QUOTE(`source_center`) ORDER BY FIELD(`source_center`, 'art', 'kids', 'highteen') SEPARATOR ','),
      ']'
    ) AS `centers`,
    MAX(`is_public`) AS `is_public`,
    CONCAT(
      '[',
      GROUP_CONCAT(
        JSON_OBJECT(
          'sourceDb', `source_db`,
          'sourceTable', `source_table`,
          'sourceId', `source_id`,
          'sourceCenter', `source_center`
        )
        ORDER BY FIELD(`source_center`, 'art', 'kids', 'highteen'), `source_db`, `source_table`, `source_id`
        SEPARATOR ','
      ),
      ']'
    ) AS `source_records`
  FROM `tmp_direct_castings_enriched`
  GROUP BY `company`, `title`
) AS `groups`
  ON `groups`.`company` = `canonical`.`company`
  AND `groups`.`title` = `canonical`.`title`
ORDER BY `canonical`.`company`, `canonical`.`published_at` DESC, `canonical`.`source_id` DESC;
