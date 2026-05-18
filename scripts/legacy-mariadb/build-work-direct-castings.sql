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
  'g5_write_new_casting_bx',
  'bx-model-agency',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, NULL
FROM `baewoo`.`g5_write_new_casting_bx`
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
  'g5_write_new_casting_enm',
  'bnb-casting',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_casting_enm`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen',
  'highteen',
  'g5_write_new_casting_bx',
  'bx-model-agency',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_casting_bx`
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
  'g5_write_new_casting_enm',
  'bnb-casting',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_casting_enm`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter',
  'kids',
  'g5_write_new_casting_bx',
  'bx-model-agency',
  `wr_id`, `wr_num`, `wr_parent`, `wr_is_comment`, `ca_name`, `wr_option`,
  `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`,
  `wr_email`, `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`,
  `wr_facebook_user`, `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`,
  `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_casting_bx`
WHERE `wr_is_comment` = 0;

INSERT INTO `bnb_legacy_work`.`direct_castings` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `source_center`,
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
  `direct`.`source_db`,
  `direct`.`source_table`,
  `direct`.`wr_id` AS `source_id`,
  CONCAT('direct-casting-', `direct`.`source_db`, '-', REPLACE(`direct`.`source_table`, 'g5_write_', ''), '-', `direct`.`wr_id`) AS `slug`,
  `direct`.`source_center`,
  `direct`.`company`,
  NULLIF(TRIM(`direct`.`wr_subject`), '') AS `title`,
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
  COALESCE(NULLIF(`direct`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `published_at`,
  IF(COALESCE(TRIM(`direct`.`public_value`), '') = '0' OR UPPER(COALESCE(TRIM(`direct`.`public_value`), '')) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`direct`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', `direct`.`source_db`,
    'sourceTable', `direct`.`source_table`,
    'sourceId', `direct`.`wr_id`,
    'sourceCenter', `direct`.`source_center`,
    'company', `direct`.`company`,
    'rawCategory', NULLIF(TRIM(`direct`.`ca_name`), ''),
    'wrHit', `direct`.`wr_hit`,
    'wrFile', `direct`.`wr_file`,
    'wrParent', `direct`.`wr_parent`,
    'wrNum', `direct`.`wr_num`,
    'wrOption', NULLIF(TRIM(`direct`.`wr_option`), ''),
    'public', NULLIF(TRIM(`direct`.`public_value`), ''),
    'rawFields', JSON_OBJECT(
      'wr1', `direct`.`wr_1`,
      'wr2', `direct`.`wr_2`,
      'wr3', `direct`.`wr_3`,
      'wr4', `direct`.`wr_4`,
      'wr5', `direct`.`wr_5`,
      'wr6', `direct`.`wr_6`,
      'wr7', `direct`.`wr_7`,
      'wr8', `direct`.`wr_8`,
      'wr9', `direct`.`wr_9`,
      'wr10', `direct`.`wr_10`
    ),
    'thumbnail', JSON_OBJECT(
      'url', CASE
        WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT(`host`.`base_url`, '/web/data/file/', REPLACE(`direct`.`source_table`, 'g5_write_', ''), '/', `thumbnail`.`bf_file`)
        ELSE NULL
      END,
      'path', CASE
        WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('/legacy/direct-castings/', `direct`.`source_db`, '/', REPLACE(`direct`.`source_table`, 'g5_write_', ''), '/', `direct`.`wr_id`, '/thumbnail/', `thumbnail`.`bf_file`)
        ELSE NULL
      END,
      'originalName', NULLIF(TRIM(`thumbnail`.`bf_source`), ''),
      'fileName', `thumbnail`.`bf_file`,
      'filesize', `thumbnail`.`bf_filesize`
    ),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`direct`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`direct`.`wr_link2`), ''),
      'link1Hit', `direct`.`wr_link1_hit`,
      'link2Hit', `direct`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
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
WHERE NULLIF(TRIM(`direct`.`wr_subject`), '') IS NOT NULL
ORDER BY `direct`.`company`, `direct`.`source_db`, `direct`.`wr_datetime` DESC, `direct`.`wr_id` DESC;
